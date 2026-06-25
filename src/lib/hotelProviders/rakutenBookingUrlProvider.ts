import "server-only";

import type { BookingLink, BookingLinksResponse } from "@/types/bookingLinks";
import {
  createRakutenParams,
  fetchRakutenApi,
  getRakutenCredentials,
  getRakutenResponseBodySnippet,
  maskRakutenUrl,
} from "./rakutenShared";

const VACANT_HOTEL_SEARCH_ENDPOINT =
  "https://openapi.rakuten.co.jp/engine/api/Travel/VacantHotelSearch/20170426";
const HOTEL_DETAIL_ENDPOINT =
  "https://openapi.rakuten.co.jp/engine/api/Travel/HotelDetailSearch/20170426";

type FetchRakutenBookingLinksParams = {
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

function parseResponse(body: string): RakutenResponse | null {
  try {
    return JSON.parse(body) as RakutenResponse;
  } catch {
    return null;
  }
}

function toPositiveNumber(value: unknown): number | null {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) && number > 0
    ? number
    : null;
}

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getRakutenHotelNo(hotelId: string): string {
  return hotelId.replace(/^rakuten-/, "").trim();
}

function applyStayParams(
  url: URL,
  checkInDate: string,
  checkOutDate: string,
  adults: number,
): void {
  const [checkInYear, checkInMonth, checkInDay] = checkInDate.split("-");
  const [checkOutYear, checkOutMonth, checkOutDay] = checkOutDate.split("-");
  url.searchParams.set("f_nen1", checkInYear);
  url.searchParams.set("f_tuki1", checkInMonth);
  url.searchParams.set("f_hi1", checkInDay);
  url.searchParams.set("f_nen2", checkOutYear);
  url.searchParams.set("f_tuki2", checkOutMonth);
  url.searchParams.set("f_hi2", checkOutDay);
  url.searchParams.set("f_otona_su", String(adults));
  if (!url.searchParams.has("f_heya_su")) {
    url.searchParams.set("f_heya_su", "1");
  }
}

function createPlanDetailUrl({
  reserveUrl,
  hotelNo,
  checkInDate,
  checkOutDate,
  adults,
}: {
  reserveUrl: string;
  hotelNo: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
}): string {
  if (!reserveUrl) return "";
  try {
    const sourceUrl = new URL(reserveUrl);
    const planUrl = new URL(
      `https://hotel.travel.rakuten.co.jp/hotelinfo/plan/${hotelNo}`,
    );
    sourceUrl.searchParams.forEach((value, key) => {
      planUrl.searchParams.set(key, value);
    });
    applyStayParams(planUrl, checkInDate, checkOutDate, adults);
    return planUrl.toString();
  } catch {
    return "";
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

function findHotelBasicInfo(value: unknown): Record<string, unknown> | null {
  return findRecords(value).find((record) =>
    Boolean(record.hotelNo || record.hotelName || record.planListUrl),
  ) ?? null;
}

function getRoomPrice(record: Record<string, unknown>): number | null {
  const dailyCharge = isRecord(record.dailyCharge) ? record.dailyCharge : {};
  return toPositiveNumber(dailyCharge.total) ??
    toPositiveNumber(dailyCharge.rakutenCharge) ??
    toPositiveNumber(record.total) ??
    toPositiveNumber(record.rakutenCharge);
}

function extractBookingLinks(
  value: unknown,
  fallbackUrl: string,
  {
    hotelNo,
    checkInDate,
    checkOutDate,
    adults,
  }: {
    hotelNo: string;
    checkInDate: string;
    checkOutDate: string;
    adults: number;
  },
): {
  links: BookingLink[];
  planListUrl: string;
  bestReserveUrl: string;
  fallbackUrl: string;
} {
  const basicInfo = findHotelBasicInfo(value);
  const planListUrl = getString(basicInfo?.planListUrl);
  const hotelInformationUrl = getString(basicInfo?.hotelInformationUrl);
  const resolvedFallbackUrl = fallbackUrl || planListUrl || hotelInformationUrl;
  const links = findRecords(value)
    .filter((record) => record.reserveUrl || record.roomName || record.planName)
    .map((record): BookingLink | null => {
      const reserveUrl = getString(record.reserveUrl);
      const planDetailUrl = createPlanDetailUrl({
        reserveUrl,
        hotelNo,
        checkInDate,
        checkOutDate,
        adults,
      });
      if (!planDetailUrl) return null;
      const price = getRoomPrice(record);
      return {
        label: "最安プランを楽天トラベルで見る",
        url: planDetailUrl,
        price,
        roomName: getString(record.roomName) || undefined,
        planName: getString(record.planName) || undefined,
      };
    })
    .filter((link): link is BookingLink => link !== null)
    .sort((a, b) => {
      if (a.price === null) return b.price === null ? 0 : 1;
      if (b.price === null) return -1;
      return a.price - b.price;
    });

  return {
    links,
    planListUrl,
    bestReserveUrl: links[0]?.url ?? "",
    fallbackUrl: resolvedFallbackUrl,
  };
}

function isNotFoundResponse(response: Response, data: RakutenResponse | null, body: string): boolean {
  const detail = `${data?.error ?? ""} ${data?.error_description ?? ""} ${body}`;
  return response.status === 404 ||
    data?.error === "not_found" ||
    /not[_\s-]?found|Data Not Found/i.test(detail);
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
  const data = parseResponse(responseBody);
  const basicInfo = findHotelBasicInfo(data?.hotels);
  return getString(basicInfo?.planListUrl) || getString(basicInfo?.hotelInformationUrl);
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

  const fallbackUrl = await fetchFallbackUrl(hotelNo);
  const params = createRakutenParams(getRakutenCredentials());
  params.set("hotelNo", hotelNo);
  params.set("checkinDate", checkInDate);
  params.set("checkoutDate", checkOutDate);
  params.set("adultNum", String(adults));
  params.set("searchPattern", "1");
  params.set("hits", "10");
  params.set("page", "1");
  params.set("sort", "+roomCharge");
  params.set("responseType", "large");

  const { response, responseBody, requestUrl } = await fetchRakutenApi(
    VACANT_HOTEL_SEARCH_ENDPOINT,
    params,
    { next: { revalidate: 0 } },
  );
  const data = parseResponse(responseBody);

  if (isNotFoundResponse(response, data, responseBody)) {
    return {
      hotelId,
      checkInDate,
      checkOutDate,
      adults,
      status: "not_found",
      planListUrl: "",
      bestReserveUrl: "",
      fallbackUrl,
      links: [],
      warnings: [
        "指定条件に合う空室・料金が見つかりませんでした。通常の楽天トラベルページを開きます。",
      ],
    };
  }

  if (!data || !isRecord(data) || !response.ok || data.error) {
    console.error("Rakuten booking link request failed", {
      status: response.status,
      responseBodySnippet: getRakutenResponseBodySnippet(responseBody),
      url: maskRakutenUrl(requestUrl),
    });
    const detail = data?.error_description ?? data?.error ?? `HTTP ${response.status}`;
    throw new Error(`楽天トラベルAPIから予約リンクを取得できませんでした: ${detail}`);
  }

  const extracted = extractBookingLinks(data.hotels, fallbackUrl, {
    hotelNo,
    checkInDate,
    checkOutDate,
    adults,
  });
  const effectiveFallbackUrl =
    extracted.fallbackUrl || extracted.planListUrl || extracted.bestReserveUrl;

  return {
    hotelId,
    checkInDate,
    checkOutDate,
    adults,
    status: extracted.links.length > 0 || extracted.planListUrl ? "available" : "not_found",
    planListUrl: extracted.planListUrl,
    bestReserveUrl: extracted.bestReserveUrl,
    fallbackUrl: effectiveFallbackUrl,
    links: extracted.links,
    warnings:
      extracted.links.length > 0 || extracted.planListUrl
        ? []
        : ["指定条件に合う予約リンクを取得できませんでした。通常の楽天トラベルページを開きます。"],
  };
}
