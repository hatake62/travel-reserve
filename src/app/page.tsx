"use client";

import HotelCard from "@/components/HotelCard";
import SearchForm from "@/components/SearchForm";
import { hotels } from "@/data/hotels";
import type { SearchCondition } from "@/types/search";
import { useState } from "react";

const initialSearchCondition: SearchCondition = {
  destination: "",
  checkIn: "",
  checkOut: "",
  guests: 2,
};

export default function Home() {
  const [searchCondition, setSearchCondition] = useState<SearchCondition>(
    initialSearchCondition,
  );
  // Hotel の料金は offers に集約し、検索対象はホテル固有の情報に限定する。
  const destination = searchCondition.destination.trim().toLocaleLowerCase("ja");
  const filteredHotels = hotels.filter((hotel) => {
    if (!destination) return true;

    return (
      hotel.name.toLocaleLowerCase("ja").includes(destination) ||
      hotel.area.toLocaleLowerCase("ja").includes(destination)
    );
  });

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <header className="mb-9 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
            Hotel Price Comparison
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            ぴったりのホテルを、もっと手軽に。
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            目的地と宿泊日を入力して、条件に合うホテルの価格をすばやく比較できます。
          </p>
        </header>

        <SearchForm onSearch={setSearchCondition} />

        <section className="mt-12" aria-labelledby="hotel-list-heading">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-sky-700">おすすめの宿泊先</p>
              <h2
                className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
                id="hotel-list-heading"
              >
                ホテルを比較する
              </h2>
            </div>
            <p
              aria-live="polite"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200"
            >
              {filteredHotels.length}件のホテル
            </p>
          </div>

          {filteredHotels.length > 0 ? (
            <div className="grid items-start gap-6 lg:grid-cols-2">
              {filteredHotels.map((hotel) => (
                <HotelCard hotel={hotel} key={hotel.id} />
              ))}
            </div>
          ) : (
            <div
              className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm"
              role="status"
            >
              <p className="text-lg font-bold text-slate-800">
                条件に一致するホテルが見つかりませんでした
              </p>
              <p className="mt-2 text-sm text-slate-500">
                目的地を変更して、もう一度検索してください。
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
