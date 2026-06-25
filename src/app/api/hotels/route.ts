import { fetchHotels } from "@/lib/hotelApi";
import { getHotelProvider } from "@/lib/hotelProviders";
import { NextResponse } from "next/server";
import { validateHotelSearch } from "@/lib/searchValidation";
import { createApiErrorResponse, getProviderErrorHint } from "@/lib/apiError";

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
    const detailClassCode = params.get("detailClassCode") ?? undefined;
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

    const providerNotices: string[] = [];
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
    const result = debug
      ? await getHotelProvider().getHotelsWithDebug?.(searchOptions)
      : undefined;
    const response = NextResponse.json(
      debug && result
        ? { hotels: result.hotels, debug: result.debug }
        : await fetchHotels(searchOptions),
    );
    const hasAreaCode = Boolean(
      areaClassCode || middleClassCode || smallClassCode || detailClassCode,
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
