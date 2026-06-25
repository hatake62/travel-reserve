export type ApiErrorResponse = {
  error: string;
  hint?: string;
};

export function getProviderErrorHint(message: string): string | undefined {
  if (message.includes("有効なホテルProviderがありません")) {
    return "VercelのEnvironment Variablesまたは.env.localを確認し、/api/debug/provider-configで有効なProviderを確認してください";
  }
  if (
    message.includes("RAKUTEN_TRAVEL_") ||
    message.includes("JALAN_API_KEY")
  ) {
    return "有効にしたProviderのAPIキーがVercelのEnvironment Variablesまたは.env.localに設定されているか確認してください。設定後はRedeployが必要です";
  }
  if (message.includes("楽天") && message.includes("HTTP 403")) {
    return "HTTP 403です。楽天Web ServiceのAllowed websites/IPs、アプリID、アクセスキー、API URLを確認してください。";
  }
  if (message.includes("API") || message.includes("Provider")) {
    return "時間をおいて再試行するか、/api/debug/provider-configでProvider設定を確認してください";
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
