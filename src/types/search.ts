import type { RakutenAreaCandidate } from "@/types/rakutenArea";

export type SortBy = "recommended" | "priceAsc" | "priceDesc" | "ratingDesc";

export type BookingSite =
  | ""
  | "楽天トラベル"
  | "じゃらん"
  | "Yahoo!トラベル"
  | "一休.com";

export type SearchCondition = {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  sortBy: SortBy;
  maxPrice: number | null;
  site: BookingSite;
  breakfastOnly: boolean;
  rakutenAreaCandidate?: RakutenAreaCandidate;
};

export type HotelSearchParams = {
  keyword?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rakutenAreaCandidate?: RakutenAreaCandidate;
  areaClassCode?: string;
  middleClassCode?: string;
  smallClassCode?: string;
  detailClassCode?: string;
};

export type HotelProviderDebugInfo = {
  provider: string;
  rawCount: number;
  mappedCount: number;
  warnings: string[];
  responseTopLevelKeys?: string[];
  firstRawHotelKeys?: string[];
  firstRawHotelHotelKeys?: string[];
  detectedPattern?: string;
};
