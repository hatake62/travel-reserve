import type { RakutenAreaCandidate } from "@/types/rakutenArea";

export type SortBy = "recommended" | "priceAsc" | "priceDesc" | "ratingDesc";
export type SearchCriteriaSort =
  | "recommended"
  | "price_asc"
  | "price_desc"
  | "rating_desc";

export type BookingSite =
  | ""
  | "楽天トラベル"
  | "じゃらん"
  | "Yahoo!トラベル"
  | "一休.com";

export type MealPlan = "" | "breakfast" | "dinner" | "dinnerBreakfast";

export type Amenity =
  | "onsen"
  | "largeBath"
  | "parking"
  | "internet"
  | "nonSmoking"
  | "petFriendly"
  | "stationNear"
  | "sauna"
  | "pool"
  | "fitness";

export type SearchCondition = {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  sortBy: SortBy;
  mealPlan: MealPlan;
  minPrice: number | null;
  maxPrice: number | null;
  minUserRating: number | null;
  minHotelClass: number | null;
  amenities: Amenity[];
  features: string[];
  site: BookingSite;
  breakfastOnly: boolean;
  page: number;
  rakutenAreaCandidate?: RakutenAreaCandidate;
};

export type SearchCriteria = {
  destination?: string;
  area?: {
    largeClassCode?: string;
    middleClassCode?: string;
    smallClassCode?: string;
    detailClassCode?: string;
    label?: string;
  };
  minPrice?: number;
  maxPrice?: number;
  minUserRating?: number;
  minHotelClass?: number;
  amenities?: Amenity[];
  page: number;
  limit: number;
  sort?: SearchCriteriaSort;
};

export type HotelSearchParams = {
  keyword?: string;
  criteria?: SearchCriteria;
  searchMaxHotels?: number;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  minUserRating?: number | null;
  minHotelClass?: number | null;
  amenities?: Amenity[];
  rakutenAreaCandidate?: RakutenAreaCandidate;
  largeClassCode?: string;
  areaClassCode?: string;
  middleClassCode?: string;
  smallClassCode?: string;
  detailClassCode?: string;
  page?: number;
  limit?: number;
  sort?: SearchCriteriaSort;
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
  apiRequestParamsSafe?: Record<string, string>;
  appliedApiFilters?: string[];
  searchSkipped?: boolean;
  reason?: string;
  searchMaxHotels?: number;
  hardLimit?: number;
  hasDestination?: boolean;
  hasFilters?: boolean;
  rakutenHitsPerPage?: number;
  rakutenPagesRequested?: number;
  rakutenPagesFetched?: number;
  rakutenPageResults?: number[];
  rateLimitHit?: boolean;
  cacheHit?: boolean;
};
