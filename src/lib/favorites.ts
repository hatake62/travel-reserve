const FAVORITE_HOTEL_IDS_KEY = "favoriteHotelIds";

export const FAVORITES_CHANGED_EVENT = "favoriteHotelIdsChanged";

export function getFavoriteHotelIds(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(FAVORITE_HOTEL_IDS_KEY) ?? "[]",
    );

    if (!Array.isArray(value)) return [];

    return [...new Set(value.filter((id): id is string => typeof id === "string"))];
  } catch {
    return [];
  }
}

function saveFavoriteHotelIds(ids: string[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(FAVORITE_HOTEL_IDS_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
  } catch {
    // localStorageが利用できない環境でも、画面操作を中断させない。
  }
}

export function addFavoriteHotelId(id: string): void {
  const ids = getFavoriteHotelIds();
  if (!ids.includes(id)) saveFavoriteHotelIds([...ids, id]);
}

export function removeFavoriteHotelId(id: string): void {
  saveFavoriteHotelIds(getFavoriteHotelIds().filter((favoriteId) => favoriteId !== id));
}

export function toggleFavoriteHotelId(id: string): string[] {
  const ids = getFavoriteHotelIds();
  const nextIds = ids.includes(id)
    ? ids.filter((favoriteId) => favoriteId !== id)
    : [...ids, id];

  saveFavoriteHotelIds(nextIds);
  return nextIds;
}

export function isFavoriteHotel(id: string): boolean {
  return getFavoriteHotelIds().includes(id);
}

export function getFavoriteHotelIdsSnapshot(): string {
  return JSON.stringify(getFavoriteHotelIds());
}

export function subscribeToFavoriteHotelIds(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener(FAVORITES_CHANGED_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(FAVORITES_CHANGED_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
