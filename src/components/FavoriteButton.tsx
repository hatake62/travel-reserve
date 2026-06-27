"use client";

import {
  getFavoriteHotelIdsSnapshot,
  removeFavoriteHotel,
  subscribeToFavoriteHotelIds,
  upsertFavoriteHotel,
} from "@/lib/favorites";
import type { Hotel } from "@/types/hotel";
import { useSyncExternalStore } from "react";

type FavoriteButtonProps = {
  hotelId: string | number;
  hotel?: Hotel;
};

const getServerSnapshot = () => "[]";

export default function FavoriteButton({ hotelId, hotel }: FavoriteButtonProps) {
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
      className={`inline-flex shrink-0 items-center justify-center rounded-full border px-3 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
        isFavorite
          ? "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600"
      }`}
      onClick={() => {
        if (isFavorite) {
          const shouldRemove = window.confirm(
            "このホテルは価格追跡中の場合があります。お気に入りから削除しても価格追跡は停止されません。価格追跡を止める場合は、価格追跡停止ボタンを押してください。",
          );
          if (shouldRemove) removeFavoriteHotel(id);
        } else if (hotel) upsertFavoriteHotel(hotel);
      }}
      type="button"
    >
      {isFavorite ? "お気に入り済み" : "お気に入り"}
    </button>
  );
}
