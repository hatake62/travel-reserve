"use client";

import HotelCard from "@/components/HotelCard";
import SearchForm from "@/components/SearchForm";
import { fetchHotels } from "@/lib/hotelApi";
import type { Hotel } from "@/types/hotel";
import type { SearchCondition } from "@/types/search";
import { useEffect, useRef, useState } from "react";

const initialSearchCondition: SearchCondition = {
  destination: "",
  checkIn: "",
  checkOut: "",
  guests: 2,
  sortBy: "recommended",
  maxPrice: null,
  site: "",
  breakfastOnly: false,
};

const getLowestPrice = (hotel: Hotel) =>
  hotel.offers.reduce<number | undefined>(
    (lowest, offer) =>
      offer.price > 0 && (lowest === undefined || offer.price < lowest)
        ? offer.price
        : lowest,
    undefined,
  );

export default function Home() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [searchCondition, setSearchCondition] = useState<SearchCondition>(
    initialSearchCondition,
  );
  const requestIdRef = useRef(0);

  const loadHotels = async (condition: SearchCondition) => {
    const requestId = ++requestIdRef.current;
    setSearchCondition(condition);
    setIsLoading(true);
    setErrorMessage(null);
    setNoticeMessage(null);

    try {
      const data = await fetchHotels({
        keyword: condition.destination,
        checkIn: condition.checkIn,
        checkOut: condition.checkOut,
        guests: condition.guests,
        onNotice: (message) => {
          if (requestId === requestIdRef.current) setNoticeMessage(message);
        },
      });
      if (requestId === requestIdRef.current) setHotels(data);
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "空室情報の取得に失敗しました",
        );
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;
    const requestId = ++requestIdRef.current;

    fetchHotels()
      .then((data) => {
        if (isActive && requestId === requestIdRef.current) setHotels(data);
      })
      .catch(() => {
        if (isActive && requestId === requestIdRef.current) {
          setErrorMessage(
            "ホテル情報の取得に失敗しました。APIキーや通信状況を確認してください。",
          );
        }
      })
      .finally(() => {
        if (isActive && requestId === requestIdRef.current) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const destination = searchCondition.destination.trim().toLocaleLowerCase("ja");
  const filteredHotels = hotels
    .filter((hotel) => {
      const matchesDestination =
        !destination ||
        hotel.name.toLocaleLowerCase("ja").includes(destination) ||
        hotel.area.toLocaleLowerCase("ja").includes(destination);
      const lowestPrice = getLowestPrice(hotel);
      const matchesMaxPrice =
        searchCondition.maxPrice === null ||
        (lowestPrice !== undefined && lowestPrice <= searchCondition.maxPrice);
      const matchesSite =
        !searchCondition.site ||
        hotel.offers.some((offer) => offer.site === searchCondition.site);
      const matchesBreakfast =
        !searchCondition.breakfastOnly ||
        hotel.offers.some((offer) => offer.hasBreakfast);

      return (
        matchesDestination && matchesMaxPrice && matchesSite && matchesBreakfast
      );
    })
    .sort((a, b) => {
      if (searchCondition.sortBy === "ratingDesc") {
        return b.rating - a.rating;
      }

      if (
        searchCondition.sortBy === "priceAsc" ||
        searchCondition.sortBy === "priceDesc"
      ) {
        const priceA = getLowestPrice(a);
        const priceB = getLowestPrice(b);

        if (priceA === undefined) return priceB === undefined ? 0 : 1;
        if (priceB === undefined) return -1;

        return searchCondition.sortBy === "priceAsc"
          ? priceA - priceB
          : priceB - priceA;
      }

      return 0;
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

        <SearchForm isLoading={isLoading} onSearch={loadHotels} />

        {noticeMessage && (
          <p
            className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"
            role="status"
          >
            {noticeMessage}
          </p>
        )}

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
              {hotels.length}件中{filteredHotels.length}件を表示中
            </p>
          </div>

          {isLoading ? (
            <div
              className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"
              role="status"
            >
              <p className="text-lg font-bold text-slate-800">
                検索中...
              </p>
            </div>
          ) : errorMessage ? (
            <div
              className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-16 text-center shadow-sm"
              role="alert"
            >
              <p className="text-lg font-bold text-rose-800">{errorMessage}</p>
              <p className="mt-2 text-sm text-rose-600">
                時間をおいて、もう一度お試しください。
              </p>
            </div>
          ) : filteredHotels.length > 0 ? (
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
                条件に一致するホテルが見つかりませんでした。
              </p>
              <p className="mt-2 text-sm text-slate-500">
                検索条件を変更して、もう一度お試しください。
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
