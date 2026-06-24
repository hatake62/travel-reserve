import type { Hotel } from "@/types/hotel";

const KEYWORD_SEARCH_ENDPOINT =
  "https://openapi.rakuten.co.jp/engine/api/Travel/KeywordHotelSearch/20170426";
const HOTEL_DETAIL_ENDPOINT =
  "https://openapi.rakuten.co.jp/engine/api/Travel/HotelDetailSearch/20170426";
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

function toHotel(entry: RakutenHotelEntry): Hotel | null {
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

async function fetchRakutenHotels(
  endpoint: string,
  params: URLSearchParams,
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
    .map(toHotel)
    .filter((hotel): hotel is Hotel => hotel !== null);
}

export async function getRakutenHotels({
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

export async function getRakutenHotelById(
  id: string | number,
): Promise<Hotel | undefined> {
  const credentials = getCredentials();
  const params = createSearchParams(credentials);
  params.set("hotelNo", String(id));

  return (await fetchRakutenHotels(HOTEL_DETAIL_ENDPOINT, params))[0];
}
