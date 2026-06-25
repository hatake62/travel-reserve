import "server-only";

import type { PriceSnapshot } from "@/types/priceHistory";
import {
  createRakutenParams,
  fetchRakutenApi,
  getRakutenCredentials,
  getRakutenResponseBodySnippet,
  maskRakutenUrl,
} from "./rakutenShared";

const VACANT_HOTEL_SEARCH_ENDPOINT =
  "https://openapi.rakuten.co.jp/engine/api/Travel/VacantHotelSearch/20170426";

type FetchRakutenPriceSnapshotParams = {
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
};

type RakutenResponse = {
  hotels?: unknown[];
  error?: string;
  error_description?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toFiniteNumber(value: unknown): number | null {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) && number > 0
    ? number
    : null;
}

function parseResponse(body: string): RakutenResponse | null {
  try {
    return JSON.parse(body) as RakutenResponse;
  } catch {
    return null;
  }
}

function findRecords(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(findRecords);
  if (!isRecord(value)) return [];
  return [
    value,
    ...Object.values(value).flatMap((child) =>
      Array.isArray(child) || isRecord(child) ? findRecords(child) : [],
    ),
  ];
}

function findLowestPrice(value: unknown): number | null {
  const prices = findRecords(value)
    .flatMap((record) => [
      record.total,
      record.rakutenCharge,
      record.hotelMinCharge,
      record.charge,
    ])
    .map(toFiniteNumber)
    .filter((price): price is number => price !== null);

  return prices.length > 0 ? Math.min(...prices) : null;
}

function findBookingUrl(value: unknown): string {
  const url = findRecords(value)
    .flatMap((record) => [
      record.reserveUrl,
      record.hotelInformationUrl,
      record.planListUrl,
    ])
    .find((candidate) => typeof candidate === "string" && candidate.trim());

  return typeof url === "string" ? url.trim() : "";
}

function getRakutenHotelNo(hotelId: string): string {
  return hotelId.replace(/^rakuten-/, "").trim();
}

export async function fetchRakutenPriceSnapshot({
  hotelId,
  checkInDate,
  checkOutDate,
  adults,
}: FetchRakutenPriceSnapshotParams): Promise<PriceSnapshot> {
  const hotelNo = getRakutenHotelNo(hotelId);
  if (!hotelNo) {
    throw new Error("楽天施設番号を取得できませんでした。");
  }

  const params = createRakutenParams(getRakutenCredentials());
  params.set("hotelNo", hotelNo);
  params.set("checkinDate", checkInDate);
  params.set("checkoutDate", checkOutDate);
  params.set("adultNum", String(adults));
  params.set("hits", "1");
  params.set("page", "1");

  const { response, responseBody, requestUrl } = await fetchRakutenApi(
    VACANT_HOTEL_SEARCH_ENDPOINT,
    params,
    { next: { revalidate: 0 } },
  );
  const data = parseResponse(responseBody);

  if (!data || !isRecord(data)) {
    if (!response.ok) {
      console.error("Rakuten price snapshot request failed", {
        status: response.status,
        responseBodySnippet: getRakutenResponseBodySnippet(responseBody),
        url: maskRakutenUrl(requestUrl),
      });
      throw new Error(
        `楽天トラベルAPIから現在価格を取得できませんでした: HTTP ${response.status}`,
      );
    }
    throw new Error("楽天トラベルAPIの価格レスポンス形式が不正です。");
  }

  if (!response.ok || data.error) {
    const detail = data.error_description ?? data.error ?? `HTTP ${response.status}`;
    console.error("Rakuten price snapshot request failed", {
      status: response.status,
      responseBodySnippet: getRakutenResponseBodySnippet(responseBody),
      url: maskRakutenUrl(requestUrl),
    });
    throw new Error(`楽天トラベルAPIから現在価格を取得できませんでした: ${detail}`);
  }

  return {
    hotelId,
    provider: "rakuten",
    checkInDate,
    checkOutDate,
    adults,
    price: findLowestPrice(data.hotels),
    bookingUrl: findBookingUrl(data.hotels),
    capturedAt: new Date().toISOString(),
  };
}
