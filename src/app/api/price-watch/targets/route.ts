import { createApiErrorResponse } from "@/lib/apiError";
import {
  addTrackedPriceTarget,
  getPriceWatchTargets,
} from "@/lib/priceHistoryRepository";
import type { PriceWatchTarget } from "@/types/priceHistory";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type PriceWatchTargetRequest = {
  hotelId?: unknown;
  checkInDate?: unknown;
  checkOutDate?: unknown;
  adults?: unknown;
  mealPlan?: unknown;
  minPrice?: unknown;
  maxPrice?: unknown;
  features?: unknown;
  hotelName?: unknown;
  imageUrl?: unknown;
  address?: unknown;
  bookingUrl?: unknown;
};

function isDateString(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseAdults(value: unknown): number {
  const adults = typeof value === "number" ? value : Number(value);
  return Number.isInteger(adults) && adults >= 1 && adults <= 10 ? adults : 2;
}

function parseNullablePrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function parseFeatures(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((feature): feature is string => typeof feature === "string")
    : [];
}

function isCheckOutAfterCheckIn(checkInDate: string, checkOutDate: string): boolean {
  return new Date(`${checkOutDate}T00:00:00.000Z`).getTime() >
    new Date(`${checkInDate}T00:00:00.000Z`).getTime();
}

export async function GET() {
  const { targets, warnings } = await getPriceWatchTargets();
  return NextResponse.json({ targets, warnings });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as PriceWatchTargetRequest;
    const hotelId = typeof body.hotelId === "string" ? body.hotelId.trim() : "";
    const checkInDate = body.checkInDate;
    const checkOutDate = body.checkOutDate;

    if (!hotelId || !hotelId.startsWith("rakuten-")) {
      return NextResponse.json(
        createApiErrorResponse("楽天API由来のホテルIDを指定してください"),
        { status: 400 },
      );
    }
    if (!isDateString(checkInDate) || !isDateString(checkOutDate)) {
      return NextResponse.json(
        createApiErrorResponse("宿泊日をYYYY-MM-DD形式で指定してください"),
        { status: 400 },
      );
    }
    if (!isCheckOutAfterCheckIn(checkInDate, checkOutDate)) {
      return NextResponse.json(
        createApiErrorResponse("チェックアウト日はチェックイン日より後にしてください"),
        { status: 400 },
      );
    }

    const target: PriceWatchTarget = await addTrackedPriceTarget({
      hotelId,
      provider: "rakuten",
      checkInDate,
      checkOutDate,
      adults: parseAdults(body.adults),
      enabled: true,
      mealPlan: typeof body.mealPlan === "string" ? body.mealPlan : "",
      minPrice: parseNullablePrice(body.minPrice),
      maxPrice: parseNullablePrice(body.maxPrice),
      features: parseFeatures(body.features),
      hotelName: typeof body.hotelName === "string" ? body.hotelName : "",
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : "",
      address: typeof body.address === "string" ? body.address : "",
      bookingUrl: typeof body.bookingUrl === "string" ? body.bookingUrl : "",
    });

    return NextResponse.json({
      ok: true,
      target,
      favoriteHotel: {
        id: hotelId,
        name: typeof body.hotelName === "string" ? body.hotelName : "",
        imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : "",
        address: typeof body.address === "string" ? body.address : "",
        provider: "rakuten",
        bookingUrl: typeof body.bookingUrl === "string" ? body.bookingUrl : "",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "料金推移の記録開始に失敗しました";
    const status = message.includes("DATABASE_URL") ? 503 : 500;
    return NextResponse.json(
      createApiErrorResponse(message, "DB設定とテーブル作成状況を確認してください"),
      { status },
    );
  }
}
