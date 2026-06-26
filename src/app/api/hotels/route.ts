import { getHotelProvider } from "@/lib/hotelProviders";
import { fetchRakutenDateSpecificLowestPrice } from "@/lib/hotelProviders/rakutenDateSpecificPriceProvider";
import { NextResponse } from "next/server";
import { validateHotelSearch } from "@/lib/searchValidation";
import { createApiErrorResponse, getProviderErrorHint } from "@/lib/apiError";
import type { Hotel } from "@/types/hotel";

const DATE_SPECIFIC_PRICE_HOTEL_LIMIT = 10;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 30;

type DateSpecificPriceDebug = {
  checkInDate?: string;
  checkOutDate?: string;
  adults?: number;
  dateSpecificPriceEnabled: boolean;
  dateSpecificPriceHotelLimit: number;
  hotelCount: number;
  pricedHotelCount: number;
  notFoundCount: number;
  priceSourceField: "dailyCharge.total" | "dailyCharge.rakutenCharge";
  fallbackCount: number;
  priceSourceFieldCounts: Record<string, number>;
  priceExtractionWarnings: string[];
  priceSamples: Array<{
    hotelId: string | number;
    status: "available" | "not_found";
    price: number | null;
    sourcePriceField: "dailyCharge.total" | "dailyCharge.rakutenCharge";
    matchedPlanCount: number;
    rawPlanCount: number;
    extractedPriceCount: number;
    searchPatternsTried: string[];
    pagesFetched: number;
  }>;
};

function getRakutenHotelId(hotel: Hotel): string | null {
  if (String(hotel.id).startsWith("rakuten-")) return String(hotel.id);
  const providerId = hotel.providerIds?.rakuten;
  return providerId ? `rakuten-${providerId}` : null;
}

function parsePositiveInteger(value: string | null, defaultValue: number, max?: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return defaultValue;
  return max ? Math.min(parsed, max) : parsed;
}

async function applyDateSpecificPrices(
  hotels: Hotel[],
  {
    checkIn,
    checkOut,
    guests,
  }: {
    checkIn: string;
    checkOut: string;
    guests: number;
  },
): Promise<{ hotels: Hotel[]; debug: DateSpecificPriceDebug }> {
  const targetIndexes = hotels
    .map((hotel, index) => ({ hotel, index, hotelId: getRakutenHotelId(hotel) }))
    .filter((item): item is { hotel: Hotel; index: number; hotelId: string } =>
      Boolean(item.hotelId),
    )
    .slice(0, DATE_SPECIFIC_PRICE_HOTEL_LIMIT);

  const results = await Promise.all(
    targetIndexes.map(async (target) => {
      try {
        const price = await fetchRakutenDateSpecificLowestPrice({
          hotelId: target.hotelId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          adults: guests,
        });
        return { ...target, price };
      } catch {
        return { ...target, price: null };
      }
    }),
  );

  const byIndex = new Map(results.map((result) => [result.index, result]));
  const enrichedHotels = hotels.map((hotel, index) => {
    const result = byIndex.get(index);
    if (!result) return hotel;

    const firstOffer = hotel.offers[0];
    const price = result.price?.price ?? null;
    const status = result.price?.status ?? "not_found";
    return {
      ...hotel,
      offers: [
        {
          site: "楽天トラベル",
          price,
          bookingUrl:
            result.price?.bookingUrl ||
            result.price?.planListUrl ||
            result.price?.hotelInformationUrl ||
            firstOffer?.bookingUrl ||
            "",
          priceLabel: status === "available"
            ? result.price?.sourcePriceField === "dailyCharge.rakutenCharge"
              ? "指定日の参考価格"
              : "指定日の最安値"
            : "指定条件の料金未取得",
          sourcePriceField: result.price?.sourcePriceField ?? "dailyCharge.total",
          isDateSpecific: true,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          adults: guests,
          planName: result.price?.planName,
          roomName: result.price?.roomName,
          matchedPlanCount: result.price?.matchedPlanCount ?? 0,
          roomType:
            result.price?.planName ||
            result.price?.roomName ||
            firstOffer?.roomType ||
            "プラン詳細は予約サイトで確認",
          hasBreakfast: firstOffer?.hasBreakfast ?? false,
          cancellation: firstOffer?.cancellation ?? "予約サイトで確認",
        },
        ...hotel.offers.slice(1),
      ],
    };
  });

  const pricedHotelCount = results.filter((result) => result.price?.price).length;
  const notFoundCount = results.filter(
    (result) => result.price?.status === "not_found" || result.price === null,
  ).length;
  const fallbackCount = results.filter(
    (result) => result.price?.sourcePriceField === "dailyCharge.rakutenCharge",
  ).length;
  const priceSourceFieldCounts = results.reduce<Record<string, number>>(
    (counts, result) => {
      const field = result.price?.sourcePriceField;
      if (field) counts[field] = (counts[field] ?? 0) + 1;
      return counts;
    },
    {},
  );
  const priceExtractionWarnings = results.flatMap(
    (result) => result.price?.warnings ?? [],
  );

  return {
    hotels: enrichedHotels,
    debug: {
      checkInDate: checkIn,
      checkOutDate: checkOut,
      adults: guests,
      dateSpecificPriceEnabled: true,
      dateSpecificPriceHotelLimit: DATE_SPECIFIC_PRICE_HOTEL_LIMIT,
      hotelCount: hotels.length,
      pricedHotelCount,
      notFoundCount,
      priceSourceField: fallbackCount > 0 && pricedHotelCount === fallbackCount
        ? "dailyCharge.rakutenCharge"
        : "dailyCharge.total",
      fallbackCount,
      priceSourceFieldCounts,
      priceExtractionWarnings,
      priceSamples: results.slice(0, 5).map((result) => ({
        hotelId: result.hotel.id,
        status: result.price?.status ?? "not_found",
        price: result.price?.price ?? null,
        sourcePriceField: result.price?.sourcePriceField ?? "dailyCharge.total",
        matchedPlanCount: result.price?.matchedPlanCount ?? 0,
        rawPlanCount: result.price?.rawPlanCount ?? 0,
        extractedPriceCount: result.price?.extractedPriceCount ?? 0,
        searchPatternsTried: result.price?.searchPatternsTried ?? [],
        pagesFetched: result.price?.pagesFetched ?? 0,
      })),
    },
  };
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const keyword = params.get("keyword") ?? undefined;
    const checkIn = params.get("checkIn") ?? undefined;
    const checkOut = params.get("checkOut") ?? undefined;
    const guestsValue = params.get("guests");
    const guests = guestsValue === null ? undefined : Number(guestsValue);
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
    const hasCompleteStayCondition = Boolean(checkIn && checkOut && guests);

    if (hasCompleteStayCondition) {
      const validationMessage = validateHotelSearch({ checkIn, checkOut, guests });
      if (validationMessage) {
        return NextResponse.json(
          createApiErrorResponse(
            validationMessage,
            "チェックイン日、チェックアウト日、人数を確認してください",
          ),
          { status: 400 },
        );
      }
    }

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
    const dateSpecific =
      hasCompleteStayCondition && checkIn && checkOut && guests
        ? await applyDateSpecificPrices(pageHotels, { checkIn, checkOut, guests })
        : null;
    const responseHotels = dateSpecific?.hotels ?? pageHotels;
    const dateSpecificDebug = dateSpecific?.debug ?? {
      checkInDate: checkIn,
      checkOutDate: checkOut,
      adults: guests,
      dateSpecificPriceEnabled: false,
      dateSpecificPriceHotelLimit: DATE_SPECIFIC_PRICE_HOTEL_LIMIT,
      hotelCount: pageHotels.length,
      pricedHotelCount: 0,
      notFoundCount: 0,
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
              dateSpecificPriceCheckedCount: Math.min(
                DATE_SPECIFIC_PRICE_HOTEL_LIMIT,
                pageHotels.filter((hotel) => Boolean(getRakutenHotelId(hotel))).length,
              ),
              dateSpecificPriceAvailableCount: dateSpecificDebug.pricedHotelCount,
              dateSpecificPriceNotFoundCount: dateSpecificDebug.notFoundCount,
              dateSpecificPriceFallbackCount: dateSpecificDebug.fallbackCount,
              priceSourceFieldCounts: dateSpecificDebug.priceSourceFieldCounts,
              priceExtractionWarnings: dateSpecificDebug.priceExtractionWarnings,
              dateSpecificPriceNotCheckedCount: Math.max(
                0,
                pageHotels.filter((hotel) => Boolean(getRakutenHotelId(hotel))).length -
                  DATE_SPECIFIC_PRICE_HOTEL_LIMIT,
              ),
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
      (!hasCompleteStayCondition || !hasAreaCode) &&
      process.env.USE_MOCK_HOTELS === "false"
    ) {
      response.headers.set(
        "X-Hotel-Search-Notice",
        encodeURIComponent(
          !hasAreaCode
            ? "地区候補が未選択のため、キーワード検索結果を表示しています"
            : "宿泊日または人数が不足しているため、キーワード検索結果を表示しています",
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
    const hasStayCondition = new URL(request.url).searchParams.has("checkIn");
    const providerHint = getProviderErrorHint(message);
    const responseMessage = message.includes("有効なホテルProviderがありません")
      ? "有効なホテルProviderがありません"
      : isRakutenForbiddenError
      ? "楽天APIの取得に失敗しました"
      : isCredentialError
      ? `APIキーを確認してください: ${message}`
      : hasStayCondition
      ? `空室情報の取得に失敗しました: ${message}`
      : message || "ホテル情報の取得に失敗しました";
    return NextResponse.json(
      createApiErrorResponse(responseMessage, providerHint),
      { status: 500 },
    );
  }
}
