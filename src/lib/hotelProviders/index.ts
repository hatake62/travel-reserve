import type { Hotel } from "@/types/hotel";
import type { HotelProviderDebugInfo, HotelSearchParams } from "@/types/search";
import { mergeHotelsByIdentity } from "@/lib/hotelMerge";
import { getJalanHotelById, getJalanHotels } from "./jalanProvider";
import { getMockHotelById, getMockHotels } from "./mockProvider";
import {
  getRakutenHotelById,
  getRakutenVacantHotels,
  getRakutenVacantHotelsWithDebug,
} from "./rakutenProvider";

export type HotelSearchOptions = HotelSearchParams & {
  onNotice?: (message: string) => void;
};

export type HotelProviderSearchResult = {
  hotels: Hotel[];
  debug: HotelProviderDebugInfo;
};

export type HotelProvider = {
  name: string;
  debugName: string;
  getHotels: (options?: HotelSearchOptions) => Promise<Hotel[]>;
  getHotelsWithDebug?: (
    options?: HotelSearchOptions,
  ) => Promise<HotelProviderSearchResult>;
  getHotelById: (id: string | number) => Promise<Hotel | undefined>;
};

const mockProvider: HotelProvider = {
  name: "仮データ",
  debugName: "mock",
  getHotels: getMockHotels,
  getHotelById: getMockHotelById,
};

const rakutenProvider: HotelProvider = {
  name: "楽天",
  debugName: "rakuten",
  getHotels: getRakutenVacantHotels,
  getHotelsWithDebug: getRakutenVacantHotelsWithDebug,
  getHotelById: getRakutenHotelById,
};

const jalanProvider: HotelProvider = {
  name: "じゃらん",
  debugName: "jalan",
  getHotels: getJalanHotels,
  getHotelById: getJalanHotelById,
};

function isEnabled(value: string | undefined, defaultValue = false): boolean {
  return value === undefined ? defaultValue : value === "true";
}

function getEnabledProviders(): HotelProvider[] {
  if (process.env.USE_MOCK_HOTELS !== "false") return [mockProvider];

  const providers: HotelProvider[] = [];
  if (isEnabled(process.env.USE_RAKUTEN_PROVIDER)) providers.push(rakutenProvider);
  if (isEnabled(process.env.USE_JALAN_PROVIDER)) providers.push(jalanProvider);
  return providers;
}

async function getProviderSearchResult(
  provider: HotelProvider,
  options: HotelSearchOptions,
): Promise<HotelProviderSearchResult> {
  if (provider.getHotelsWithDebug) return provider.getHotelsWithDebug(options);

  const hotels = await provider.getHotels(options);
  return {
    hotels,
    debug: {
      provider: provider.debugName,
      rawCount: hotels.length,
      mappedCount: hotels.length,
      warnings: [],
    },
  };
}

export async function getHotelsFromEnabledProvidersWithDebug(
  options: HotelSearchOptions = {},
): Promise<HotelProviderSearchResult> {
  const providers = getEnabledProviders();
  if (providers.length === 0) {
    throw new Error("有効なホテルProviderがありません。環境変数を確認してください。");
  }

  const hotels: Hotel[] = [];
  const failures: string[] = [];
  const debugEntries: HotelProviderDebugInfo[] = [];

  for (const provider of providers) {
    try {
      const result = await getProviderSearchResult(provider, options);
      hotels.push(...result.hotels);
      debugEntries.push(result.debug);
      if (result.debug.rawCount > 0 && result.debug.mappedCount === 0) {
        const notice = `${provider.name}APIは${result.debug.rawCount}件返しましたが、Hotel型への変換結果が0件でした。`;
        console.warn(notice);
        options.onNotice?.(notice);
      } else if (result.debug.rawCount === 0) {
        console.info(`${provider.name}APIは0件を返しました。`);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "不明なエラー";
      failures.push(`${provider.name}APIの取得に失敗しました: ${detail}`);
    }
  }

  if (failures.length === providers.length) {
    throw new Error(failures.join(" / "));
  }
  if (failures.length > 0) {
    const notice = `${failures.join(" / ")}。取得できたホテル情報を表示しています。`;
    console.warn(notice);
    options.onNotice?.(notice);
  }

  const mergedHotels = mergeHotelsByIdentity(hotels);
  return {
    hotels: mergedHotels,
    debug: mergeProviderDebug(debugEntries, failures, mergedHotels.length),
  };
}

function mergeProviderDebug(
  debugEntries: HotelProviderDebugInfo[],
  failures: string[],
  mappedCount: number,
): HotelProviderDebugInfo {
  if (debugEntries.length === 1 && failures.length === 0) return debugEntries[0];

  return {
    provider: debugEntries.map((entry) => entry.provider).join("+") || "none",
    rawCount: debugEntries.reduce((sum, entry) => sum + entry.rawCount, 0),
    mappedCount,
    warnings: [
      ...debugEntries.flatMap((entry) =>
        entry.warnings.map((warning) => `${entry.provider}: ${warning}`),
      ),
      ...failures,
    ],
  };
}

export async function getHotelsFromEnabledProviders(
  options: HotelSearchOptions = {},
): Promise<Hotel[]> {
  return (await getHotelsFromEnabledProvidersWithDebug(options)).hotels;
}

export function getHotelProvider(): HotelProvider {
  return {
    name: "有効なProvider",
    debugName: "enabled",
    getHotels: getHotelsFromEnabledProviders,
    getHotelsWithDebug: getHotelsFromEnabledProvidersWithDebug,
    async getHotelById(id) {
      const providers = getEnabledProviders();
      if (providers.length === 0) {
        throw new Error("有効なホテルProviderがありません。環境変数を確認してください。");
      }
      if (providers[0] === mockProvider) return mockProvider.getHotelById(id);
      const primaryProvider = String(id).startsWith("jalan-")
        ? jalanProvider
        : rakutenProvider;
      if (!providers.includes(primaryProvider)) return undefined;

      const primaryHotel = await primaryProvider.getHotelById(id);
      if (!primaryHotel || providers.length === 1) return primaryHotel;

      const candidates: Hotel[] = [primaryHotel];
      for (const provider of providers) {
        if (provider === primaryProvider) continue;
        try {
          candidates.push(...(await provider.getHotels({ keyword: primaryHotel.name })));
        } catch {
          // 一覧を表示できたProviderの詳細を、他Providerの一時障害で壊さない。
        }
      }
      return mergeHotelsByIdentity(candidates).find((hotel) =>
        Object.values(hotel.providerIds ?? {}).includes(
          String(id).replace(/^jalan-/, ""),
        ),
      ) ?? primaryHotel;
    },
  };
}
