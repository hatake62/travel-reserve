import type { Hotel } from "@/types/hotel";
import type { HotelSearchParams } from "@/types/search";
import { getMockHotelById, getMockHotels } from "./mockProvider";
import {
  getRakutenHotelById,
  getRakutenVacantHotels,
} from "./rakutenProvider";

export type HotelProvider = {
  getHotels: (options?: HotelSearchOptions) => Promise<Hotel[]>;
  getHotelById: (id: string | number) => Promise<Hotel | undefined>;
};

export type HotelSearchOptions = HotelSearchParams;

const mockProvider: HotelProvider = {
  getHotels: getMockHotels,
  getHotelById: getMockHotelById,
};

const rakutenProvider: HotelProvider = {
  getHotels: getRakutenVacantHotels,
  getHotelById: getRakutenHotelById,
};

export function getHotelProvider(): HotelProvider {
  return process.env.USE_MOCK_HOTELS === "false"
    ? rakutenProvider
    : mockProvider;
}
