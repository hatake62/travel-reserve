import { createApiErrorResponse } from "@/lib/apiError";
import {
  getTrackedPriceTargets,
  savePriceSnapshot,
} from "@/lib/priceHistoryRepository";
import { fetchRakutenPriceSnapshot } from "@/lib/hotelProviders/rakutenPriceSnapshotProvider";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      createApiErrorResponse("Unauthorized"),
      { status: 401 },
    );
  }

  const warnings: string[] = [];
  const errors: string[] = [];
  let captured = 0;
  let saved = 0;

  try {
    const { targets, warnings: targetWarnings } = await getTrackedPriceTargets();
    warnings.push(...targetWarnings);

    for (const target of targets) {
      try {
        const snapshot = await fetchRakutenPriceSnapshot(target);
        captured += 1;
        const result = await savePriceSnapshot(snapshot);
        if (result.saved) saved += 1;
        warnings.push(...result.warnings);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "料金取得に失敗しました";
        errors.push(`${target.hotelId}: ${message}`);
      }
    }

    return NextResponse.json({
      status: errors.length > 0 ? "partial_success" : "ok",
      targetCount: targets.length,
      captured,
      saved,
      warnings,
      errors,
    });
  } catch (error) {
    console.error("Failed to capture price snapshots:", error);
    return NextResponse.json(
      createApiErrorResponse(
        "料金スナップショットの保存に失敗しました",
        "Cron設定とProvider設定を確認してください",
      ),
      { status: 500 },
    );
  }
}
