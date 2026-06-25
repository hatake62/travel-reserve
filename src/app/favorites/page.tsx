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
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          className="inline-flex text-sm font-bold text-sky-700 hover:text-sky-900 focus:outline-none focus:ring-4 focus:ring-sky-200"
          href="/"
        >
          ← ホテル一覧へ戻る
        </Link>
        <header className="mb-8 mt-6">
          <p className="text-sm font-semibold text-sky-700">保存したホテル</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            お気に入り
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            比較したいホテルを一覧からまとめて確認できます。
          </p>
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
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <p className="font-bold text-slate-800">
              お気に入りに登録したホテルはまだありません
            </p>
            <p className="mt-2 text-sm text-slate-500">
              ホテルカードや詳細ページのボタンから追加できます。
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
