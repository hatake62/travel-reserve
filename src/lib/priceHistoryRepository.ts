import "server-only";

import { Pool, type QueryResultRow } from "pg";
import type {
  PriceHistoryParams,
  PriceHistoryPoint,
  PriceSnapshot,
  PriceWatchTarget,
} from "@/types/priceHistory";

const DATABASE_URL_MISSING_WARNING =
  "DATABASE_URLが未設定のため、実データの料金履歴を取得できません。";

const providerLabels: Record<string, string> = {
  rakuten: "楽天トラベル",
};

let pool: Pool | null = null;

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.trim() || undefined;
}

export function hasPriceHistoryDatabase(): boolean {
  return Boolean(getDatabaseUrl());
}

function getPool(): Pool | null {
  const connectionString = getDatabaseUrl();
  if (!connectionString) return null;
  pool ??= new Pool({
    connectionString,
    max: 3,
    ssl: connectionString.includes("sslmode=disable")
      ? false
      : { rejectUnauthorized: false },
  });
  return pool;
}

function toDateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getDatabaseErrorWarning(error: unknown): string {
  const message = error instanceof Error ? error.message : "不明なDBエラー";
  return `DB接続またはクエリに失敗したため、実データの料金履歴を取得できません: ${message.slice(0, 120)}`;
}

function mapHistoryRow(row: QueryResultRow): PriceHistoryPoint {
  const capturedDate =
    row.captured_date instanceof Date
      ? toDateString(row.captured_date)
      : String(row.captured_date);
  const price = row.price === null || row.price === undefined ? null : Number(row.price);
  return {
    capturedDate,
    price: Number.isFinite(price) ? price : null,
    provider: providerLabels[String(row.provider)] ?? String(row.provider),
  };
}

export async function getPriceHistory(
  params: PriceHistoryParams,
): Promise<{ points: PriceHistoryPoint[]; warnings: string[] }> {
  const db = getPool();
  if (!db) {
    return {
      points: [],
      warnings: [DATABASE_URL_MISSING_WARNING],
    };
  }

  try {
    const result = await db.query(
      `
        SELECT
          DATE(captured_at AT TIME ZONE 'Asia/Tokyo') AS captured_date,
          provider,
          price
        FROM hotel_price_snapshots
        WHERE hotel_id = $1
          AND check_in_date = $2::date
          AND check_out_date = $3::date
          AND adults = $4
          AND captured_at >= NOW() - INTERVAL '30 days'
        ORDER BY captured_at ASC
      `,
      [params.hotelId, params.checkInDate, params.checkOutDate, params.adults],
    );

    const points = result.rows.map(mapHistoryRow);
    return {
      points,
      warnings:
        points.length === 0
          ? ["まだこの条件の実データ料金履歴がありません。"]
          : [],
    };
  } catch (error) {
    return {
      points: [],
      warnings: [getDatabaseErrorWarning(error)],
    };
  }
}

export async function savePriceSnapshot(
  snapshot: PriceSnapshot,
): Promise<{ saved: boolean; warnings: string[] }> {
  const db = getPool();
  if (!db) {
    return {
      saved: false,
      warnings: ["DATABASE_URLが未設定のため、料金スナップショットは保存していません。"],
    };
  }

  const values = [
    snapshot.hotelId,
    snapshot.provider,
    snapshot.checkInDate,
    snapshot.checkOutDate,
    snapshot.adults,
    snapshot.price,
    snapshot.bookingUrl ?? "",
    snapshot.capturedAt,
  ];

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const updateResult = await client.query(
      `
        UPDATE hotel_price_snapshots
        SET
          price = $6,
          booking_url = $7,
          captured_at = $8::timestamptz
        WHERE hotel_id = $1
          AND provider = $2
          AND check_in_date = $3::date
          AND check_out_date = $4::date
          AND adults = $5
          AND (captured_at AT TIME ZONE 'Asia/Tokyo')::date =
            ($8::timestamptz AT TIME ZONE 'Asia/Tokyo')::date
      `,
      values,
    );

    if (updateResult.rowCount === 0) {
      await client.query(
        `
          INSERT INTO hotel_price_snapshots (
            hotel_id,
            provider,
            check_in_date,
            check_out_date,
            adults,
            price,
            booking_url,
            captured_at
          )
          VALUES ($1, $2, $3::date, $4::date, $5, $6, $7, $8::timestamptz)
        `,
        values,
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    return {
      saved: false,
      warnings: [getDatabaseErrorWarning(error)],
    };
  } finally {
    client.release();
  }

  return { saved: true, warnings: [] };
}

function mapTargetRow(row: QueryResultRow): PriceWatchTarget {
  return {
    id: row.id === undefined ? undefined : String(row.id),
    hotelId: String(row.hotel_id),
    provider: "rakuten",
    checkInDate:
      row.check_in_date instanceof Date
        ? toDateString(row.check_in_date)
        : String(row.check_in_date),
    checkOutDate:
      row.check_out_date instanceof Date
        ? toDateString(row.check_out_date)
        : String(row.check_out_date),
    adults: Number(row.adults),
    enabled: Boolean(row.enabled),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at === undefined
        ? undefined
        : String(row.created_at),
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : row.updated_at === undefined
        ? undefined
        : String(row.updated_at),
  };
}

export async function getTrackedPriceTargets(): Promise<{
  targets: PriceWatchTarget[];
  warnings: string[];
}> {
  const db = getPool();
  if (!db) {
    return {
      targets: [],
      warnings: [
        "DATABASE_URLが未設定のため、追跡対象を取得できません。",
      ],
    };
  }

  try {
    const result = await db.query(
      `
        SELECT
          id,
          hotel_id,
          provider,
          check_in_date,
          check_out_date,
          adults,
          enabled,
          created_at,
          updated_at
        FROM hotel_price_watch_targets
        WHERE enabled = TRUE
        ORDER BY created_at ASC
      `,
    );
    return {
      targets: result.rows.map(mapTargetRow),
      warnings: [],
    };
  } catch (error) {
    return {
      targets: [],
      warnings: [getDatabaseErrorWarning(error)],
    };
  }
}

export async function getPriceWatchTargets(): Promise<{
  targets: PriceWatchTarget[];
  warnings: string[];
}> {
  const db = getPool();
  if (!db) {
    return {
      targets: [],
      warnings: [
        "DATABASE_URLが未設定のため、追跡対象を取得できません。",
      ],
    };
  }

  try {
    const result = await db.query(
      `
        SELECT
          id,
          hotel_id,
          provider,
          check_in_date,
          check_out_date,
          adults,
          enabled,
          created_at,
          updated_at
        FROM hotel_price_watch_targets
        ORDER BY enabled DESC, created_at DESC
      `,
    );
    return {
      targets: result.rows.map(mapTargetRow),
      warnings: [],
    };
  } catch (error) {
    return {
      targets: [],
      warnings: [getDatabaseErrorWarning(error)],
    };
  }
}

export async function addTrackedPriceTarget(
  target: PriceWatchTarget,
): Promise<PriceWatchTarget> {
  const db = getPool();
  if (!db) {
    throw new Error("DATABASE_URLが未設定のため、料金推移の記録を開始できません。");
  }

  let result;
  try {
    result = await db.query(
      `
        INSERT INTO hotel_price_watch_targets (
          hotel_id,
          provider,
          check_in_date,
          check_out_date,
          adults,
          enabled,
          updated_at
        )
        VALUES ($1, $2, $3::date, $4::date, $5, TRUE, NOW())
        ON CONFLICT (hotel_id, provider, check_in_date, check_out_date, adults)
        DO UPDATE SET enabled = TRUE, updated_at = NOW()
        RETURNING
          id,
          hotel_id,
          provider,
          check_in_date,
          check_out_date,
          adults,
          enabled,
          created_at,
          updated_at
      `,
      [
        target.hotelId,
        target.provider,
        target.checkInDate,
        target.checkOutDate,
        target.adults,
      ],
    );
  } catch (error) {
    throw new Error(getDatabaseErrorWarning(error));
  }

  return mapTargetRow(result.rows[0]);
}
