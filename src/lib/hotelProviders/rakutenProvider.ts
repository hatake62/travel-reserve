import type { Hotel } from "@/types/hotel";
import type { HotelSearchParams } from "@/types/search";

const KEYWORD_SEARCH_ENDPOINT =
  "https://openapi.rakuten.co.jp/engine/api/Travel/KeywordHotelSearch/20170426";
const HOTEL_DETAIL_ENDPOINT =
  "https://openapi.rakuten.co.jp/engine/api/Travel/HotelDetailSearch/20170426";
const VACANT_HOTEL_SEARCH_ENDPOINT =
  "https://openapi.rakuten.co.jp/engine/api/Travel/VacantHotelSearch/20170426";
const DEFAULT_KEYWORD = "東京";

type RakutenHotelBasicInfo = {
  hotelNo?: number | string | null;
  hotelName?: string | null;
  hotelInformationUrl?: string | null;
  planListUrl?: string | null;
  hotelMinCharge?: number | string | null;
  address1?: string | null;
  address2?: string | null;
  hotelImageUrl?: string | null;
  hotelThumbnailUrl?: string | null;
  reviewAverage?: number | string | null;
};

type RakutenHotelEntry = {
  hotelBasicInfo?: RakutenHotelBasicInfo;
  hotelDetailInfo?: { areaName?: string | null };
  roomInfo?: Array<{
    roomBasicInfo?: {
      roomName?: string | null;
      planName?: string | null;
      dailyCharge?: { total?: number | string | null } | null;
      reserveUrl?: string | null;
      withBreakfastFlag?: number | string | null;
    };
  }>;
};

type RakutenHotelResponse = {
  hotels?: RakutenHotelEntry[];
  error?: string;
  error_description?: string;
};

type RakutenCredentials = {
  applicationId: string;
  accessKey: string;
  affiliateId?: string;
};

function getCredentials(): RakutenCredentials {
  const applicationId = process.env.RAKUTEN_TRAVEL_APP_ID;
  const accessKey = process.env.RAKUTEN_TRAVEL_ACCESS_KEY;

  if (!applicationId) {
    throw new Error(
      "RAKUTEN_TRAVEL_APP_IDが設定されていません。.env.localを確認してください。",
    );
  }

  if (!accessKey) {
    throw new Error(
      "RAKUTEN_TRAVEL_ACCESS_KEYが設定されていません。.env.localを確認してください。",
    );
  }

  return {
    applicationId,
    accessKey,
    affiliateId: process.env.RAKUTEN_AFFILIATE_ID || undefined,
  };
}

function createSearchParams(credentials: RakutenCredentials): URLSearchParams {
  const params = new URLSearchParams({
    applicationId: credentials.applicationId,
    accessKey: credentials.accessKey,
    format: "json",
    formatVersion: "2",
  });

  if (credentials.affiliateId) {
    params.set("affiliateId", credentials.affiliateId);
  }

  return params;
}

function toFiniteNumber(value: number | string | null | undefined): number {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : 0;
}

export type RakutenVacantHotelParams = HotelSearchParams & {
  hotelNo?: string | number;
  largeClassCode?: string;
  middleClassCode?: string;
  smallClassCode?: string;
  detailClassCode?: string;
  latitude?: number;
  longitude?: number;
  searchRadius?: number;
};

export function mapRakutenHotelToHotel(
  entry: RakutenHotelEntry,
): Hotel | null {
  const basicInfo = entry.hotelBasicInfo;
  if (!basicInfo?.hotelNo || !basicInfo.hotelName) return null;

  const address = `${basicInfo.address1 ?? ""}${basicInfo.address2 ?? ""}`.trim();
  const bookingUrl =
    basicInfo.hotelInformationUrl || basicInfo.planListUrl || "";

  return {
    id: Number(basicInfo.hotelNo),
    name: basicInfo.hotelName,
    area: address || entry.hotelDetailInfo?.areaName || "エリア情報なし",
    rating: toFiniteNumber(basicInfo.reviewAverage),
    imageUrl:
      basicInfo.hotelImageUrl || basicInfo.hotelThumbnailUrl || "",
    offers: [
      {
        site: "楽天トラベル",
        price: Math.max(0, toFiniteNumber(basicInfo.hotelMinCharge)),
        bookingUrl,
        roomType: "プラン詳細は予約サイトで確認",
        hasBreakfast: false,
        cancellation: "予約サイトで確認",
      },
    ],
  };
}

export function mapRakutenVacantHotelToHotel(
  entry: RakutenHotelEntry,
): Hotel | null {
  const hotel = mapRakutenHotelToHotel(entry);
  if (!hotel) return null;

  const offers: Hotel["offers"] = (entry.roomInfo ?? []).flatMap(
    ({ roomBasicInfo }) => {
      if (!roomBasicInfo) return [];
      return [
        {
          site: "楽天トラベル",
          price: Math.max(0, toFiniteNumber(roomBasicInfo.dailyCharge?.total)),
          bookingUrl:
            roomBasicInfo.reserveUrl || hotel.offers[0]?.bookingUrl || "",
          roomType:
            [roomBasicInfo.roomName, roomBasicInfo.planName]
              .filter(Boolean)
              .join(" / ") || "空室プラン",
          hasBreakfast: String(roomBasicInfo.withBreakfastFlag) === "1",
          cancellation: "予約サイトで確認",
        },
      ];
    },
  );

  return offers.length > 0 ? { ...hotel, offers } : hotel;
}

async function fetchRakutenHotels(
  endpoint: string,
  params: URLSearchParams,
  mapper: (entry: RakutenHotelEntry) => Hotel | null = mapRakutenHotelToHotel,
): Promise<Hotel[]> {
  const response = await fetch(`${endpoint}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
  });
  const data = (await response.json().catch(() => null)) as RakutenHotelResponse | null;

  if (response.status === 404 && data?.error === "not_found") {
    return [];
  }

  if (!response.ok || !data || data.error) {
    const detail = data?.error_description ?? data?.error ?? `HTTP ${response.status}`;
    throw new Error(`楽天トラベルAPIからホテル情報を取得できませんでした: ${detail}`);
  }

  return (data.hotels ?? [])
    .map(mapper)
    .filter((hotel): hotel is Hotel => hotel !== null);
}

export async function getRakutenHotelsByKeyword({
  keyword,
}: { keyword?: string } = {}): Promise<Hotel[]> {
  const credentials = getCredentials();
  const params = createSearchParams(credentials);
  params.set("keyword", keyword?.trim() || DEFAULT_KEYWORD);
  params.set("hits", "10");
  params.set("page", "1");
  params.set("sort", "standard");

  return fetchRakutenHotels(KEYWORD_SEARCH_ENDPOINT, params);
}

function hasVacantSearchArea(params: RakutenVacantHotelParams): boolean {
  const hasAreaCode = Boolean(
    params.largeClassCode && params.middleClassCode && params.smallClassCode,
  );
  const hasCoordinates =
    Number.isFinite(params.latitude) && Number.isFinite(params.longitude);
  return Boolean(params.hotelNo || hasAreaCode || hasCoordinates);
}

export async function getRakutenVacantHotels(
  options: RakutenVacantHotelParams = {},
): Promise<Hotel[]> {
  const { keyword, checkIn, checkOut, guests } = options;

  if (!checkIn || !checkOut || !guests) {
    return getRakutenHotelsByKeyword({ keyword });
  }

  // VacantHotelSearch does not accept a free-text keyword as its location.
  // TODO: resolve keyword to Rakuten area codes or hotel numbers before this call.
  // TODO: expose area-code and coordinate selection in the search UI/API contract.
  if (!hasVacantSearchArea(options)) {
    return getRakutenHotelsByKeyword({ keyword });
  }

  const credentials = getCredentials();
  const params = createSearchParams(credentials);
  params.set("checkinDate", checkIn);
  params.set("checkoutDate", checkOut);
  params.set("adultNum", String(guests));
  params.set("hits", "10");
  params.set("page", "1");

  if (options.hotelNo) params.set("hotelNo", String(options.hotelNo));
  if (options.largeClassCode) params.set("largeClassCode", options.largeClassCode);
  if (options.middleClassCode) params.set("middleClassCode", options.middleClassCode);
  if (options.smallClassCode) params.set("smallClassCode", options.smallClassCode);
  if (options.detailClassCode) params.set("detailClassCode", options.detailClassCode);
  if (options.latitude !== undefined) params.set("latitude", String(options.latitude));
  if (options.longitude !== undefined) params.set("longitude", String(options.longitude));
  if (options.searchRadius !== undefined) {
    params.set("searchRadius", String(options.searchRadius));
  }

  return fetchRakutenHotels(
    VACANT_HOTEL_SEARCH_ENDPOINT,
    params,
    mapRakutenVacantHotelToHotel,
  );
}

/** @deprecated Use getRakutenHotelsByKeyword or getRakutenVacantHotels. */
export const getRakutenHotels = getRakutenHotelsByKeyword;

export async function getRakutenHotelById(
  id: string | number,
): Promise<Hotel | undefined> {
  const credentials = getCredentials();
  const params = createSearchParams(credentials);
  params.set("hotelNo", String(id));

  return (await fetchRakutenHotels(HOTEL_DETAIL_ENDPOINT, params))[0];
}
