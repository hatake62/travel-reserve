import { findMockAreaCandidates } from "@/lib/hotelProviders/mockAreaProvider";
import { findRakutenAreaCandidates } from "@/lib/hotelProviders/rakutenAreaProvider";
import { createApiErrorResponse, getProviderErrorHint } from "@/lib/apiError";
import { NextResponse } from "next/server";

const MAX_CANDIDATES = 20;

export async function GET(request: Request) {
  const keyword = new URL(request.url).searchParams.get("keyword")?.trim() ?? "";
  if (!keyword) return NextResponse.json([]);

  try {
    const findAreaCandidates =
      process.env.USE_MOCK_HOTELS === "false"
        ? findRakutenAreaCandidates
        : findMockAreaCandidates;
    const candidates = await findAreaCandidates(keyword);
    return NextResponse.json(candidates.slice(0, MAX_CANDIDATES));
  } catch (error) {
    console.error("Failed to fetch Rakuten areas:", error);
    const message =
      error instanceof Error ? error.message : "楽天地区コードの取得に失敗しました";
    return NextResponse.json(
      createApiErrorResponse(
        message,
        getProviderErrorHint(message) ??
          "地区候補を使わず目的地キーワードだけで検索するか、楽天API設定を確認してください",
      ),
      { status: 500 },
    );
  }
}
