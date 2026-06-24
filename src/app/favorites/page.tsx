"use client";

import HotelCard from "@/components/HotelCard";
import {
  getFavoriteHotelIdsSnapshot,
  subscribeToFavoriteHotelIds,
} from "@/lib/favorites";
import { fetchHotels } from "@/lib/hotelApi";
import type { Hotel } from "@/types/hotel";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

const getServerSnapshot = () => "[]";

export default function FavoritesPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const favoriteIdsSnapshot = useSyncExternalStore(
    subscribeToFavoriteHotelIds,
    getFavoriteHotelIdsSnapshot,
    getServerSnapshot,
  );
  const favoriteIds = JSON.parse(favoriteIdsSnapshot) as string[];

  useEffect(() => {
    const controller = new AbortController();

    fetchHotels({ signal: controller.signal })
      .then(setHotels)
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setErrorMessage("ホテル情報の取得に失敗しました");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const favoriteHotels = hotels.filter((hotel) =>
    favoriteIds.includes(String(hotel.id)),
  );

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <Link className="text-sm font-bold text-sky-700 hover:text-sky-900" href="/">
          ← ホテル一覧へ戻る
        </Link>
        <header className="mb-8 mt-6">
          <p className="text-sm font-semibold text-sky-700">保存したホテル</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            お気に入り
          </h1>
        </header>

        {isLoading ? (
          <p className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center font-bold" role="status">
            ホテル情報を読み込んでいます…
          </p>
        ) : errorMessage ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-16 text-center font-bold text-rose-800" role="alert">
            {errorMessage}
          </p>
        ) : favoriteHotels.length > 0 ? (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            {favoriteHotels.map((hotel) => (
              <HotelCard hotel={hotel} key={hotel.id} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center font-bold text-slate-700">
            お気に入りに登録したホテルはまだありません
          </p>
        )}
      </div>
    </main>
  );
}
