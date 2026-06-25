import { createApiErrorResponse } from "@/lib/apiError";
import { disablePriceWatchTarget } from "@/lib/priceHistoryRepository";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type PriceWatchTargetRouteContext = {
  params: Promise<{ id: string }>;
};

type UpdateTargetRequest = {
  enabled?: unknown;
};

export async function PATCH(
  request: Request,
  { params }: PriceWatchTargetRouteContext,
) {
  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as UpdateTargetRequest;

    if (typeof body.enabled !== "boolean") {
      return NextResponse.json(
        createApiErrorResponse("enabledはbooleanで指定してください"),
        { status: 400 },
      );
    }

    const target = await disablePriceWatchTarget(id, body.enabled);
    if (!target) {
      return NextResponse.json(
        createApiErrorResponse("追跡対象が見つかりませんでした"),
        { status: 404 },
      );
    }

    return NextResponse.json({ target });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "追跡対象の更新に失敗しました";
    const status = message.includes("DATABASE_URL") ? 503 : 500;
    return NextResponse.json(
      createApiErrorResponse(message, "DB設定とテーブル作成状況を確認してください"),
      { status },
    );
  }
}
