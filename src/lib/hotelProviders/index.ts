import type { Hotel } from "@/types/hotel";
import type { HotelSearchParams } from "@/types/search";
import { getJalanHotelById, getJalanHotels } from "./jalanProvider";
import { getMockHotelById, getMockHotels } from "./mockProvider";
import {
  getRakutenHotelById,
  getRakutenVacantHotels,
} from "./rakutenProvider";

export type HotelSearchOptions = HotelSearchParams & {
  onNotice?: (message: string) => void;
};

export type HotelProvider = {
  name: string;
  getHotels: (options?: HotelSearchOptions) => Promise<Hotel[]>;
  getHotelById: (id: string | number) => Promise<Hotel | undefined>;
};

const mockProvider: HotelProvider = {
  name: "仮データ",
  getHotels: getMockHotels,
  getHotelById: getMockHotelById,
};

const rakutenProvider: HotelProvider = {
  name: "楽天",
  getHotels: getRakutenVacantHotels,
  getHotelById: getRakutenHotelById,
};

const jalanProvider: HotelProvider = {
  name: "じゃらん",
  getHotels: getJalanHotels,
  getHotelById: getJalanHotelById,
};

function isEnabled(value: string | undefined, defaultValue = false): boolean {
  return value === undefined ? defaultValue : value === "true";
}

function getEnabledProviders(): HotelProvider[] {
  if (process.env.USE_MOCK_HOTELS !== "false") return [mockProvider];

  const providers: HotelProvider[] = [];
  if (isEnabled(process.env.USE_RAKUTEN_PROVIDER, true)) providers.push(rakutenProvider);
  if (isEnabled(process.env.USE_JALAN_PROVIDER)) providers.push(jalanProvider);
  return providers;
}

export async function getHotelsFromEnabledProviders(
  options: HotelSearchOptions = {},
): Promise<Hotel[]> {
  const providers = getEnabledProviders();
  if (providers.length === 0) {
    throw new Error("有効なホテルProviderがありません。環境変数を確認してください。");
  }

  const hotels: Hotel[] = [];
  const failures: string[] = [];

  for (const provider of providers) {
    try {
      hotels.push(...(await provider.getHotels(options)));
    } catch (error) {
      const detail = error instanceof Error ? error.message : "不明なエラー";
      failures.push(`${provider.name}APIの取得に失敗しました: ${detail}`);
    }
  }

  if (failures.length === providers.length) {
    throw new Error(failures.join(" / "));
  }
  if (failures.length > 0) {
    options.onNotice?.(`${failures.join(" / ")}。取得できたProviderの結果を表示しています。`);
  }

  // TODO: 同じホテル名・住所・緯度経度を使って楽天とじゃらんのホテルを統合する。
  // TODO: 同じホテルと判定できた場合は offers に楽天とじゃらんの料金をまとめる。
  return hotels;
}

export function getHotelProvider(): HotelProvider {
  return {
    name: "有効なProvider",
    getHotels: getHotelsFromEnabledProviders,
    async getHotelById(id) {
      const providers = getEnabledProviders();
      if (providers.length === 0) {
        throw new Error("有効なホテルProviderがありません。環境変数を確認してください。");
      }
      if (providers[0] === mockProvider) return mockProvider.getHotelById(id);
      if (String(id).startsWith("jalan-")) {
        return providers.includes(jalanProvider)
          ? jalanProvider.getHotelById(id)
          : undefined;
      }
      return providers.includes(rakutenProvider)
        ? rakutenProvider.getHotelById(id)
        : undefined;
    },
  };
}
