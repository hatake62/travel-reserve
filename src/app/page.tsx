"use client";

import EmptyState from "@/components/EmptyState";
import ErrorMessage from "@/components/ErrorMessage";
import FilterChips from "@/components/FilterChips";
import HotelCard from "@/components/HotelCard";
import LoadingState from "@/components/LoadingState";
import MapPlaceholder from "@/components/MapPlaceholder";
import Pagination from "@/components/Pagination";
import SearchForm from "@/components/SearchForm";
import SearchSummary from "@/components/SearchSummary";
import { fetchHotels, HotelApiError, type HotelSearchPagination } from "@/lib/hotelApi";
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

type PageError = {
  message: string;
  hint?: string;
};

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
  const [pagination, setPagination] = useState<HotelSearchPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PageError | null>(null);
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
    setError(null);
    setNoticeMessage(null);

    try {
      const data = await fetchHotels({
        keyword: condition.destination,
        checkIn: condition.checkIn,
        checkOut: condition.checkOut,
        guests: condition.guests,
        page: condition.page,
        rakutenAreaCandidate: condition.rakutenAreaCandidate,
        onNotice: (message) => {
          if (requestId === requestIdRef.current) setNoticeMessage(message);
        },
      });
      if (requestId === requestIdRef.current) {
        setHotels(data.hotels);
        setPagination(data.pagination);
        if (data.warnings.length > 0) setNoticeMessage(data.warnings.join(" / "));
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setError({
          message:
            error instanceof Error
              ? error.message
              : "空室情報の取得に失敗しました",
          hint: error instanceof HotelApiError ? error.hint : undefined,
        });
        setHotels([]);
        setPagination(null);
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
    const nextCondition = { ...condition, page: 1 };
    const params = searchConditionToParams(nextCondition);
    const nextQuery = params.toString();

    if (nextQuery === serializedSearchParams) {
      void loadHotels(nextCondition);
      return;
    }

    pendingSearchRef.current = nextCondition;
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  const handleReset = () => {
    if (!serializedSearchParams) {
      void loadHotels(DEFAULT_SEARCH_CONDITION);
      return;
    }
    router.replace(pathname);
  };

  const applyCondition = (condition: SearchCondition) => {
    const nextCondition = { ...condition, page: 1 };
    const params = searchConditionToParams(nextCondition);
    pendingSearchRef.current = nextCondition;
    router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname);
  };

  const handleRetry = () => {
    void loadHotels(searchCondition);
  };

  const handlePageChange = (page: number) => {
    const nextCondition = { ...searchCondition, page: Math.max(1, page) };
    const params = searchConditionToParams(nextCondition);
    pendingSearchRef.current = nextCondition;
    router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      const matchesMinPrice =
        searchCondition.minPrice === null ||
        (lowestPrice !== undefined && lowestPrice >= searchCondition.minPrice);
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
        matchesDestination &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesSite &&
        matchesBreakfast
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
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
              Hotel Price Tracker
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              ホテルを探して、気になる宿の価格推移を追跡。
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
              検索一覧では候補を広く確認し、お気に入りホテルの宿泊料金を毎日記録できます。
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
        <FilterChips condition={searchCondition} onChange={applyCondition} />

        <section className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)]" aria-labelledby="hotel-list-heading">
          <div className="min-w-0">
            <SearchSummary
              condition={searchCondition}
              displayedCount={filteredHotels.length}
              pagination={pagination}
              warning={noticeMessage}
            />

            <div className="mt-5">
              {isLoading ? (
                <LoadingState />
              ) : error ? (
                <ErrorMessage
                  hint={error.hint}
                  message={error.message}
                  onRetry={handleRetry}
                />
              ) : filteredHotels.length > 0 ? (
                <div className="grid gap-4">
                  {filteredHotels.map((hotel) => (
                    <HotelCard
                      adults={searchCondition.guests}
                      checkIn={searchCondition.checkIn}
                      checkOut={searchCondition.checkOut}
                      hotel={hotel}
                      key={hotel.id}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  actionLabel="条件をリセット"
                  message="価格条件や食事条件をゆるめて再検索してください。"
                  onAction={handleReset}
                />
              )}
              {pagination && !error && (
                <Pagination
                  isLoading={isLoading}
                  onPageChange={handlePageChange}
                  pagination={pagination}
                />
              )}
            </div>
          </div>
          <div className="lg:sticky lg:top-6">
            <MapPlaceholder
              areaName={searchCondition.destination}
              hotelCount={filteredHotels.length}
            />
          </div>
        </section>
        <footer className="mt-12 border-t border-slate-200 pt-6">
          <p className="text-sm leading-6 text-slate-600">
            表示価格や空室状況は取得タイミングにより変動する場合があります。実際の予約条件は各予約サイトで確認してください。
          </p>
        </footer>
      </div>
    </main>
  );
}

function HomeLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <LoadingState message="画面を読み込んでいます..." />
      </div>
    </main>
  );
}
