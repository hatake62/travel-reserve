import type { Amenity, BookingSite, MealPlan, SearchCondition, SortBy } from "@/types/search";

export const DEFAULT_SEARCH_CONDITION: SearchCondition = {
  destination: "",
  checkIn: "",
  checkOut: "",
  guests: 2,
  sortBy: "recommended",
  mealPlan: "",
  minPrice: null,
  maxPrice: null,
  minUserRating: null,
  minHotelClass: null,
  amenities: [],
  features: [],
  site: "",
  breakfastOnly: false,
  page: 1,
};

const SORT_VALUES: SortBy[] = [
  "recommended",
  "priceAsc",
  "priceDesc",
  "ratingDesc",
];

const SITE_VALUES: BookingSite[] = [
  "",
  "楽天トラベル",
  "じゃらん",
  "Yahoo!トラベル",
  "一休.com",
];

export const AMENITY_OPTIONS: Array<{ value: Amenity; label: string }> = [
  { value: "onsen", label: "温泉" },
  { value: "largeBath", label: "大浴場" },
  { value: "parking", label: "駐車場" },
  { value: "internet", label: "インターネット利用可" },
  { value: "nonSmoking", label: "禁煙ルーム" },
  { value: "petFriendly", label: "ペット可" },
  { value: "stationNear", label: "駅近" },
  { value: "sauna", label: "サウナ" },
  { value: "pool", label: "プール" },
  { value: "fitness", label: "フィットネス" },
];

const MEAL_PLAN_VALUES: MealPlan[] = ["", "breakfast", "dinner", "dinnerBreakfast"];
const AMENITY_VALUES = AMENITY_OPTIONS.map((option) => option.value);

function isSortBy(value: string): value is SortBy {
  return SORT_VALUES.some((sortBy) => sortBy === value);
}

function isBookingSite(value: string): value is BookingSite {
  return SITE_VALUES.some((site) => site === value);
}

function isMealPlan(value: string): value is MealPlan {
  return MEAL_PLAN_VALUES.some((mealPlan) => mealPlan === value);
}

function isAmenity(value: string): value is Amenity {
  return AMENITY_VALUES.some((amenity) => amenity === value);
}

function parseMaxPrice(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const maxPrice = Number(value);
  return Number.isFinite(maxPrice) && maxPrice >= 0 ? maxPrice : null;
}

function parsePrice(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function parseRating(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const rating = Number(value);
  return [3, 3.5, 4, 4.5].includes(rating) ? rating : null;
}

function parseHotelClass(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const hotelClass = Number(value);
  return [3, 4, 5].includes(hotelClass) ? hotelClass : null;
}

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 1 ? page : 1;
}

export function searchConditionToParams(
  condition: SearchCondition,
): URLSearchParams {
  const params = new URLSearchParams();

  if (condition.destination.trim()) {
    params.set("destination", condition.destination.trim());
  }
  if (condition.minPrice !== null) {
    params.set("minPrice", String(condition.minPrice));
  }
  if (condition.maxPrice !== null) {
    params.set("maxPrice", String(condition.maxPrice));
  }
  if (condition.minUserRating !== null) {
    params.set("minUserRating", String(condition.minUserRating));
  }
  if (condition.minHotelClass !== null) {
    params.set("minHotelClass", String(condition.minHotelClass));
  }
  if (condition.amenities.length > 0) params.set("amenities", condition.amenities.join(","));
  if (condition.page > 1) params.set("page", String(condition.page));

  const area = condition.rakutenAreaCandidate;
  if (area) {
    params.set("areaClassCode", area.areaClassCode);
    params.set("middleClassCode", area.middleClassCode);
    if (area.smallClassCode) params.set("smallClassCode", area.smallClassCode);
    if (area.detailClassCode) params.set("detailClassCode", area.detailClassCode);
  }

  return params;
}

export function searchParamsToCondition(
  params: URLSearchParams,
): SearchCondition {
  const sortBy = params.get("sortBy") ?? "";
  const site = params.get("site") ?? "";
  const mealPlan = params.get("mealPlan") ?? "";
  const areaClassCode = params.get("areaClassCode") ?? "";
  const middleClassCode = params.get("middleClassCode") ?? "";
  const destination = params.get("destination") ?? "";
  const rakutenAreaCandidate = areaClassCode && middleClassCode
    ? {
        areaClassCode,
        areaClassName: "",
        largeClassCode: areaClassCode,
        largeClassName: "",
        middleClassCode,
        middleClassName: destination,
        smallClassCode: params.get("smallClassCode") ?? "",
        smallClassName: "",
        detailClassCode: params.get("detailClassCode") ?? "",
        detailClassName: "",
        displayName: destination,
      }
    : undefined;

  return {
    destination,
    checkIn: "",
    checkOut: "",
    guests: DEFAULT_SEARCH_CONDITION.guests,
    sortBy: isSortBy(sortBy) ? sortBy : DEFAULT_SEARCH_CONDITION.sortBy,
    mealPlan: isMealPlan(mealPlan) ? mealPlan : DEFAULT_SEARCH_CONDITION.mealPlan,
    minPrice: parsePrice(params.get("minPrice")),
    maxPrice: parseMaxPrice(params.get("maxPrice")),
    minUserRating: parseRating(params.get("minUserRating")),
    minHotelClass: parseHotelClass(params.get("minHotelClass")),
    amenities: (params.get("amenities") ?? "")
      .split(",")
      .map((amenity) => amenity.trim())
      .filter(isAmenity),
    features: (params.get("features") ?? "")
      .split(",")
      .map((feature) => feature.trim())
      .filter(Boolean),
    site: isBookingSite(site) ? site : DEFAULT_SEARCH_CONDITION.site,
    breakfastOnly: params.get("breakfastOnly") === "true",
    page: parsePage(params.get("page")),
    rakutenAreaCandidate,
  };
}
