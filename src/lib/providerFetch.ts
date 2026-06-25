const DEFAULT_PROVIDER_TIMEOUT_MS = 9000;

type NextFetchInit = RequestInit & {
  next?: {
    revalidate?: number | false;
  };
};

type FetchWithTimeoutOptions = {
  providerName: string;
  timeoutMs?: number;
};

export async function fetchWithProviderTimeout(
  url: string,
  init: NextFetchInit,
  {
    providerName,
    timeoutMs = DEFAULT_PROVIDER_TIMEOUT_MS,
  }: FetchWithTimeoutOptions,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `${providerName}APIの取得がタイムアウトしました。時間をおいて再試行してください。`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
