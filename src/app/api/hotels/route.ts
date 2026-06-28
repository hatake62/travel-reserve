import { createApiErrorResponse, getProviderErrorHint } from "@/lib/apiError";
import { applyHotelDiscoveryFilters } from "@/lib/hotelDiscoveryFilters";
import { getHotelProvider } from "@/lib/hotelProviders";
import { getLowestValidPrice } from "@/lib/price";
import {
  hasHotelSearchCriteria,
  hasHotelSearchFilters,
  searchParamsToCriteria,
} from "@/lib/searchParams";
import type { Hotel } from "@/types/hotel";
import type { SearchCriteriaSort } from "@/types/search";
import { NextResponse } from "next/server";

const DATE_SPECIFIC_PRICE_HOTEL_LIMIT = 0;
const DEFAULT_PAGE_SIZE = 10;

function parseEnvPositiveInteger(name: string, defaultValue: number): number {
  const parsed = Number(process.env[name]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
}

function getSearchLimits(criteria: ReturnType<typeof searchParamsToCriteria>) {
  const hardLimit = parseEnvPositiveInteger("RAKUTEN_SEARCH_MAX_HOTELS_HARD_LIMIT", 300);
  const defaultMax = parseEnvPositiveInteger("RAKUTEN_SEARCH_MAX_HOTELS_DEFAULT", 120);
  const withFiltersMax = parseEnvPositiveInteger("RAKUTEN_SEARCH_MAX_HOTELS_WITH_FILTERS", 180);
  const hasDestination = Boolean(criteria.destination?.trim() || criteria.area);
  const hasFilters = hasHotelSearchFilters(criteria);
  const requested = hasDestination && hasFilters ? withFiltersMax : defaultMax;
  return {
    hardLimit,
    hasDestination,
    hasFilters,
    searchMaxHotels: Math.min(requested, hardLimit),
  };
}

function sortHotels(hotels: Hotel[], sort: SearchCriteriaSort | undefined): Hotel[] {
  return [...hotels].sort((a, b) => {
    if (sort === "rating_desc") return (b.rating ?? 0) - (a.rating ?? 0);
    if (sort === "price_asc" || sort === "price_desc") {
      const priceA = getLowestValidPrice(a.offers);
      const priceB = getLowestValidPrice(b.offers);
      if (priceA === undefined) return priceB === undefined ? 0 : 1;
      if (priceB === undefined) return -1;
      return sort === "price_asc" ? priceA - priceB : priceB - priceA;
    }
    return 0;
  });
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const criteria = searchParamsToCriteria(params);
    const debug = params.get("debug") === "true";
    const limits = getSearchLimits(criteria);
    const emptyPagination = {
      page: 1,
      limit: criteria.limit || DEFAULT_PAGE_SIZE,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    };
    if (!hasHotelSearchCriteria(criteria)) {
      return NextResponse.json({
        searchSkipped: true,
        reason: "No search criteria provided.",
        hotels: [],
        pagination: emptyPagination,
        warnings: [],
        ...(debug
          ? {
              debug: {
                searchSkipped: true,
                reason: "No search criteria provided.",
                searchMaxHotels: limits.searchMaxHotels,
                hardLimit: limits.hardLimit,
                hasDestination: false,
                hasFilters: false,
                rakutenHitsPerPage: 30,
                rakutenPagesRequested: 0,
                rakutenPagesFetched: 0,
                rakutenPageResults: [],
                rateLimitHit: false,
                cacheHit: false,
                rawHotelCount: 0,
                mappedHotelCount: 0,
                mergedHotelCount: 0,
                beforeClientFilterCount: 0,
                afterClientFilterCount: 0,
                returnedCount: 0,
                pagination: emptyPagination,
                warnings: [],
              },
            }
          : {}),
      });
    }
    const ignoredTopSearchParams = ["mealPlan", "checkIn", "checkOut", "guests"].filter((key) =>
      params.has(key),
    );
    const providerNotices: string[] = [];
    if (ignoredTopSearchParams.length > 0) {
      providerNotices.push(
        `${ignoredTopSearchParams.join(", ")} are used in price tracking or detail flows, not top hotel search results.`,
      );
    }

    const result = await getHotelProvider().getHotelsWithDebug?.({
      criteria,
      keyword: criteria.destination,
      largeClassCode: criteria.area?.largeClassCode,
      areaClassCode: criteria.area?.largeClassCode,
      middleClassCode: criteria.area?.middleClassCode,
      smallClassCode: criteria.area?.smallClassCode,
      detailClassCode: criteria.area?.detailClassCode,
      minPrice: criteria.minPrice,
      maxPrice: criteria.maxPrice,
      sort: criteria.sort,
      searchMaxHotels: limits.searchMaxHotels,
      onNotice: (notice: string) => providerNotices.push(notice),
    });
    if (!result) throw new Error("ホテルProviderの検索結果を取得できませんでした。");

    const apiFilters = new Set(result.debug.appliedApiFilters ?? []);
    const rawMergedHotels = result.hotels;
    const filtered = applyHotelDiscoveryFilters(rawMergedHotels, {
      minPrice: criteria.minPrice,
      maxPrice: criteria.maxPrice,
      minUserRating: criteria.minUserRating,
      minHotelClass: criteria.minHotelClass,
      amenities: criteria.amenities ?? [],
      applyPriceFilter:
        (criteria.minPrice !== undefined && !apiFilters.has("minPrice")) ||
        (criteria.maxPrice !== undefined && !apiFilters.has("maxPrice")),
    });
    const hotels = sortHotels(filtered.hotels, criteria.sort);
    const totalBeforePagination = hotels.length;
    const totalPages = Math.max(1, Math.ceil(totalBeforePagination / criteria.limit));
    const resolvedPage = Math.min(criteria.page, totalPages);
    const offset = (resolvedPage - 1) * criteria.limit;
    const pageHotels = hotels.slice(offset, offset + criteria.limit);
    const responseHotels = pageHotels.map((hotel) => ({
      ...hotel,
      offers: hotel.offers.map((offer) => ({
        ...offer,
        isDateSpecific: false,
        priceLabel: offer.priceLabel ?? "参考最安値",
        sourcePriceField: offer.sourcePriceField ?? "reference",
      })),
    }));
    const fallbackWarnings = result.debug.warnings.filter((warning) =>
      warning.includes("周辺エリア"),
    );
    const warnings = [...result.debug.warnings, ...fallbackWarnings, ...providerNotices];
    const pagination = {
      page: resolvedPage,
      limit: criteria.limit,
      total: totalBeforePagination,
      totalPages,
      hasNext: resolvedPage < totalPages,
      hasPrev: resolvedPage > 1,
    };
    const appliedFilters = {
      api: result.debug.appliedApiFilters ?? [],
      client: [
        ...(criteria.minUserRating !== undefined ? ["minUserRating"] : []),
        ...(criteria.minHotelClass !== undefined ? ["minHotelClass"] : []),
        ...(criteria.amenities && criteria.amenities.length > 0 ? ["amenities"] : []),
        ...(criteria.minPrice !== undefined && !apiFilters.has("minPrice") ? ["minPrice"] : []),
        ...(criteria.maxPrice !== undefined && !apiFilters.has("maxPrice") ? ["maxPrice"] : []),
      ],
      ignored: ignoredTopSearchParams,
    };
    const dateSpecificDebug = {
      dateSpecificPriceEnabled: false,
      dateSpecificPriceHotelLimit: DATE_SPECIFIC_PRICE_HOTEL_LIMIT,
      listPriceEnrichLimit: 0,
      priceDisplayMode: "reference_on_search",
      reason:
        "Top search results are for hotel discovery. Date-specific prices are tracked only for favorite or watched hotels.",
      hotelCount: pageHotels.length,
      pricedHotelCount: 0,
      notFoundCount: 0,
      errorCount: 0,
      notFoundReasonCounts: {},
      attemptedRequestCount: 0,
      checkedCount: 0,
      notCheckedCount: 0,
      priceSourceField: "dailyCharge.total" as const,
      fallbackCount: 0,
      priceSourceFieldCounts: {},
      priceExtractionWarnings: [],
      priceSamples: [],
    };

    const responseBody = {
      hotels: responseHotels,
      pagination,
      warnings,
      searchMeta: {
        searchMaxHotels: result.debug.searchMaxHotels ?? limits.searchMaxHotels,
        hardLimit: result.debug.hardLimit ?? limits.hardLimit,
        hasDestination: limits.hasDestination,
        hasFilters: limits.hasFilters,
      },
      ...(debug
        ? {
            debug: {
              ...result.debug,
              ...dateSpecificDebug,
              searchCriteria: criteria,
              apiRequestParamsSafe: result.debug.apiRequestParamsSafe ?? {},
              appliedFilters,
              searchSkipped: false,
              searchMaxHotels: result.debug.searchMaxHotels ?? limits.searchMaxHotels,
              hardLimit: result.debug.hardLimit ?? limits.hardLimit,
              hasDestination: result.debug.hasDestination ?? limits.hasDestination,
              hasFilters: result.debug.hasFilters ?? limits.hasFilters,
              rakutenHitsPerPage: result.debug.rakutenHitsPerPage ?? 30,
              rakutenPagesRequested: result.debug.rakutenPagesRequested ?? 0,
              rakutenPagesFetched: result.debug.rakutenPagesFetched ?? 0,
              rakutenPageResults: result.debug.rakutenPageResults ?? [],
              rateLimitHit: result.debug.rateLimitHit ?? false,
              cacheHit: result.debug.cacheHit ?? false,
              keyword: criteria.destination ?? "",
              priceDisplayMode: "reference_on_search",
              dateSpecificPriceEnabled: false,
              mealPlanIgnoredOnSearch: ignoredTopSearchParams.includes("mealPlan"),
              ...(ignoredTopSearchParams.includes("mealPlan")
                ? {
                    reason:
                      "Meal conditions are used when starting price tracking, not on top search results.",
                  }
                : {}),
              ...filtered.debug,
              appPage: resolvedPage,
              appLimit: criteria.limit,
              appOffset: offset,
              pagination,
              totalBeforePagination,
              totalAfterMerge: rawMergedHotels.length,
              returnedCount: responseHotels.length,
              totalPages,
              hasNext: resolvedPage < totalPages,
              hasPrev: resolvedPage > 1,
              areaSearchLevelUsed: criteria.area?.smallClassCode
                ? "smallClassCode"
                : criteria.area?.middleClassCode
                ? "middleClassCode"
                : "keyword",
              ignoredDetailClassCode: false,
              fallbackSteps: fallbackWarnings,
              rawHotelCount: result.debug.rawCount,
              mappedHotelCount: result.debug.mappedCount,
              mergedHotelCount: rawMergedHotels.length,
              beforeClientFilterCount: rawMergedHotels.length,
              afterClientFilterCount: hotels.length,
              displayedHotelCount: responseHotels.length,
              warnings,
              dateSpecificPriceCheckedCount: dateSpecificDebug.checkedCount,
              dateSpecificPriceAvailableCount: dateSpecificDebug.pricedHotelCount,
              dateSpecificPriceNotFoundCount: dateSpecificDebug.notFoundCount,
              dateSpecificPriceErrorCount: dateSpecificDebug.errorCount,
              notFoundReasonCounts: dateSpecificDebug.notFoundReasonCounts,
              attemptedRequestCount: dateSpecificDebug.attemptedRequestCount,
              dateSpecificPriceFallbackCount: dateSpecificDebug.fallbackCount,
              priceSourceFieldCounts: dateSpecificDebug.priceSourceFieldCounts,
              priceExtractionWarnings: dateSpecificDebug.priceExtractionWarnings,
              dateSpecificPriceNotCheckedCount: dateSpecificDebug.notCheckedCount,
              dateSpecificPrice: dateSpecificDebug,
            },
          }
        : {}),
    };
    const response = NextResponse.json(responseBody);
    const hasAreaCode = Boolean(
      criteria.area?.largeClassCode ||
        criteria.area?.middleClassCode ||
        criteria.area?.smallClassCode,
    );
    if (providerNotices.length > 0) {
      response.headers.set(
        "X-Hotel-Search-Notice",
        encodeURIComponent(providerNotices.join(" / ")),
      );
    } else if (!hasAreaCode && process.env.USE_MOCK_HOTELS === "false") {
      response.headers.set(
        "X-Hotel-Search-Notice",
        encodeURIComponent(
          "地区候補が未選択のため、キーワード検索結果を表示しています",
        ),
      );
    }
    return response;
  } catch (error) {
    console.error("Failed to fetch hotels:", error);
    const message = error instanceof Error ? error.message : "";
    const isCredentialError =
      message.includes("RAKUTEN_TRAVEL_") || message.includes("JALAN_API_KEY");
    const isRakutenForbiddenError =
      message.includes("楽天") && message.includes("HTTP 403");
    const providerHint = getProviderErrorHint(message);
    const responseMessage = message.includes("有効なホテルProviderがありません")
      ? "有効なホテルProviderがありません"
      : isRakutenForbiddenError
      ? "楽天APIの取得に失敗しました"
      : isCredentialError
      ? `APIキーを確認してください: ${message}`
      : message || "ホテル情報の取得に失敗しました";
    return NextResponse.json(
      createApiErrorResponse(responseMessage, providerHint),
      { status: 500 },
    );
  }
}
