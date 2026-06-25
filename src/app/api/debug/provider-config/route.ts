import { createApiErrorResponse } from "@/lib/apiError";
import { NextResponse } from "next/server";

function isEnabled(value: string | undefined, defaultValue = false): boolean {
  return value === undefined ? defaultValue : value === "true";
}

export async function GET() {
  try {
    const useMockHotels = process.env.USE_MOCK_HOTELS !== "false";
    const useRakutenProvider = isEnabled(process.env.USE_RAKUTEN_PROVIDER, true);
    const useJalanProvider = isEnabled(process.env.USE_JALAN_PROVIDER);
    const enabledProviders = useMockHotels
      ? ["mockProvider"]
      : [
          ...(useRakutenProvider ? ["rakutenProvider"] : []),
          ...(useJalanProvider ? ["jalanProvider"] : []),
        ];

    return NextResponse.json({
      useMockHotels,
      useRakutenProvider,
      useJalanProvider,
      enabledProviders,
      hasRakutenTravelAppId: Boolean(process.env.RAKUTEN_TRAVEL_APP_ID),
      hasRakutenTravelAccessKey: Boolean(
        process.env.RAKUTEN_TRAVEL_ACCESS_KEY,
      ),
      hasRakutenAffiliateId: Boolean(process.env.RAKUTEN_AFFILIATE_ID),
      hasJalanApiKey: Boolean(process.env.JALAN_API_KEY),
      status: enabledProviders.length > 0 ? "ok" : "error",
      hint:
        enabledProviders.length > 0
          ? undefined
          : ".env.localでUSE_MOCK_HOTELS=trueにするか、USE_RAKUTEN_PROVIDER=trueなどを設定してください",
    });
  } catch (error) {
    console.error("Failed to inspect provider config:", error);
    return NextResponse.json(
      createApiErrorResponse(
        "Provider設定の確認に失敗しました",
        ".env.local の値を確認して開発サーバーを再起動してください",
      ),
      { status: 500 },
    );
  }
}
