import type { Hotel } from "@/types/hotel";
import type { HotelSearchParams } from "@/types/search";
import { searchCriteriaToApiParams } from "@/lib/searchParams";
import {
  getErrorMessageFromResponse,
  type ApiErrorResponse,
} from "@/lib/apiError";

const HOTELS_API_PATH = "/api/hotels";

export type HotelSearchPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type HotelSearchResponse = {
  hotels: Hotel[];
  pagination: HotelSearchPagination;
  warnings: string[];
  searchSkipped?: boolean;
  reason?: string;
  searchMeta?: {
    searchMaxHotels: number;
    hardLimit: number;
    hasDestination: boolean;
    hasFilters: boolean;
  };
};

export type FetchHotelsOptions = HotelSearchParams & {
  signal?: AbortSignal;
  onNotice?: (message: string) => void;
};

export class HotelApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly hint?: string,
  ) {
    super(message);
    this.name = "HotelApiError";
  }
}

async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    const error = getErrorMessageFromResponse(
      await response.json().catch(() => ({})),
      "ホテル情報の取得に失敗しました",
    );
    throw new HotelApiError(error.error, response.status, error.hint);
  }

  return response.json() as Promise<T>;
}

export async function fetchHotels({
  criteria,
  keyword,
  checkIn,
  checkOut,
  guests,
  minPrice,
  maxPrice,
  minUserRating,
  minHotelClass,
  amenities,
  rakutenAreaCandidate,
  areaClassCode,
  middleClassCode,
  smallClassCode,
  detailClassCode,
  page,
  limit,
  signal,
  onNotice,
}: FetchHotelsOptions = {}): Promise<HotelSearchResponse> {
  if (typeof window !== "undefined") {
    const params = criteria ? searchCriteriaToApiParams(criteria) : new URLSearchParams();
    if (keyword?.trim()) params.set("keyword", keyword.trim());
    if (minPrice !== null && minPrice !== undefined) params.set("minPrice", String(minPrice));
    if (maxPrice !== null && maxPrice !== undefined) params.set("maxPrice", String(maxPrice));
    if (minUserRating !== null && minUserRating !== undefined) {
      params.set("minUserRating", String(minUserRating));
    }
    if (minHotelClass !== null && minHotelClass !== undefined) {
      params.set("minHotelClass", String(minHotelClass));
    }
    if (amenities && amenities.length > 0) params.set("amenities", amenities.join(","));
    if (page && page > 1) params.set("page", String(page));
    if (limit) params.set("limit", String(limit));
    const resolvedAreaClassCode = rakutenAreaCandidate?.areaClassCode ?? areaClassCode;
    const resolvedMiddleClassCode = rakutenAreaCandidate?.middleClassCode ?? middleClassCode;
    const resolvedSmallClassCode = rakutenAreaCandidate?.smallClassCode ?? smallClassCode;
    const resolvedDetailClassCode = rakutenAreaCandidate?.detailClassCode ?? detailClassCode;
    if (resolvedAreaClassCode) params.set("areaClassCode", resolvedAreaClassCode);
    if (resolvedMiddleClassCode) params.set("middleClassCode", resolvedMiddleClassCode);
    if (resolvedSmallClassCode) params.set("smallClassCode", resolvedSmallClassCode);
    if (resolvedDetailClassCode) params.set("detailClassCode", resolvedDetailClassCode);
    const query = params.size > 0 ? `?${params.toString()}` : "";
    const response = await fetch(`${HOTELS_API_PATH}${query}`, {
      headers: { Accept: "application/json" },
      signal,
    });
    if (!response.ok) {
      const error = getErrorMessageFromResponse(
        (await response.json().catch(() => ({}))) as Partial<ApiErrorResponse>,
        "空室情報の取得に失敗しました",
      );
      throw new HotelApiError(error.error, response.status, error.hint);
    }
    const notice = response.headers.get("X-Hotel-Search-Notice");
    if (notice) onNotice?.(decodeURIComponent(notice));
    const data = (await response.json()) as HotelSearchResponse;
    if (data.warnings.length > 0) onNotice?.(data.warnings.join(" / "));
    return data;
  }

  const { getHotelProvider } = await import("@/lib/hotelProviders");
  const hotels = await getHotelProvider().getHotels({
    keyword,
    checkIn,
    checkOut,
    guests,
    rakutenAreaCandidate,
    areaClassCode,
    middleClassCode,
    smallClassCode,
    detailClassCode,
    page,
    limit,
    minPrice,
    maxPrice,
    minUserRating,
    minHotelClass,
    amenities,
    onNotice,
  });
  return {
    hotels,
    pagination: {
      page: 1,
      limit: hotels.length || 10,
      total: hotels.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
    warnings: [],
  };
}

export async function fetchHotelById(
  id: string | number,
): Promise<Hotel | null> {
  if (typeof window !== "undefined") {
    return fetchJson<Hotel>(`${HOTELS_API_PATH}/${encodeURIComponent(id)}`);
  }

  const { getHotelProvider } = await import("@/lib/hotelProviders");
  return (await getHotelProvider().getHotelById(id)) ?? null;
}
