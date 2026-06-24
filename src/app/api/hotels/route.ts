import { fetchHotels } from "@/lib/hotelApi";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json(await fetchHotels());
  } catch (error) {
    console.error("Failed to fetch hotels:", error);
    return NextResponse.json(
      { error: "ホテル情報の取得に失敗しました" },
      { status: 500 },
    );
  }
}
