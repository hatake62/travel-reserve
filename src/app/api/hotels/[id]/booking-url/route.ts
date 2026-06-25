import { createApiErrorResponse } from "@/lib/apiError";
import { fetchRakutenBookingLinks } from "@/lib/hotelProviders/rakutenBookingUrlProvider";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type BookingUrlRouteContext = {
  params: Promise<{ id: string }>;
};

function isDateString(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function parseAdults(value: string | null): number {
  const adults = value === null ? 2 : Number(value);
  return Number.isInteger(adults) && adults >= 1 && adults <= 10 ? adults : 2;
}

function isCheckOutAfterCheckIn(checkInDate: string, checkOutDate: string): boolean {
  return new Date(`${checkOutDate}T00:00:00.000Z`).getTime() >
    new Date(`${checkInDate}T00:00:00.000Z`).getTime();
}

export async function GET(request: Request, { params }: BookingUrlRouteContext) {
  try {
    const { id } = await params;
    const searchParams = new URL(request.url).searchParams;
    const checkInDate = searchParams.get("checkIn");
    const checkOutDate = searchParams.get("checkOut");
    const adults = parseAdults(searchParams.get("adults"));

    if (!id.startsWith("rakuten-")) {
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

    const bookingLinks = await fetchRakutenBookingLinks({
      hotelId: id,
      checkInDate,
      checkOutDate,
      adults,
    });

    return NextResponse.json(bookingLinks);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "予約リンクの取得に失敗しました";
    const isForbidden = message.includes("HTTP 403") || message.includes("403");
    const isRateLimit = message.includes("HTTP 429") || message.includes("429");
    return NextResponse.json(
      createApiErrorResponse(
        isForbidden || isRateLimit
          ? "楽天トラベルAPIから予約リンクを取得できませんでした"
          : message,
        "時間をおいて再試行するか、通常の予約サイトリンクを確認してください",
      ),
      { status: isForbidden ? 403 : isRateLimit ? 429 : 500 },
    );
  }
}
