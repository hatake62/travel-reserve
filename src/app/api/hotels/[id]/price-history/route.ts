import { createApiErrorResponse } from "@/lib/apiError";
import { getPriceHistory } from "@/lib/priceHistoryRepository";
import type { PriceHistoryResponse } from "@/types/priceHistory";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type PriceHistoryRouteContext = {
  params: Promise<{ id: string }>;
};

function isDateString(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function parseAdults(value: string | null): number {
  const adults = value === null ? 2 : Number(value);
  return Number.isInteger(adults) && adults >= 1 && adults <= 10 ? adults : 2;
}

function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isCheckOutAfterCheckIn(checkInDate: string, checkOutDate: string): boolean {
  return new Date(`${checkOutDate}T00:00:00.000Z`).getTime() >
    new Date(`${checkInDate}T00:00:00.000Z`).getTime();
}

export async function GET(request: Request, { params }: PriceHistoryRouteContext) {
  try {
    const { id } = await params;
    const searchParams = new URL(request.url).searchParams;
    const today = new Date().toISOString().slice(0, 10);
    const checkInDate = isDateString(searchParams.get("checkIn"))
      ? searchParams.get("checkIn")!
      : today;
    const checkOutDate = isDateString(searchParams.get("checkOut"))
      ? searchParams.get("checkOut")!
      : addDays(checkInDate, 1);
    const adults = parseAdults(searchParams.get("adults"));
    if (!isCheckOutAfterCheckIn(checkInDate, checkOutDate)) {
      return NextResponse.json(
        createApiErrorResponse("チェックアウト日はチェックイン日より後にしてください"),
        { status: 400 },
      );
    }

    const { points, warnings } = await getPriceHistory({
      hotelId: id,
      checkInDate,
      checkOutDate,
      adults,
    });

    const response: PriceHistoryResponse = {
      hotelId: id,
      checkInDate,
      checkOutDate,
      adults,
      points,
      warnings,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch price history:", error);
    return NextResponse.json(
      createApiErrorResponse(
        "料金履歴の取得に失敗しました",
        "時間をおいて再試行してください",
      ),
      { status: 500 },
    );
  }
}
