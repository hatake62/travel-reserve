import type { Hotel } from "@/types/hotel";

const HOTELS_API_PATH = "/api/hotels";

type ApiErrorResponse = {
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
      error.message ?? "ホテル情報の取得に失敗しました",
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

export function fetchHotels(): Promise<Hotel[]> {
  return fetchJson<Hotel[]>(HOTELS_API_PATH);
}

export function fetchHotelById(id: string | number): Promise<Hotel> {
  return fetchJson<Hotel>(`${HOTELS_API_PATH}/${encodeURIComponent(id)}`);
}
