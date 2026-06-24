import type { Hotel } from "@/types/hotel";
import { getMockHotelById, getMockHotels } from "./mockProvider";
import {
  getRakutenHotelById,
  getRakutenHotels,
} from "./rakutenProvider";

export type HotelProvider = {
  getHotels: (options?: HotelSearchOptions) => Promise<Hotel[]>;
  getHotelById: (id: string | number) => Promise<Hotel | undefined>;
};

export type HotelSearchOptions = {
  keyword?: string;
};

const mockProvider: HotelProvider = {
  getHotels: getMockHotels,
  getHotelById: getMockHotelById,
};

const rakutenProvider: HotelProvider = {
  getHotels: getRakutenHotels,
  getHotelById: getRakutenHotelById,
};

export function getHotelProvider(): HotelProvider {
  return process.env.USE_MOCK_HOTELS === "false"
    ? rakutenProvider
    : mockProvider;
}
