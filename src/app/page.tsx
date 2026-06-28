"use client";

import EmptyState from "@/components/EmptyState";
import ErrorMessage from "@/components/ErrorMessage";
import FilterChips from "@/components/FilterChips";
import BottomValueCards from "@/components/BottomValueCards";
import HotelCard from "@/components/HotelCard";
import HotelFiltersSidebar from "@/components/HotelFiltersSidebar";
import LayoutShell from "@/components/LayoutShell";
import LoadingState from "@/components/LoadingState";
import Pagination from "@/components/Pagination";
import SearchForm from "@/components/SearchForm";
import SearchSummary from "@/components/SearchSummary";
import { fetchHotels, HotelApiError, type HotelSearchPagination } from "@/lib/hotelApi";
import { getLowestValidPrice } from "@/lib/price";
import {
  DEFAULT_SEARCH_CONDITION,
  hasHotelSearchCriteria,
  searchConditionToCriteria,
  searchConditionToParams,
  searchParamsToCondition,
} from "@/lib/searchParams";
import type { Hotel } from "@/types/hotel";
import type { SearchCondition } from "@/types/search";
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
  const [searchMeta, setSearchMeta] = useState<{
    searchMaxHotels: number;
    hardLimit: number;
    hasDestination: boolean;
    hasFilters: boolean;
  } | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [searchCondition, setSearchCondition] = useState<SearchCondition>(
    urlCondition,
  );
  const requestIdRef = useRef(0);
  const pendingSearchRef = useRef<SearchCondition | null>(null);
  const restoredScrollRef = useRef(false);
  const scrollSaveTimerRef = useRef<number | null>(null);

  const loadHotels = useCallback(async (condition: SearchCondition) => {
    const requestId = ++requestIdRef.current;
    setSearchCondition(condition);
    const criteria = searchConditionToCriteria(condition);
    if (!hasHotelSearchCriteria(criteria)) {
      setHotels([]);
      setPagination({
        page: 1,
        limit: criteria.limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
      setSearchMeta(null);
      setError(null);
      setNoticeMessage(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    setNoticeMessage(null);

    try {
      const data = await fetchHotels({
        criteria,
        onNotice: (message) => {
          if (requestId === requestIdRef.current) setNoticeMessage(message);
        },
      });
      if (requestId === requestIdRef.current) {
        setHotels(data.hotels);
        setPagination(data.pagination);
        setSearchMeta(data.searchMeta ?? null);
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
        setSearchMeta(null);
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const url = `${pathname}${serializedSearchParams ? `?${serializedSearchParams}` : ""}`;
    const save = () => {
      sessionStorage.setItem(
        "lastHotelSearch",
        JSON.stringify({
          url,
          criteria: searchConditionToCriteria(searchCondition),
          scrollY: window.scrollY,
          savedAt: new Date().toISOString(),
        }),
      );
    };
    save();
    const handlePageHide = () => save();
    const handleScroll = () => {
      if (scrollSaveTimerRef.current !== null) {
        window.clearTimeout(scrollSaveTimerRef.current);
      }
      scrollSaveTimerRef.current = window.setTimeout(save, 200);
    };
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("scroll", handleScroll);
      if (scrollSaveTimerRef.current !== null) {
        window.clearTimeout(scrollSaveTimerRef.current);
      }
    };
  }, [pathname, searchCondition, serializedSearchParams]);

  useEffect(() => {
    if (isLoading || restoredScrollRef.current) return;
    const currentUrl = `${pathname}${serializedSearchParams ? `?${serializedSearchParams}` : ""}`;
    const saved = sessionStorage.getItem("lastHotelSearch");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { url?: string; scrollY?: number };
      if (parsed.url === currentUrl && typeof parsed.scrollY === "number") {
        restoredScrollRef.current = true;
        window.requestAnimationFrame(() => window.scrollTo({ top: parsed.scrollY }));
      }
    } catch {
      // Ignore malformed session storage written by older versions.
    }
  }, [isLoading, pathname, serializedSearchParams]);

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

  const filteredHotels = useMemo(() => {
    return [...hotels].sort((a, b) => {
      if (searchCondition.sortBy === "ratingDesc") {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }
      if (searchCondition.sortBy === "priceAsc" || searchCondition.sortBy === "priceDesc") {
        const priceA = getLowestValidPrice(a.offers);
        const priceB = getLowestValidPrice(b.offers);
        if (priceA === undefined) return priceB === undefined ? 0 : 1;
        if (priceB === undefined) return -1;
        return searchCondition.sortBy === "priceAsc" ? priceA - priceB : priceB - priceA;
      }
      return 0;
    });
  }, [hotels, searchCondition.sortBy]);
  const hasCriteria = hasHotelSearchCriteria(searchConditionToCriteria(searchCondition));

  const applyPopularDestination = (destination: string) => {
    handleSearch({
      ...DEFAULT_SEARCH_CONDITION,
      destination,
      page: 1,
    });
  };

  return (
    <LayoutShell>
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <header className="mb-6">
            <p className="text-sm font-semibold text-blue-600">Hotel discovery</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              ホテルを探す
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              行き先を決めて、気になるホテルをお気に入りに追加しましょう
            </p>
          </header>

          <SearchForm
            initialCondition={urlCondition}
            isLoading={isLoading}
            key={serializedSearchParams}
            onReset={handleReset}
            onSearch={handleSearch}
          />
          <FilterChips condition={searchCondition} onChange={applyCondition} />

          {!hasCriteria ? (
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
              <h2 className="text-2xl font-bold text-slate-950">
                行き先や条件を入力して、気になるホテルを見つけましょう
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                まずは目的地を入力してください。お気に入りに追加すると、指定日の価格推移を毎日確認できます。
              </p>
              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  人気の検索
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {["東京", "大阪", "京都", "沖縄", "札幌", "福岡"].map((destination) => (
                    <button
                      className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                      key={destination}
                      onClick={() => applyPopularDestination(destination)}
                      type="button"
                    >
                      {destination}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <>
          <div className="mt-6 lg:hidden">
            <button
              className="h-11 w-full rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm"
              onClick={() => setIsMobileFiltersOpen((value) => !value)}
              type="button"
            >
              {isMobileFiltersOpen ? "絞り込みを閉じる" : "絞り込みを開く"}
            </button>
            {isMobileFiltersOpen && (
              <div className="mt-3">
                <HotelFiltersSidebar condition={searchCondition} onChange={applyCondition} />
              </div>
            )}
          </div>

          <section
            className="mt-8 grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]"
            aria-labelledby="hotel-list-heading"
          >
            <div className="hidden lg:sticky lg:top-20 lg:block">
              <HotelFiltersSidebar condition={searchCondition} onChange={applyCondition} />
            </div>
            <div className="min-w-0">
              <SearchSummary
                condition={searchCondition}
                displayedCount={filteredHotels.length}
                onSortChange={(nextSortBy) => {
                  applyCondition({ ...searchCondition, sortBy: nextSortBy });
                }}
                pagination={pagination}
                searchMeta={searchMeta}
                sortBy={searchCondition.sortBy}
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
                        hotel={hotel}
                        key={hotel.id}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    actionLabel="条件をリセット"
                    message="価格帯や設備条件をゆるめて再検索してください"
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
          </section>
            </>
          )}

          <BottomValueCards />

          <footer className="mt-8">
            <p className="text-sm leading-6 text-slate-500">
              トップ画面では参考最安値を表示しています。指定日の価格推移はお気に入り追加後に確認できます。実際の料金・設備・食事条件は楽天トラベルで確認してください。
            </p>
          </footer>
        </div>
      </main>
    </LayoutShell>
  );
}

function HomeLoading() {
  return (
    <LayoutShell>
      <main className="px-5 py-10 text-slate-900 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <LoadingState message="画面を読み込んでいます..." />
        </div>
      </main>
    </LayoutShell>
  );
}
