"use client";

import {
  getFavoriteHotelIdsSnapshot,
  subscribeToFavoriteHotelIds,
  toggleFavoriteHotelId,
} from "@/lib/favorites";
import { useSyncExternalStore } from "react";

type FavoriteButtonProps = {
  hotelId: string | number;
};

const getServerSnapshot = () => "[]";

export default function FavoriteButton({ hotelId }: FavoriteButtonProps) {
  const id = String(hotelId);
  const favoriteIdsSnapshot = useSyncExternalStore(
    subscribeToFavoriteHotelIds,
    getFavoriteHotelIdsSnapshot,
    getServerSnapshot,
  );
  const isFavorite = (JSON.parse(favoriteIdsSnapshot) as string[]).includes(id);

  return (
    <button
      aria-pressed={isFavorite}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border px-3 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-amber-200 ${
        isFavorite
          ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
          : "border-slate-300 bg-white text-slate-700 hover:border-amber-300 hover:text-amber-700"
      }`}
      onClick={() => toggleFavoriteHotelId(id)}
      type="button"
    >
      {isFavorite ? "★ お気に入り済み" : "☆ お気に入り"}
    </button>
  );
}
