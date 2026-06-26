import "server-only";

import type { BookingLinksResponse } from "@/types/bookingLinks";
import {
  appendRakutenTravelSearchParams,
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

function getFallbackUrls(value: unknown): {
  planListUrl: string;
  hotelInformationUrl: string;
} {
  const basicInfo = findRecords(value).find((record) =>
    Boolean(record.hotelNo || record.planListUrl || record.hotelInformationUrl),
  );
  return {
    planListUrl: getString(basicInfo?.planListUrl),
    hotelInformationUrl: getString(basicInfo?.hotelInformationUrl),
  };
}

async function fetchFallbackUrls(hotelNo: string): Promise<{
  planListUrl: string;
  hotelInformationUrl: string;
}> {
  const params = createRakutenParams(getRakutenCredentials());
  params.set("hotelNo", hotelNo);
  params.set("responseType", "middle");

  const { response, responseBody } = await fetchRakutenApi(
    HOTEL_DETAIL_ENDPOINT,
    params,
    { next: { revalidate: 300 } },
  );
  if (!response.ok) return { planListUrl: "", hotelInformationUrl: "" };

  try {
    return getFallbackUrls(JSON.parse(responseBody));
  } catch {
    return { planListUrl: "", hotelInformationUrl: "" };
  }
}

function getSafeRawUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function createDatedUrl(
  url: string,
  params: Pick<FetchRakutenBookingLinksParams, "checkInDate" | "checkOutDate" | "adults">,
): string {
  return appendRakutenTravelSearchParams(url, params);
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
  const detailFallback = result.status === "not_found"
    ? await fetchFallbackUrls(hotelNo)
    : { planListUrl: "", hotelInformationUrl: "" };
  const planListUrl = result.planListUrl || detailFallback.planListUrl;
  const hotelInformationUrl =
    result.hotelInformationUrl || detailFallback.hotelInformationUrl;
  const datedPlanListUrl = createDatedUrl(planListUrl, {
    checkInDate,
    checkOutDate,
    adults,
  });
  const datedHotelInformationUrl = createDatedUrl(hotelInformationUrl, {
    checkInDate,
    checkOutDate,
    adults,
  });
  const datedReserveUrl = createDatedUrl(result.reserveUrl, {
    checkInDate,
    checkOutDate,
    adults,
  });
  const bestUrl = datedReserveUrl || datedPlanListUrl || datedHotelInformationUrl;
  const urlType = datedReserveUrl
    ? "reserveUrl"
    : datedPlanListUrl
    ? "planListUrlWithDate"
    : datedHotelInformationUrl
    ? "hotelInformationUrlWithDate"
    : planListUrl || hotelInformationUrl
    ? "fallbackWithoutDate"
    : "none";
  const fallbackUrl = bestUrl || getSafeRawUrl(planListUrl || hotelInformationUrl);
  const dateParamsApplied = Boolean(bestUrl);

  if (result.status === "not_found") {
    return {
      hotelId,
      checkInDate,
      checkOutDate,
      adults,
      status: "not_found",
      bestUrl: fallbackUrl,
      urlType,
      dateParamsApplied,
      planListUrl: datedPlanListUrl,
      bestReserveUrl: "",
      fallbackUrl,
      links: [],
      price: null,
      sourcePriceField: result.sourcePriceField,
      matchedPlanCount: 0,
      hotelNo,
      rawPlanCount: result.rawPlanCount,
      hasReserveUrl: false,
      hasPlanListUrl: Boolean(planListUrl),
      hasHotelInformationUrl: Boolean(hotelInformationUrl),
      warnings: [
        ...result.warnings,
        dateParamsApplied
          ? "指定条件を付けた楽天トラベルページを開きます。"
          : "指定条件を反映できない可能性があります。楽天トラベル側で日付を再指定してください。",
      ],
    };
  }

  const linkUrl = bestUrl || result.bookingUrl || fallbackUrl;
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
    bestUrl: linkUrl,
    urlType,
    dateParamsApplied,
    planListUrl: datedPlanListUrl,
    bestReserveUrl: linkUrl,
    fallbackUrl,
    links,
    price: result.price,
    sourcePriceField: result.sourcePriceField,
    matchedPlanCount: result.matchedPlanCount,
    hotelNo,
    rawPlanCount: result.rawPlanCount,
    hasReserveUrl: Boolean(result.reserveUrl),
    hasPlanListUrl: Boolean(planListUrl),
    hasHotelInformationUrl: Boolean(hotelInformationUrl),
    warnings: [
      ...result.warnings,
      ...(urlType === "fallbackWithoutDate"
        ? ["指定条件を反映できない可能性があります。楽天トラベル側で日付を再指定してください。"]
        : []),
    ],
  };
}
