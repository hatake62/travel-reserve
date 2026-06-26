import "server-only";

import type { BookingLinksResponse } from "@/types/bookingLinks";
import {
  fetchRakutenDateSpecificLowestPrice,
  getRakutenHotelNo,
} from "./rakutenDateSpecificPriceProvider";
import {
  createRakutenParams,
  fetchRakutenApi,
  getRakutenCredentials,
} from "./rakutenShared";

const HOTEL_DETAIL_ENDPOINT =
  "https://openapi.rakuten.co.jp/engine/api/Travel/HotelDetailSearch/20170426";

type FetchRakutenBookingLinksParams = {
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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

function getFallbackUrl(value: unknown): string {
  const basicInfo = findRecords(value).find((record) =>
    Boolean(record.hotelNo || record.planListUrl || record.hotelInformationUrl),
  );
  return (
    getString(basicInfo?.planListUrl) ||
    getString(basicInfo?.hotelInformationUrl)
  );
}

async function fetchFallbackUrl(hotelNo: string): Promise<string> {
  const params = createRakutenParams(getRakutenCredentials());
  params.set("hotelNo", hotelNo);
  params.set("responseType", "middle");

  const { response, responseBody } = await fetchRakutenApi(
    HOTEL_DETAIL_ENDPOINT,
    params,
    { next: { revalidate: 300 } },
  );
  if (!response.ok) return "";

  try {
    return getFallbackUrl(JSON.parse(responseBody));
  } catch {
    return "";
  }
}

export async function fetchRakutenBookingLinks({
  hotelId,
  checkInDate,
  checkOutDate,
  adults,
}: FetchRakutenBookingLinksParams): Promise<BookingLinksResponse> {
  const hotelNo = getRakutenHotelNo(hotelId);
  if (!hotelNo) {
    throw new Error("楽天施設番号を取得できませんでした。");
  }

  const result = await fetchRakutenDateSpecificLowestPrice({
    hotelId,
    checkInDate,
    checkOutDate,
    adults,
  });
  const fallbackUrl =
    result.planListUrl ||
    result.hotelInformationUrl ||
    (result.status === "not_found" ? await fetchFallbackUrl(hotelNo) : "");

  if (result.status === "not_found") {
    return {
      hotelId,
      checkInDate,
      checkOutDate,
      adults,
      status: "not_found",
      planListUrl: result.planListUrl,
      bestReserveUrl: "",
      fallbackUrl,
      links: [],
      price: null,
      sourcePriceField: result.sourcePriceField,
      matchedPlanCount: 0,
      warnings: [
        ...result.warnings,
        "通常の楽天トラベルページを開きます。",
      ],
    };
  }

  const linkUrl = result.bookingUrl || fallbackUrl;
  const links = linkUrl
    ? [
        {
          label: "最安プランを楽天トラベルで見る",
          url: linkUrl,
          price: result.price,
          sourcePriceField: result.sourcePriceField,
          roomName: result.roomName,
          planName: result.planName,
        },
      ]
    : [];

  return {
    hotelId,
    checkInDate,
    checkOutDate,
    adults,
    status: "available",
    planListUrl: result.planListUrl,
    bestReserveUrl: result.bookingUrl,
    fallbackUrl,
    links,
    price: result.price,
    sourcePriceField: result.sourcePriceField,
    matchedPlanCount: result.matchedPlanCount,
    warnings: result.warnings,
  };
}
