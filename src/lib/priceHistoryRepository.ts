import "server-only";

import { Pool, type QueryResultRow } from "pg";
import type {
  PriceHistoryParams,
  PriceHistoryPoint,
  PriceSnapshot,
  TrackedPriceTarget,
} from "@/types/priceHistory";

const DATABASE_URL_MISSING_WARNING =
  "DATABASE_URLが未設定です。サンプルの料金履歴を表示しています。";

const providerLabels: Record<string, string> = {
  rakuten: "楽天トラベル",
  jalan: "じゃらん",
  mock: "サンプル",
};

let pool: Pool | null = null;
const memoryTrackedTargets: TrackedPriceTarget[] = [
  {
    hotelId: "rakuten-78182",
    provider: "rakuten",
    checkInDate: "2026-08-10",
    checkOutDate: "2026-08-11",
    adults: 2,
  },
];

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.trim() || undefined;
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

function createSampleHistory(): PriceHistoryPoint[] {
  const today = new Date();
  const basePrice = 7200;

  return Array.from({ length: 8 }, (_, index) => {
    const capturedAt = new Date(today);
    capturedAt.setDate(today.getDate() - (7 - index) * 4);
    return {
      capturedDate: toDateString(capturedAt),
      price: index === 2 ? null : basePrice + ((index * 650) % 2600),
      provider: "サンプル",
    };
  });
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
      points: createSampleHistory(),
      warnings: [DATABASE_URL_MISSING_WARNING],
    };
  }

  const result = await db.query(
    `
      SELECT
        DATE(captured_at) AS captured_date,
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

  return {
    points: result.rows.map(mapHistoryRow),
    warnings: [],
  };
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

  await db.query(
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
      ON CONFLICT DO NOTHING
    `,
    [
      snapshot.hotelId,
      snapshot.provider,
      snapshot.checkInDate,
      snapshot.checkOutDate,
      snapshot.adults,
      snapshot.price,
      snapshot.bookingUrl ?? "",
      snapshot.capturedAt,
    ],
  );

  return { saved: true, warnings: [] };
}

export async function getTrackedPriceTargets(): Promise<TrackedPriceTarget[]> {
  return memoryTrackedTargets;
}

export async function addTrackedPriceTarget(
  target: TrackedPriceTarget,
): Promise<TrackedPriceTarget> {
  if (
    !memoryTrackedTargets.some(
      (item) =>
        item.hotelId === target.hotelId &&
        item.provider === target.provider &&
        item.checkInDate === target.checkInDate &&
        item.checkOutDate === target.checkOutDate &&
        item.adults === target.adults,
    )
  ) {
    memoryTrackedTargets.push(target);
  }
  return target;
}
