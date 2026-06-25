import { createApiErrorResponse } from "@/lib/apiError";
import {
  createCaptureLog,
  createCaptureLogItem,
  getEnabledPriceWatchTargets,
  MAX_ENABLED_PRICE_WATCH_TARGETS,
  savePriceSnapshot,
  updateCaptureLog,
} from "@/lib/priceHistoryRepository";
import { fetchRakutenPriceSnapshot } from "@/lib/hotelProviders/rakutenPriceSnapshotProvider";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getCronSecret(): string | undefined {
  return process.env.CRON_SECRET?.trim() || undefined;
}

function isAuthorized(request: Request): boolean {
  const secret = getCronSecret();
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

async function handleCapture(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      createApiErrorResponse(
        "CRON_SECRETが未設定です",
        "Vercel Environment Variablesを確認してください",
      ),
      { status: 500 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json(
      createApiErrorResponse("Unauthorized"),
      { status: 401 },
    );
  }

  const warnings: string[] = [];
  const errors: string[] = [];
  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  try {
    const { targets, warnings: targetWarnings } =
      await getEnabledPriceWatchTargets(MAX_ENABLED_PRICE_WATCH_TARGETS);
    warnings.push(...targetWarnings);
    const log = await createCaptureLog({
      targetCount: targets.length,
      message: "料金スナップショット取得を開始しました",
    });

    for (const target of targets) {
      try {
        const snapshot = await fetchRakutenPriceSnapshot(target);
        const result = await savePriceSnapshot(snapshot);
        warnings.push(...result.warnings);
        if (result.saved) {
          successCount += 1;
          if (log?.id) {
            await createCaptureLogItem({
              ...target,
              captureLogId: log.id,
              targetId: target.id,
              status: "success",
              message: snapshot.price === null ? "価格未取得として保存しました" : "",
            });
          }
        } else {
          skippedCount += 1;
          if (log?.id) {
            await createCaptureLogItem({
              ...target,
              captureLogId: log.id,
              targetId: target.id,
              status: "skipped",
              message: result.warnings.join(" / "),
            });
          }
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "料金取得に失敗しました";
        failureCount += 1;
        errors.push(`${target.hotelId}: ${message}`);
        if (log?.id) {
          await createCaptureLogItem({
            ...target,
            captureLogId: log.id,
            targetId: target.id,
            status: "failure",
            message,
          });
        }
      }
    }

    const message =
      failureCount > 0
        ? "料金スナップショット取得が一部失敗しました"
        : "料金スナップショット取得が完了しました";
    if (log?.id) {
      await updateCaptureLog(log.id, {
        finishedAt: new Date().toISOString(),
        targetCount: targets.length,
        successCount,
        failureCount,
        skippedCount,
        message,
      });
    }

    return NextResponse.json({
      status: failureCount > 0 ? "partial_success" : "ok",
      targetCount: targets.length,
      successCount,
      failureCount,
      skippedCount,
      message,
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

export async function GET(request: Request) {
  return handleCapture(request);
}

export async function POST(request: Request) {
  return handleCapture(request);
}
