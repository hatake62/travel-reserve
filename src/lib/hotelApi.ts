import type { Hotel } from "@/types/hotel";
import type { HotelSearchParams } from "@/types/search";

const HOTELS_API_PATH = "/api/hotels";

type ApiErrorResponse = {
  error?: string;
  message?: string;
};

export type FetchHotelsOptions = HotelSearchParams & {
  signal?: AbortSignal;
  onNotice?: (message: string) => void;
};

export class HotelApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
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
    const error = (await response.json().catch(() => ({}))) as ApiErrorResponse;
    throw new HotelApiError(
      error.error ?? error.message ?? "ホテル情報の取得に失敗しました",
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

export async function fetchHotels({
  keyword,
  checkIn,
  checkOut,
  guests,
  signal,
  onNotice,
}: FetchHotelsOptions = {}): Promise<Hotel[]> {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams();
    if (keyword?.trim()) params.set("keyword", keyword.trim());
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests !== undefined) params.set("guests", String(guests));
    const query = params.size > 0 ? `?${params.toString()}` : "";
    const response = await fetch(`${HOTELS_API_PATH}${query}`, {
      headers: { Accept: "application/json" },
      signal,
    });
    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as ApiErrorResponse;
      throw new HotelApiError(
        error.error ?? error.message ?? "空室情報の取得に失敗しました",
        response.status,
      );
    }
    const notice = response.headers.get("X-Hotel-Search-Notice");
    if (notice) onNotice?.(decodeURIComponent(notice));
    return response.json() as Promise<Hotel[]>;
  }

  const { getHotelProvider } = await import("@/lib/hotelProviders");
  return getHotelProvider().getHotels({ keyword, checkIn, checkOut, guests });
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
