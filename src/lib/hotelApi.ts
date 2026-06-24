import type { Hotel } from "@/types/hotel";

const HOTELS_API_PATH = "/api/hotels";

type ApiErrorResponse = {
  error?: string;
  message?: string;
};

export type FetchHotelsOptions = {
  keyword?: string;
  signal?: AbortSignal;
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
  signal,
}: FetchHotelsOptions = {}): Promise<Hotel[]> {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams();
    if (keyword?.trim()) params.set("keyword", keyword.trim());
    const query = params.size > 0 ? `?${params.toString()}` : "";
    return fetchJson<Hotel[]>(`${HOTELS_API_PATH}${query}`, signal);
  }

  const { getHotelProvider } = await import("@/lib/hotelProviders");
  return getHotelProvider().getHotels({ keyword });
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
