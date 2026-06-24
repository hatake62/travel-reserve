import { fetchHotels } from "@/lib/hotelApi";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const keyword = new URL(request.url).searchParams.get("keyword") ?? undefined;
    return NextResponse.json(await fetchHotels({ keyword }));
  } catch (error) {
    console.error("Failed to fetch hotels:", error);
    return NextResponse.json(
      { error: "ホテル情報の取得に失敗しました" },
      { status: 500 },
    );
  }
}
