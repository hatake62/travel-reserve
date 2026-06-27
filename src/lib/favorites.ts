import type { Hotel } from "@/types/hotel";

const FAVORITE_HOTELS_KEY = "favoriteHotels";
const LEGACY_FAVORITE_HOTEL_IDS_KEY = "favoriteHotelIds";
export const FAVORITES_CHANGED_EVENT = "favoriteHotelIdsChanged";
export type FavoriteHotel = Hotel & { addedAt: string };

function readFavorites(): FavoriteHotel[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(FAVORITE_HOTELS_KEY) ?? "[]");
    return Array.isArray(value)
      ? value.filter((hotel): hotel is FavoriteHotel => typeof hotel === "object" && hotel !== null && "id" in hotel && "name" in hotel)
      : [];
  } catch { return []; }
}

function saveFavorites(hotels: FavoriteHotel[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FAVORITE_HOTELS_KEY, JSON.stringify(hotels));
    window.localStorage.setItem(LEGACY_FAVORITE_HOTEL_IDS_KEY, JSON.stringify(hotels.map((hotel) => String(hotel.id))));
    window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
  } catch { /* localStorageを使えない環境でも画面操作を中断しない。 */ }
}

export function getFavoriteHotels(): FavoriteHotel[] { return readFavorites(); }
export function getFavoriteHotelsSnapshot(): string { return JSON.stringify(getFavoriteHotels()); }
export function upsertFavoriteHotel(hotel: Hotel): void {
  const favorites = readFavorites();
  const index = favorites.findIndex((favorite) => String(favorite.id) === String(hotel.id));
  const next: FavoriteHotel = { ...hotel, addedAt: favorites[index]?.addedAt ?? new Date().toISOString() };
  saveFavorites(index === -1 ? [...favorites, next] : favorites.map((favorite, current) => current === index ? next : favorite));
}
export const addFavoriteHotel = upsertFavoriteHotel;
export const syncFavoriteFromWatchTarget = upsertFavoriteHotel;
export function removeFavoriteHotel(hotelId: string): void { saveFavorites(readFavorites().filter((hotel) => String(hotel.id) !== hotelId)); }
export function getFavoriteHotelIds(): string[] { return readFavorites().map((hotel) => String(hotel.id)); }
export function addFavoriteHotelId(id: string): void {
  if (isFavoriteHotel(id) || typeof window === "undefined") return;
  window.localStorage.setItem(LEGACY_FAVORITE_HOTEL_IDS_KEY, JSON.stringify([...getFavoriteHotelIds(), id]));
  window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
}
export function removeFavoriteHotelId(id: string): void { removeFavoriteHotel(id); }
export function isFavoriteHotel(id: string): boolean { return getFavoriteHotelIds().includes(id); }
export function toggleFavoriteHotelId(id: string): string[] { if (isFavoriteHotel(id)) removeFavoriteHotel(id); else addFavoriteHotelId(id); return getFavoriteHotelIds(); }
export function getFavoriteHotelIdsSnapshot(): string { return JSON.stringify(getFavoriteHotelIds()); }
export function subscribeToFavoriteHotelIds(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(FAVORITES_CHANGED_EVENT, callback); window.addEventListener("storage", callback);
  return () => { window.removeEventListener(FAVORITES_CHANGED_EVENT, callback); window.removeEventListener("storage", callback); };
}
