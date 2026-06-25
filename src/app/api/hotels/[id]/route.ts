import { fetchHotelById } from "@/lib/hotelApi";
import { createApiErrorResponse, getProviderErrorHint } from "@/lib/apiError";
import { NextResponse } from "next/server";

type HotelRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: HotelRouteContext) {
  try {
    const { id } = await params;
    const hotel = await fetchHotelById(id);

    if (!hotel) {
      return NextResponse.json(
        createApiErrorResponse(
          "ホテルが見つかりませんでした",
          "一覧ページから現在表示できるホテルを選択してください",
        ),
        { status: 404 },
      );
    }

    return NextResponse.json(hotel);
  } catch (error) {
    console.error("Failed to fetch hotel:", error);
    const message =
      error instanceof Error ? error.message : "ホテル情報の取得に失敗しました";
    return NextResponse.json(
      createApiErrorResponse(
        message.includes("有効なホテルProviderがありません")
          ? "有効なホテルProviderがありません"
          : "ホテル情報の取得に失敗しました",
        getProviderErrorHint(message) ??
          "時間をおいて再試行するか、Provider設定を確認してください",
      ),
      { status: 500 },
    );
  }
}
