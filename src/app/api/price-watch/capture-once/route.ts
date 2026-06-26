import { createApiErrorResponse } from "@/lib/apiError";
import { fetchRakutenPriceSnapshot } from "@/lib/hotelProviders/rakutenPriceSnapshotProvider";
import {
  hasPriceHistoryDatabase,
  savePriceSnapshot,
} from "@/lib/priceHistoryRepository";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CaptureOnceRequest = {
  hotelId?: unknown;
  checkInDate?: unknown;
  checkOutDate?: unknown;
  adults?: unknown;
};

function isDateString(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseAdults(value: unknown): number {
  const adults = typeof value === "number" ? value : Number(value);
  return Number.isInteger(adults) && adults >= 1 && adults <= 10 ? adults : 2;
}

function isCheckOutAfterCheckIn(checkInDate: string, checkOutDate: string): boolean {
  return new Date(`${checkOutDate}T00:00:00.000Z`).getTime() >
    new Date(`${checkInDate}T00:00:00.000Z`).getTime();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as CaptureOnceRequest;
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
    if (!hasPriceHistoryDatabase()) {
      return NextResponse.json(
        createApiErrorResponse(
          "DATABASE_URLが未設定のため、料金スナップショットを保存できません。",
          "DB設定とテーブル作成状況を確認してください",
        ),
        { status: 503 },
      );
    }

    const snapshot = await fetchRakutenPriceSnapshot({
      hotelId,
      checkInDate,
      checkOutDate,
      adults: parseAdults(body.adults),
    });
    const result = await savePriceSnapshot(snapshot);

    if (!result.saved) {
      return NextResponse.json(
        createApiErrorResponse(
          "料金スナップショットを保存できませんでした",
          result.warnings.join(" / ") || "DB設定を確認してください",
        ),
        { status: 503 },
      );
    }

    return NextResponse.json({
      snapshot: {
        hotelId: snapshot.hotelId,
        provider: snapshot.provider,
        checkInDate: snapshot.checkInDate,
        checkOutDate: snapshot.checkOutDate,
        adults: snapshot.adults,
        price: snapshot.price,
        bookingUrl: snapshot.bookingUrl ?? "",
        capturedAt: snapshot.capturedAt,
        sourcePriceField: snapshot.sourcePriceField,
        matchedPlanCount: snapshot.matchedPlanCount ?? 0,
        rawPlanCount: snapshot.rawPlanCount ?? 0,
        extractedPriceCount: snapshot.extractedPriceCount ?? 0,
        searchPatternsTried: snapshot.searchPatternsTried ?? [],
        pagesFetched: snapshot.pagesFetched ?? 0,
        planName: snapshot.planName,
        roomName: snapshot.roomName,
        status: snapshot.status,
      },
      warnings: [...(snapshot.warnings ?? []), ...result.warnings],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "料金スナップショットの保存に失敗しました";
    const status = message.includes("DATABASE_URL") ? 503 : 500;
    return NextResponse.json(
      createApiErrorResponse(
        message,
        "楽天API設定、DB設定、宿泊条件を確認してください",
      ),
      { status },
    );
  }
}
