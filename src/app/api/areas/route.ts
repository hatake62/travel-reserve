import { findMockAreaCandidates } from "@/lib/hotelProviders/mockAreaProvider";
import {
  findRakutenAreaCandidates,
  findRakutenAreaCandidatesWithDebug,
} from "@/lib/hotelProviders/rakutenAreaProvider";
import { createApiErrorResponse, getProviderErrorHint } from "@/lib/apiError";
import { NextResponse } from "next/server";

const MAX_CANDIDATES = 20;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const keyword = params.get("keyword")?.trim() ?? "";
  const debug = params.get("debug") === "true";
  if (!keyword) return NextResponse.json([]);

  try {
    const useRakuten = process.env.USE_MOCK_HOTELS === "false";
    if (debug && useRakuten) {
      const result = await findRakutenAreaCandidatesWithDebug(keyword);
      return NextResponse.json({
        candidates: result.candidates.slice(0, MAX_CANDIDATES),
        debug: result.debug,
      });
    }

    const candidates = await (useRakuten
      ? findRakutenAreaCandidates(keyword)
      : findMockAreaCandidates(keyword));
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
