import "server-only";

import { Pool, type QueryResultRow } from "pg";
import type {
  PriceCaptureLog,
  PriceCaptureLogItem,
  PriceHistoryParams,
  PriceHistoryPoint,
  PriceSnapshot,
  PriceWatchTarget,
} from "@/types/priceHistory";

export const MAX_ENABLED_PRICE_WATCH_TARGETS = 10;

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
    mealPlan: row.meal_plan === undefined || row.meal_plan === null ? "" : String(row.meal_plan),
    minPrice: row.min_price === undefined || row.min_price === null ? null : Number(row.min_price),
    maxPrice: row.max_price === undefined || row.max_price === null ? null : Number(row.max_price),
    features:
      row.features === undefined || row.features === null || String(row.features).trim() === ""
        ? []
        : String(row.features).split(",").map((feature) => feature.trim()).filter(Boolean),
    hotelName: row.hotel_name === undefined || row.hotel_name === null ? "" : String(row.hotel_name),
    imageUrl: row.image_url === undefined || row.image_url === null ? "" : String(row.image_url),
    address: row.address === undefined || row.address === null ? "" : String(row.address),
    bookingUrl: row.booking_url === undefined || row.booking_url === null ? "" : String(row.booking_url),
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

function mapCaptureLogRow(row: QueryResultRow): PriceCaptureLog {
  return {
    id: row.id === undefined ? undefined : String(row.id),
    startedAt:
      row.started_at instanceof Date
        ? row.started_at.toISOString()
        : String(row.started_at),
    finishedAt:
      row.finished_at instanceof Date
        ? row.finished_at.toISOString()
        : row.finished_at === undefined || row.finished_at === null
        ? undefined
        : String(row.finished_at),
    targetCount: Number(row.target_count),
    successCount: Number(row.success_count),
    failureCount: Number(row.failure_count),
    skippedCount: Number(row.skipped_count),
    message:
      row.message === undefined || row.message === null
        ? undefined
        : String(row.message),
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
          meal_plan,
          min_price,
          max_price,
          features,
          hotel_name,
          image_url,
          address,
          booking_url,
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

export async function getEnabledPriceWatchTargets(
  limit = MAX_ENABLED_PRICE_WATCH_TARGETS,
): Promise<{
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
          meal_plan,
          min_price,
          max_price,
          features,
          hotel_name,
          image_url,
          address,
          booking_url,
          created_at,
          updated_at
        FROM hotel_price_watch_targets
        WHERE enabled = TRUE
        ORDER BY created_at ASC
        LIMIT $1
      `,
      [Math.max(1, Math.min(limit, MAX_ENABLED_PRICE_WATCH_TARGETS))],
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
          meal_plan,
          min_price,
          max_price,
          features,
          hotel_name,
          image_url,
          address,
          booking_url,
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
    const existingResult = await db.query(
      `
        SELECT
          id,
          hotel_id,
          provider,
          check_in_date,
          check_out_date,
          adults,
          enabled,
          meal_plan,
          min_price,
          max_price,
          features,
          hotel_name,
          image_url,
          address,
          booking_url,
          created_at,
          updated_at
        FROM hotel_price_watch_targets
        WHERE hotel_id = $1
          AND provider = $2
          AND check_in_date = $3::date
          AND check_out_date = $4::date
          AND adults = $5
        LIMIT 1
      `,
      [
        target.hotelId,
        target.provider,
        target.checkInDate,
        target.checkOutDate,
        target.adults,
      ],
    );

    if (
      existingResult.rowCount === 0 ||
      existingResult.rows[0]?.enabled === false
    ) {
      const countResult = await db.query(
        `
          SELECT COUNT(*)::int AS enabled_count
          FROM hotel_price_watch_targets
          WHERE enabled = TRUE
        `,
      );
      const enabledCount = Number(countResult.rows[0]?.enabled_count ?? 0);
      if (enabledCount >= MAX_ENABLED_PRICE_WATCH_TARGETS) {
        throw new Error(
          "追跡対象の上限は10件です。不要な追跡を停止してから追加してください。",
        );
      }
    }

    result = await db.query(
      `
        INSERT INTO hotel_price_watch_targets (
          hotel_id,
          provider,
          check_in_date,
          check_out_date,
          adults,
          enabled,
          meal_plan,
          min_price,
          max_price,
          features,
          hotel_name,
          image_url,
          address,
          booking_url,
          updated_at
        )
        VALUES ($1, $2, $3::date, $4::date, $5, TRUE, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        ON CONFLICT (hotel_id, provider, check_in_date, check_out_date, adults)
        DO UPDATE SET
          enabled = TRUE,
          meal_plan = EXCLUDED.meal_plan,
          min_price = EXCLUDED.min_price,
          max_price = EXCLUDED.max_price,
          features = EXCLUDED.features,
          hotel_name = EXCLUDED.hotel_name,
          image_url = EXCLUDED.image_url,
          address = EXCLUDED.address,
          booking_url = EXCLUDED.booking_url,
          updated_at = NOW()
        RETURNING
          id,
          hotel_id,
          provider,
          check_in_date,
          check_out_date,
          adults,
          enabled,
          meal_plan,
          min_price,
          max_price,
          features,
          hotel_name,
          image_url,
          address,
          booking_url,
          created_at,
          updated_at
      `,
      [
        target.hotelId,
        target.provider,
        target.checkInDate,
        target.checkOutDate,
        target.adults,
        target.mealPlan ?? "",
        target.minPrice ?? null,
        target.maxPrice ?? null,
        (target.features ?? []).join(","),
        target.hotelName ?? "",
        target.imageUrl ?? "",
        target.address ?? "",
        target.bookingUrl ?? "",
      ],
    );
  } catch (error) {
    throw new Error(getDatabaseErrorWarning(error));
  }

  return mapTargetRow(result.rows[0]);
}

export async function disablePriceWatchTarget(
  id: string,
  enabled: boolean,
): Promise<PriceWatchTarget | null> {
  const db = getPool();
  if (!db) {
    throw new Error("DATABASE_URLが未設定のため、追跡対象を更新できません。");
  }

  try {
    if (enabled) {
      const targetResult = await db.query(
        `
          SELECT enabled
          FROM hotel_price_watch_targets
          WHERE id = $1::uuid
          LIMIT 1
        `,
        [id],
      );
      if (targetResult.rowCount === 0) return null;
      if (!targetResult.rows[0]?.enabled) {
        const countResult = await db.query(
          `
            SELECT COUNT(*)::int AS enabled_count
            FROM hotel_price_watch_targets
            WHERE enabled = TRUE
          `,
        );
        const enabledCount = Number(countResult.rows[0]?.enabled_count ?? 0);
        if (enabledCount >= MAX_ENABLED_PRICE_WATCH_TARGETS) {
          throw new Error(
            "追跡対象の上限は10件です。不要な追跡を停止してから追加してください。",
          );
        }
      }
    }

    const result = await db.query(
      `
        UPDATE hotel_price_watch_targets
        SET enabled = $2, updated_at = NOW()
        WHERE id = $1::uuid
        RETURNING
          id,
          hotel_id,
          provider,
          check_in_date,
          check_out_date,
          adults,
          enabled,
          meal_plan,
          min_price,
          max_price,
          features,
          hotel_name,
          image_url,
          address,
          booking_url,
          created_at,
          updated_at
      `,
      [id, enabled],
    );
    return result.rowCount === 0 ? null : mapTargetRow(result.rows[0]);
  } catch (error) {
    if (error instanceof Error && error.message.includes("追跡対象の上限")) {
      throw error;
    }
    throw new Error(getDatabaseErrorWarning(error));
  }
}

export async function createCaptureLog(input: {
  startedAt?: string;
  targetCount: number;
  successCount?: number;
  failureCount?: number;
  skippedCount?: number;
  message?: string;
}): Promise<PriceCaptureLog | null> {
  const db = getPool();
  if (!db) return null;

  try {
    const result = await db.query(
      `
        INSERT INTO hotel_price_capture_logs (
          started_at,
          target_count,
          success_count,
          failure_count,
          skipped_count,
          message
        )
        VALUES ($1::timestamptz, $2, $3, $4, $5, $6)
        RETURNING
          id,
          started_at,
          finished_at,
          target_count,
          success_count,
          failure_count,
          skipped_count,
          message
      `,
      [
        input.startedAt ?? new Date().toISOString(),
        input.targetCount,
        input.successCount ?? 0,
        input.failureCount ?? 0,
        input.skippedCount ?? 0,
        input.message ?? "",
      ],
    );
    return mapCaptureLogRow(result.rows[0]);
  } catch {
    return null;
  }
}

export async function updateCaptureLog(
  id: string,
  input: {
    finishedAt?: string;
    targetCount?: number;
    successCount?: number;
    failureCount?: number;
    skippedCount?: number;
    message?: string;
  },
): Promise<PriceCaptureLog | null> {
  const db = getPool();
  if (!db) return null;

  try {
    const result = await db.query(
      `
        UPDATE hotel_price_capture_logs
        SET
          finished_at = $2::timestamptz,
          target_count = COALESCE($3, target_count),
          success_count = COALESCE($4, success_count),
          failure_count = COALESCE($5, failure_count),
          skipped_count = COALESCE($6, skipped_count),
          message = COALESCE($7, message)
        WHERE id = $1::uuid
        RETURNING
          id,
          started_at,
          finished_at,
          target_count,
          success_count,
          failure_count,
          skipped_count,
          message
      `,
      [
        id,
        input.finishedAt ?? new Date().toISOString(),
        input.targetCount ?? null,
        input.successCount ?? null,
        input.failureCount ?? null,
        input.skippedCount ?? null,
        input.message ?? null,
      ],
    );
    return result.rowCount === 0 ? null : mapCaptureLogRow(result.rows[0]);
  } catch {
    return null;
  }
}

export async function createCaptureLogItem(
  input: PriceCaptureLogItem,
): Promise<void> {
  const db = getPool();
  if (!db) return;

  try {
    await db.query(
      `
        INSERT INTO hotel_price_capture_log_items (
          capture_log_id,
          target_id,
          hotel_id,
          provider,
          check_in_date,
          check_out_date,
          adults,
          status,
          message
        )
        VALUES ($1::uuid, $2::uuid, $3, $4, $5::date, $6::date, $7, $8, $9)
      `,
      [
        input.captureLogId,
        input.targetId ?? null,
        input.hotelId,
        input.provider,
        input.checkInDate,
        input.checkOutDate,
        input.adults,
        input.status,
        input.message ?? "",
      ],
    );
  } catch {
    // Capture log item failures should not fail the price capture itself.
  }
}
