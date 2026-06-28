import type {
  Amenity,
  BookingSite,
  MealPlan,
  SearchCondition,
  SearchCriteria,
  SearchCriteriaSort,
  SortBy,
} from "@/types/search";

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
const DEFAULT_CRITERIA_LIMIT = 10;

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

function parseLimit(value: string | null): number {
  const limit = Number(value);
  return Number.isInteger(limit) && limit >= 1 && limit <= 30
    ? limit
    : DEFAULT_CRITERIA_LIMIT;
}

function toCriteriaSort(sortBy: SortBy): SearchCriteriaSort {
  if (sortBy === "priceAsc") return "price_asc";
  if (sortBy === "priceDesc") return "price_desc";
  if (sortBy === "ratingDesc") return "rating_desc";
  return "recommended";
}

function toSortBy(sort: SearchCriteriaSort | undefined): SortBy {
  if (sort === "price_asc") return "priceAsc";
  if (sort === "price_desc") return "priceDesc";
  if (sort === "rating_desc") return "ratingDesc";
  return "recommended";
}

function parseCriteriaSort(value: string | null): SearchCriteriaSort | undefined {
  if (
    value === "recommended" ||
    value === "price_asc" ||
    value === "price_desc" ||
    value === "rating_desc"
  ) {
    return value;
  }
  if (value === "priceAsc") return "price_asc";
  if (value === "priceDesc") return "price_desc";
  if (value === "ratingDesc") return "rating_desc";
  return undefined;
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
  const criteriaSort = toCriteriaSort(condition.sortBy);
  if (criteriaSort !== "recommended") params.set("sort", criteriaSort);

  const area = condition.rakutenAreaCandidate;
  if (area) {
    params.set("largeClassCode", area.areaClassCode);
    params.set("middleClassCode", area.middleClassCode);
    if (area.smallClassCode) params.set("smallClassCode", area.smallClassCode);
    if (area.detailClassCode) params.set("detailClassCode", area.detailClassCode);
  }

  return params;
}

export function searchConditionToCriteria(
  condition: SearchCondition,
  limit = DEFAULT_CRITERIA_LIMIT,
): SearchCriteria {
  const area = condition.rakutenAreaCandidate
    ? {
        largeClassCode: condition.rakutenAreaCandidate.areaClassCode || undefined,
        middleClassCode: condition.rakutenAreaCandidate.middleClassCode || undefined,
        smallClassCode: condition.rakutenAreaCandidate.smallClassCode || undefined,
        detailClassCode: condition.rakutenAreaCandidate.detailClassCode || undefined,
        label: condition.rakutenAreaCandidate.label ?? condition.rakutenAreaCandidate.displayName,
      }
    : undefined;

  return {
    destination: condition.destination.trim() || undefined,
    area,
    minPrice: condition.minPrice ?? undefined,
    maxPrice: condition.maxPrice ?? undefined,
    minUserRating: condition.minUserRating ?? undefined,
    minHotelClass: condition.minHotelClass ?? undefined,
    amenities: condition.amenities.length > 0 ? condition.amenities : undefined,
    page: Math.max(1, condition.page),
    limit,
    sort: toCriteriaSort(condition.sortBy),
  };
}

export function searchCriteriaToApiParams(criteria: SearchCriteria): URLSearchParams {
  const params = new URLSearchParams();
  if (criteria.destination?.trim()) params.set("destination", criteria.destination.trim());
  if (criteria.area?.largeClassCode) params.set("largeClassCode", criteria.area.largeClassCode);
  if (criteria.area?.middleClassCode) params.set("middleClassCode", criteria.area.middleClassCode);
  if (criteria.area?.smallClassCode) params.set("smallClassCode", criteria.area.smallClassCode);
  if (criteria.area?.detailClassCode) params.set("detailClassCode", criteria.area.detailClassCode);
  if (criteria.minPrice !== undefined) params.set("minPrice", String(criteria.minPrice));
  if (criteria.maxPrice !== undefined) params.set("maxPrice", String(criteria.maxPrice));
  if (criteria.minUserRating !== undefined) {
    params.set("minUserRating", String(criteria.minUserRating));
  }
  if (criteria.minHotelClass !== undefined) {
    params.set("minHotelClass", String(criteria.minHotelClass));
  }
  if (criteria.amenities && criteria.amenities.length > 0) {
    params.set("amenities", criteria.amenities.join(","));
  }
  if (criteria.page > 1) params.set("page", String(criteria.page));
  if (criteria.limit !== DEFAULT_CRITERIA_LIMIT) params.set("limit", String(criteria.limit));
  if (criteria.sort && criteria.sort !== "recommended") params.set("sort", criteria.sort);
  return params;
}

export function searchParamsToCriteria(params: URLSearchParams): SearchCriteria {
  const destination = params.get("destination") ?? params.get("keyword") ?? "";
  const largeClassCode = params.get("largeClassCode") ?? params.get("areaClassCode") ?? "";
  const middleClassCode = params.get("middleClassCode") ?? "";
  const smallClassCode = params.get("smallClassCode") ?? "";
  const detailClassCode = params.get("detailClassCode") ?? "";
  const amenities = (params.get("amenities") ?? "")
    .split(",")
    .map((amenity) => amenity.trim())
    .filter(isAmenity);

  return {
    destination: destination.trim() || undefined,
    area: largeClassCode || middleClassCode || smallClassCode || detailClassCode
      ? {
          largeClassCode: largeClassCode || undefined,
          middleClassCode: middleClassCode || undefined,
          smallClassCode: smallClassCode || undefined,
          detailClassCode: detailClassCode || undefined,
          label: destination.trim() || undefined,
        }
      : undefined,
    minPrice: parsePrice(params.get("minPrice")) ?? undefined,
    maxPrice: parseMaxPrice(params.get("maxPrice")) ?? undefined,
    minUserRating: parseRating(params.get("minUserRating")) ?? undefined,
    minHotelClass: parseHotelClass(params.get("minHotelClass")) ?? undefined,
    amenities: amenities.length > 0 ? amenities : undefined,
    page: parsePage(params.get("page")),
    limit: parseLimit(params.get("limit")),
    sort: parseCriteriaSort(params.get("sort")) ?? "recommended",
  };
}

export function hasHotelSearchCriteria(criteria: SearchCriteria): boolean {
  return Boolean(
    criteria.destination?.trim() ||
      criteria.area?.largeClassCode ||
      criteria.area?.middleClassCode ||
      criteria.area?.smallClassCode ||
      criteria.area?.detailClassCode ||
      criteria.minPrice !== undefined ||
      criteria.maxPrice !== undefined ||
      criteria.minUserRating !== undefined ||
      criteria.minHotelClass !== undefined ||
      (criteria.amenities && criteria.amenities.length > 0),
  );
}

export function hasHotelSearchFilters(criteria: SearchCriteria): boolean {
  return Boolean(
    criteria.minPrice !== undefined ||
      criteria.maxPrice !== undefined ||
      criteria.minUserRating !== undefined ||
      criteria.minHotelClass !== undefined ||
      (criteria.amenities && criteria.amenities.length > 0),
  );
}

export function searchParamsToCondition(
  params: URLSearchParams,
): SearchCondition {
  const sortBy = params.get("sortBy") ?? "";
  const criteriaSort = parseCriteriaSort(params.get("sort"));
  const site = params.get("site") ?? "";
  const mealPlan = params.get("mealPlan") ?? "";
  const areaClassCode = params.get("largeClassCode") ?? params.get("areaClassCode") ?? "";
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
    sortBy: criteriaSort ? toSortBy(criteriaSort) : isSortBy(sortBy) ? sortBy : DEFAULT_SEARCH_CONDITION.sortBy,
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
