import { fetchHotels } from "@/lib/hotelApi";
import { NextResponse } from "next/server";
import { validateHotelSearch } from "@/lib/searchValidation";

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
    const hasCompleteStayCondition = Boolean(checkIn && checkOut && guests);

    if (hasCompleteStayCondition) {
      const validationMessage = validateHotelSearch({ checkIn, checkOut, guests });
      if (validationMessage) {
        return NextResponse.json({ error: validationMessage }, { status: 400 });
      }
    }

    const response = NextResponse.json(
      await fetchHotels({
        keyword,
        checkIn,
        checkOut,
        guests,
        areaClassCode,
        middleClassCode,
        smallClassCode,
        detailClassCode,
      }),
    );
    const hasAreaCode = Boolean(
      areaClassCode || middleClassCode || smallClassCode || detailClassCode,
    );
    if (
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
    const isCredentialError = message.includes("RAKUTEN_TRAVEL_");
    const hasStayCondition = new URL(request.url).searchParams.has("checkIn");
    return NextResponse.json(
      {
        error: isCredentialError
          ? `楽天APIキーを確認してください: ${message}`
          : hasStayCondition
          ? "空室情報の取得に失敗しました"
          : "ホテル情報の取得に失敗しました",
      },
      { status: 500 },
    );
  }
}
