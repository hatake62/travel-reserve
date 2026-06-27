"use client";

import EmptyState from "@/components/EmptyState";
import HotelCard from "@/components/HotelCard";
import { getFavoriteHotelsSnapshot, subscribeToFavoriteHotelIds, type FavoriteHotel } from "@/lib/favorites";
import Link from "next/link";
import { useSyncExternalStore } from "react";

export default function FavoritesPage() {
  const snapshot = useSyncExternalStore(subscribeToFavoriteHotelIds, getFavoriteHotelsSnapshot, () => "[]");
  const hotels = JSON.parse(snapshot) as FavoriteHotel[];
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link className="inline-flex text-sm font-bold text-sky-700 hover:text-sky-900 focus:outline-none focus:ring-4 focus:ring-sky-200" href="/">ホテル一覧へ戻る</Link>
        <header className="mb-8 mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-sky-700">Price Watch Favorites</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">お気に入りホテルの価格推移</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            お気に入りに追加したホテルの宿泊料金を毎日記録し、過去30日間の価格推移を確認できます。価格追跡を開始したホテルは自動でお気に入りに追加されます。
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-xl bg-sky-700 px-5 text-sm font-bold text-white hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
              href="/price-watch"
            >
              追跡中の宿泊条件を管理
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
              href="/"
            >
              ホテルを追加する
            </Link>
          </div>
        </header>
        {hotels.length > 0 ? (
          <div className="grid items-start gap-5">
            {hotels.map((hotel) => (
              <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm" key={hotel.id}>
                <div className="mb-3 flex flex-col gap-2 px-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    お気に入り
                  </span>
                  <p className="text-xs font-semibold text-slate-500">
                    価格グラフはホテル詳細ページの宿泊条件ごとに表示します。
                  </p>
                </div>
                <HotelCard hotel={hotel} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            actionLabel="ホテルを探す"
            message="お気に入りに追加したホテルだけ価格推移を確認できます。価格追跡を開始すると、お気に入りにも自動追加されます。"
            onAction={() => { window.location.href = "/"; }}
            title="お気に入りホテルはまだありません"
          />
        )}
      </div>
    </main>
  );
}
