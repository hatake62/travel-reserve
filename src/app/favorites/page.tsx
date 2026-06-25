"use client";

import EmptyState from "@/components/EmptyState";
import ErrorMessage from "@/components/ErrorMessage";
import HotelCard from "@/components/HotelCard";
import LoadingState from "@/components/LoadingState";
import {
  getFavoriteHotelIdsSnapshot,
  subscribeToFavoriteHotelIds,
} from "@/lib/favorites";
import { fetchHotels, HotelApiError } from "@/lib/hotelApi";
import type { Hotel } from "@/types/hotel";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const getServerSnapshot = () => "[]";

type PageError = {
  message: string;
  hint?: string;
};

export default function FavoritesPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PageError | null>(null);
  const favoriteIdsSnapshot = useSyncExternalStore(
    subscribeToFavoriteHotelIds,
    getFavoriteHotelIdsSnapshot,
    getServerSnapshot,
  );
  const favoriteIds = JSON.parse(favoriteIdsSnapshot) as string[];

  const loadHotels = useCallback((resetState = true) => {
    const controller = new AbortController();

    if (resetState) {
      setIsLoading(true);
      setError(null);
    }
    fetchHotels({ signal: controller.signal })
      .then(setHotels)
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setError({
          message:
            error instanceof Error
              ? error.message
              : "ホテル情報の取得に失敗しました",
          hint: error instanceof HotelApiError ? error.hint : undefined,
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return controller;
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetchHotels({ signal: controller.signal })
      .then(setHotels)
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setError({
          message:
            error instanceof Error
              ? error.message
              : "ホテル情報の取得に失敗しました",
          hint: error instanceof HotelApiError ? error.hint : undefined,
        });
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
          <LoadingState message="お気に入りのホテル情報を読み込んでいます..." />
        ) : error ? (
          <ErrorMessage
            hint={error.hint}
            message={error.message}
            onRetry={() => {
              loadHotels();
            }}
          />
        ) : favoriteHotels.length > 0 ? (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            {favoriteHotels.map((hotel) => (
              <HotelCard hotel={hotel} key={hotel.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            actionLabel="ホテルを探す"
            message="ホテルカードや詳細ページのボタンから追加できます。"
            onAction={() => {
              window.location.href = "/";
            }}
            title="お気に入りに登録したホテルはまだありません"
          />
        )}
      </div>
    </main>
  );
}
