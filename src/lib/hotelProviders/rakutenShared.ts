import { fetchWithProviderTimeout } from "@/lib/providerFetch";

const DEFAULT_RAKUTEN_ALLOWED_ORIGIN = "https://travel-reserve.vercel.app";
const SENSITIVE_RAKUTEN_QUERY_KEYS = [
  "applicationId",
  "accessKey",
  "affiliateId",
] as const;

type NextFetchInit = RequestInit & {
  next?: {
    revalidate?: number | false;
  };
};

export type RakutenCredentials = {
  applicationId: string;
  accessKey: string;
  affiliateId?: string;
};

export function getRakutenCredentials(): RakutenCredentials {
  const applicationId = process.env.RAKUTEN_TRAVEL_APP_ID?.trim();
  const accessKey = process.env.RAKUTEN_TRAVEL_ACCESS_KEY?.trim();

  if (!applicationId || !accessKey) {
    throw new Error(
      "楽天APIキーが設定されていません。RAKUTEN_TRAVEL_APP_ID と RAKUTEN_TRAVEL_ACCESS_KEY を確認してください。",
    );
  }

  return {
    applicationId,
    accessKey,
    affiliateId: process.env.RAKUTEN_AFFILIATE_ID?.trim() || undefined,
  };
}

export function createRakutenParams(
  credentials = getRakutenCredentials(),
): URLSearchParams {
  const params = new URLSearchParams({
    applicationId: credentials.applicationId,
    accessKey: credentials.accessKey,
    format: "json",
    formatVersion: "2",
  });

  if (credentials.affiliateId) {
    params.set("affiliateId", credentials.affiliateId);
  }

  return params;
}

export function getRakutenAllowedOrigin(): string {
  const origin =
    process.env.RAKUTEN_ALLOWED_ORIGIN?.trim() || DEFAULT_RAKUTEN_ALLOWED_ORIGIN;
  return origin.replace(/\/+$/, "");
}

export function maskRakutenUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  for (const key of SENSITIVE_RAKUTEN_QUERY_KEYS) {
    if (url.searchParams.has(key)) {
      url.searchParams.set(key, "***");
    }
  }
  return url.toString();
}

export function maskRakutenSecrets(value: string): string {
  const secrets = [
    process.env.RAKUTEN_TRAVEL_APP_ID,
    process.env.RAKUTEN_TRAVEL_ACCESS_KEY,
    process.env.RAKUTEN_AFFILIATE_ID,
  ].flatMap((secret) => {
    const trimmed = secret?.trim();
    return trimmed ? [trimmed, encodeURIComponent(trimmed)] : [];
  });

  return secrets.reduce(
    (masked, secret) => masked.split(secret).join("***"),
    value,
  );
}

export function getRakutenResponseBodySnippet(body: string): string {
  return maskRakutenSecrets(body).slice(0, 500);
}

export async function fetchRakutenApi(
  endpoint: string,
  params: URLSearchParams,
  init: NextFetchInit = {},
): Promise<{ response: Response; responseBody: string; requestUrl: string }> {
  const requestUrl = `${endpoint}?${params.toString()}`;
  const allowedOrigin = getRakutenAllowedOrigin();
  const response = await fetchWithProviderTimeout(
    requestUrl,
    {
      ...init,
      headers: {
        Accept: "application/json",
        Referer: allowedOrigin,
        Origin: allowedOrigin,
        ...init.headers,
      },
    },
    { providerName: "楽天トラベル" },
  );
  const responseBody = await response.text().catch(() => "");

  return { response, responseBody, requestUrl };
}
