import { findMockAreaCandidates } from "@/lib/hotelProviders/mockAreaProvider";
import { findRakutenAreaCandidates } from "@/lib/hotelProviders/rakutenAreaProvider";
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
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "楽天地区コードの取得に失敗しました",
      },
      { status: 500 },
    );
  }
}
