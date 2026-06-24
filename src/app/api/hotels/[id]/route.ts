import { fetchHotelById } from "@/lib/hotelApi";
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
        { error: "ホテルが見つかりませんでした" },
        { status: 404 },
      );
    }

    return NextResponse.json(hotel);
  } catch (error) {
    console.error("Failed to fetch hotel:", error);
    return NextResponse.json(
      { error: "ホテル情報の取得に失敗しました" },
      { status: 500 },
    );
  }
}
