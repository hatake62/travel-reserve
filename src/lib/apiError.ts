export type ApiErrorResponse = {
  error: string;
  hint?: string;
};

export function getProviderErrorHint(message: string): string | undefined {
  if (message.includes("有効なホテルProviderがありません")) {
    return ".env.local の設定を確認してください";
  }
  if (
    message.includes("RAKUTEN_TRAVEL_") ||
    message.includes("JALAN_API_KEY")
  ) {
    return "有効にしたProviderのAPIキーが.env.localに設定されているか確認してください";
  }
  return undefined;
}

export function createApiErrorResponse(
  error: string,
  hint?: string,
): ApiErrorResponse {
  return { error, ...(hint ? { hint } : {}) };
}

export function getErrorMessageFromResponse(
  data: Partial<ApiErrorResponse> & { message?: string },
  fallback: string,
): ApiErrorResponse {
  return {
    error: data.error ?? data.message ?? fallback,
    hint: data.hint,
  };
}
