import { hotels } from "@/data/hotels";
import { NextResponse } from "next/server";

type HotelRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: HotelRouteContext) {
  const { id } = await params;
  const hotel = hotels.find((item) => String(item.id) === id);

  if (!hotel) {
    return NextResponse.json(
      { message: "ホテルが見つかりませんでした" },
      { status: 404 },
    );
  }

  return NextResponse.json(hotel);
}
