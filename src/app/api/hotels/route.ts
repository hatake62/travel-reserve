import { getHotelProvider } from "@/lib/hotelProviders";
import { NextResponse } from "next/server";
import { createApiErrorResponse, getProviderErrorHint } from "@/lib/apiError";

const DATE_SPECIFIC_PRICE_HOTEL_LIMIT = 0;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 30;

function parsePositiveInteger(value: string | null, defaultValue: number, max?: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return defaultValue;
  return max ? Math.min(parsed, max) : parsed;
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const keyword = params.get("keyword") ?? undefined;
    // Top search is hotel discovery only. Stay dates and guest count are handled
    // in price tracking flows to avoid per-hotel vacant search API calls.
    const checkIn = undefined;
    const checkOut = undefined;
    const guests = undefined;
    const areaClassCode = params.get("areaClassCode") ?? undefined;
    const middleClassCode = params.get("middleClassCode") ?? undefined;
    const smallClassCode = params.get("smallClassCode") ?? undefined;
    const requestedDetailClassCode = params.get("detailClassCode") ?? undefined;
    // GetAreaClassの詳細コードはVacantHotelSearch側で無効になることがある。
    // 一覧は小分類・中分類までで十分広く検索し、詳細コードは送らない。
    const detailClassCode = undefined;
    const page = parsePositiveInteger(params.get("page"), 1);
    const limit = parsePositiveInteger(params.get("limit"), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const debug = params.get("debug") === "true";
    const providerNotices: string[] = requestedDetailClassCode
      ? ["詳細地区コードは楽天API互換性のため使用せず、広い地区条件で検索しています。"]
      : [];
    const searchOptions = {
      keyword,
      checkIn,
      checkOut,
      guests,
      areaClassCode,
      middleClassCode,
      smallClassCode,
      detailClassCode,
      onNotice: (notice: string) => providerNotices.push(notice),
    };
    const result = await getHotelProvider().getHotelsWithDebug?.(searchOptions);
    if (!result) throw new Error("ホテルProviderの検索結果を取得できませんでした。");
    const hotels = result.hotels;
    const totalBeforePagination = hotels.length;
    const totalPages = Math.max(1, Math.ceil(totalBeforePagination / limit));
    const resolvedPage = Math.min(page, totalPages);
    const offset = (resolvedPage - 1) * limit;
    const pageHotels = hotels.slice(offset, offset + limit);
    const responseHotels = pageHotels.map((hotel) => ({
      ...hotel,
      offers: hotel.offers.map((offer) => ({
        ...offer,
        isDateSpecific: false,
        priceLabel: offer.priceLabel ?? "参考最安値",
        sourcePriceField: offer.sourcePriceField ?? "reference",
      })),
    }));
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
    const fallbackWarnings = result.debug.warnings.filter((warning) =>
      warning.includes("周辺エリア"),
    );
    const responseBody = {
      hotels: responseHotels,
      pagination: {
        page: resolvedPage,
        limit,
        total: totalBeforePagination,
        totalPages,
        hasNext: resolvedPage < totalPages,
        hasPrev: resolvedPage > 1,
      },
      warnings: [...fallbackWarnings, ...providerNotices],
      ...(debug
        ? {
            debug: {
              ...result.debug,
              ...dateSpecificDebug,
              keyword: keyword ?? "",
              appPage: resolvedPage,
              appLimit: limit,
              appOffset: offset,
              totalBeforePagination,
              totalAfterMerge: hotels.length,
              returnedCount: responseHotels.length,
              totalPages,
              hasNext: resolvedPage < totalPages,
              hasPrev: resolvedPage > 1,
              areaSearchLevelUsed: smallClassCode ? "smallClassCode" : middleClassCode ? "middleClassCode" : "keyword",
              ignoredDetailClassCode: Boolean(requestedDetailClassCode),
              fallbackSteps: fallbackWarnings,
              rawHotelCount: result.debug.rawCount,
              mergedHotelCount: hotels.length,
              displayedHotelCount: responseHotels.length,
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
              rakutenPagesFetched: 2,
              dateSpecificPrice: dateSpecificDebug,
            },
          }
        : {}),
    };
    const response = NextResponse.json(responseBody);
    const hasAreaCode = Boolean(
      areaClassCode || middleClassCode || smallClassCode,
    );
    if (providerNotices.length > 0) {
      response.headers.set(
        "X-Hotel-Search-Notice",
        encodeURIComponent(providerNotices.join(" / ")),
      );
    } else if (
      !hasAreaCode && process.env.USE_MOCK_HOTELS === "false"
    ) {
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
