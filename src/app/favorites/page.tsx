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
        <Link className="inline-flex text-sm font-bold text-sky-700 hover:text-sky-900" href="/">← ホテル一覧へ戻る</Link>
        <header className="mb-8 mt-6">
          <p className="text-sm font-semibold text-sky-700">価格追跡するホテル</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">お気に入り</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">お気に入りに追加したホテルの宿泊料金を毎日記録し、過去30日間の価格推移を確認できます。価格追跡はホテル詳細ページから開始できます。</p>
        </header>
        {hotels.length > 0 ? (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            {hotels.map((hotel) => <HotelCard hotel={hotel} key={hotel.id} />)}
          </div>
        ) : (
          <EmptyState actionLabel="ホテルを探す" message="お気に入りに追加したホテルだけ価格推移を確認できます。" onAction={() => { window.location.href = "/"; }} title="お気に入りホテルはまだありません" />
        )}
      </div>
    </main>
  );
}
