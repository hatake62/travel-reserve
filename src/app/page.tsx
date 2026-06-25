"use client";

import HotelCard from "@/components/HotelCard";
import SearchForm from "@/components/SearchForm";
import { fetchHotels } from "@/lib/hotelApi";
import { getLowestValidPrice } from "@/lib/price";
import {
  DEFAULT_SEARCH_CONDITION,
  searchConditionToParams,
  searchParamsToCondition,
} from "@/lib/searchParams";
import type { Hotel } from "@/types/hotel";
import type { SearchCondition } from "@/types/search";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serializedSearchParams = searchParams.toString();
  const urlCondition = useMemo(
    () => searchParamsToCondition(new URLSearchParams(serializedSearchParams)),
    [serializedSearchParams],
  );
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [searchCondition, setSearchCondition] = useState<SearchCondition>(
    urlCondition,
  );
  const requestIdRef = useRef(0);
  const pendingSearchRef = useRef<SearchCondition | null>(null);

  const loadHotels = useCallback(async (condition: SearchCondition) => {
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
        rakutenAreaCandidate: condition.rakutenAreaCandidate,
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
  }, []);

  useEffect(() => {
    const pendingCondition = pendingSearchRef.current;
    const condition =
      pendingCondition &&
      searchConditionToParams(pendingCondition).toString() ===
        serializedSearchParams
        ? pendingCondition
        : urlCondition;
    pendingSearchRef.current = null;
    void Promise.resolve().then(() => loadHotels(condition));
  }, [loadHotels, serializedSearchParams, urlCondition]);

  const handleSearch = (condition: SearchCondition) => {
    const params = searchConditionToParams(condition);
    const nextQuery = params.toString();

    if (nextQuery === serializedSearchParams) {
      void loadHotels(condition);
      return;
    }

    pendingSearchRef.current = condition;
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  const handleReset = () => {
    if (!serializedSearchParams) {
      void loadHotels(DEFAULT_SEARCH_CONDITION);
      return;
    }
    router.replace(pathname);
  };

  // 地区コード検索はサーバー側で絞り込み済み。displayName（階層表記）を
  // ホテル住所へ再度部分一致させると、正しい結果まで除外してしまう。
  const destination = searchCondition.rakutenAreaCandidate
    ? ""
    : searchCondition.destination.trim().toLocaleLowerCase("ja");
  const filteredHotels = hotels
    .filter((hotel) => {
      const matchesDestination =
        !destination ||
        hotel.name.toLocaleLowerCase("ja").includes(destination) ||
        hotel.area.toLocaleLowerCase("ja").includes(destination);
      const lowestPrice = getLowestValidPrice(hotel.offers);
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
        const priceA = getLowestValidPrice(a.offers);
        const priceB = getLowestValidPrice(b.offers);

        if (priceA === undefined) return priceB === undefined ? 0 : 1;
        if (priceB === undefined) return -1;

        return searchCondition.sortBy === "priceAsc"
          ? priceA - priceB
          : priceB - priceA;
      }

      return 0;
    });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
            Hotel Price Comparison
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            ぴったりのホテルを、もっと手軽に。
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            目的地と宿泊日を入力して、条件に合うホテルの価格をすばやく比較できます。
          </p>
          </div>
          <Link
            className="inline-flex w-fit rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 transition hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-200"
            href="/favorites"
          >
            ★ お気に入りを見る
          </Link>
        </header>

        <SearchForm
          initialCondition={urlCondition}
          isLoading={isLoading}
          key={serializedSearchParams}
          onReset={handleReset}
          onSearch={handleSearch}
        />

        {noticeMessage && (
          <p
            className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"
            role="status"
          >
            {noticeMessage}
          </p>
        )}

        <section className="mt-12" aria-labelledby="hotel-list-heading">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
              {hotels.length}件中 {filteredHotels.length}件を表示中
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

function HomeLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900 sm:px-6 sm:py-14">
      <div
        className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"
        role="status"
      >
        <p className="text-lg font-bold text-slate-800">読み込み中...</p>
      </div>
    </main>
  );
}
