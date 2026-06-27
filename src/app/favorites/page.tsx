"use client";

import EmptyState from "@/components/EmptyState";
import HotelCard from "@/components/HotelCard";
import LayoutShell from "@/components/LayoutShell";
import { getFavoriteHotelsSnapshot, subscribeToFavoriteHotelIds, type FavoriteHotel } from "@/lib/favorites";
import type { PriceWatchTarget } from "@/types/priceHistory";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

export default function FavoritesPage() {
  const snapshot = useSyncExternalStore(subscribeToFavoriteHotelIds, getFavoriteHotelsSnapshot, () => "[]");
  const hotels = JSON.parse(snapshot) as FavoriteHotel[];
  const [targets, setTargets] = useState<PriceWatchTarget[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/price-watch/targets", { headers: { Accept: "application/json" } })
      .then((response) => response.json())
      .then((data: { targets?: PriceWatchTarget[] }) => {
        if (active) setTargets(data.targets ?? []);
      })
      .catch(() => {
        if (active) setTargets([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const targetsByHotelId = new Map<string, PriceWatchTarget[]>();
  for (const target of targets) {
    const list = targetsByHotelId.get(target.hotelId) ?? [];
    list.push(target);
    targetsByHotelId.set(target.hotelId, list);
  }

  return (
    <LayoutShell>
      <main className="px-4 py-8 text-slate-900 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
        <Link className="inline-flex text-sm font-bold text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100" href="/">ホテル一覧へ戻る</Link>
        <header className="mb-8 mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-blue-600">Price watch</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">お気に入りホテルの価格推移</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            お気に入りに追加したホテルの宿泊料金を毎日記録し、過去30日間の価格推移を確認できます。価格追跡を開始したホテルは自動でお気に入りに追加されます。
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
              href="/price-watch"
            >
              追跡中の宿泊条件を管理
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
              href="/"
            >
              ホテルを追加する
            </Link>
          </div>
        </header>
        {hotels.length > 0 ? (
          <div className="grid items-start gap-5">
            {hotels.map((hotel) => (
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" key={hotel.id}>
                {(() => {
                  const hotelTargets = targetsByHotelId.get(String(hotel.id)) ?? [];
                  const enabledTargets = hotelTargets.filter((target) => target.enabled);
                  return (
                    <div className="mb-3 rounded-2xl bg-slate-50 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span
                          className={
                            enabledTargets.length > 0
                              ? "w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700"
                              : "w-fit rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600"
                          }
                        >
                          {enabledTargets.length > 0 ? "価格追跡中" : "未追跡"}
                        </span>
                        <Link
                          className="text-sm font-bold text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                          href={`/hotels/${encodeURIComponent(String(hotel.id))}`}
                        >
                          宿泊日を指定して価格推移を見る
                        </Link>
                      </div>
                      {enabledTargets.length > 0 ? (
                        <div className="mt-3 grid gap-2">
                          {enabledTargets.slice(0, 2).map((target) => (
                            <p className="text-sm font-semibold text-slate-700" key={target.id ?? `${target.hotelId}-${target.checkInDate}`}>
                              {target.checkInDate} - {target.checkOutDate} / 大人{target.adults}名
                              {target.mealPlan ? ` / ${target.mealPlan}` : ""}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-600">
                          宿泊日を指定して価格追跡を開始すると、毎日の価格スナップショットを保存できます。
                        </p>
                      )}
                    </div>
                  );
                })()}
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
    </LayoutShell>
  );
}
