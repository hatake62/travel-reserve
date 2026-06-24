import type { Hotel } from "@/types/hotel";

const HOTELS_API_PATH = "/api/hotels";

type ApiErrorResponse = {
  error?: string;
  message?: string;
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

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiErrorResponse;
    throw new HotelApiError(
      error.error ?? error.message ?? "ホテル情報の取得に失敗しました",
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

export async function fetchHotels(): Promise<Hotel[]> {
  if (typeof window !== "undefined") {
    return fetchJson<Hotel[]>(HOTELS_API_PATH);
  }

  const { getHotelProvider } = await import("@/lib/hotelProviders");
  return getHotelProvider().getHotels();
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
