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
    const hasStayCondition =
      checkIn !== undefined || checkOut !== undefined || guests !== undefined;

    if (hasStayCondition) {
      const validationMessage = validateHotelSearch({ checkIn, checkOut, guests });
      if (validationMessage) {
        return NextResponse.json({ error: validationMessage }, { status: 400 });
      }
    }

    const response = NextResponse.json(
      await fetchHotels({ keyword, checkIn, checkOut, guests }),
    );
    if (hasStayCondition && process.env.USE_MOCK_HOTELS === "false") {
      response.headers.set(
        "X-Hotel-Search-Notice",
        encodeURIComponent("現在はキーワード検索結果を表示しています"),
      );
    }
    return response;
  } catch (error) {
    console.error("Failed to fetch hotels:", error);
    const hasStayCondition = new URL(request.url).searchParams.has("checkIn");
    return NextResponse.json(
      {
        error: hasStayCondition
          ? "空室情報の取得に失敗しました"
          : "ホテル情報の取得に失敗しました",
      },
      { status: 500 },
    );
  }
}
