import type { BookingSite, MealPlan, SearchCondition, SortBy } from "@/types/search";

export const DEFAULT_SEARCH_CONDITION: SearchCondition = {
  destination: "",
  checkIn: "",
  checkOut: "",
  guests: 2,
  sortBy: "recommended",
  mealPlan: "",
  minPrice: null,
  maxPrice: null,
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

const MEAL_PLAN_VALUES: MealPlan[] = ["", "breakfast", "dinnerBreakfast"];

function isSortBy(value: string): value is SortBy {
  return SORT_VALUES.some((sortBy) => sortBy === value);
}

function isBookingSite(value: string): value is BookingSite {
  return SITE_VALUES.some((site) => site === value);
}

function isMealPlan(value: string): value is MealPlan {
  return MEAL_PLAN_VALUES.some((mealPlan) => mealPlan === value);
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
  if (condition.sortBy !== DEFAULT_SEARCH_CONDITION.sortBy) {
    params.set("sortBy", condition.sortBy);
  }
  if (condition.mealPlan) params.set("mealPlan", condition.mealPlan);
  if (condition.minPrice !== null) {
    params.set("minPrice", String(condition.minPrice));
  }
  if (condition.maxPrice !== null) {
    params.set("maxPrice", String(condition.maxPrice));
  }
  if (condition.features.length > 0) params.set("features", condition.features.join(","));
  if (condition.site) params.set("site", condition.site);
  if (condition.breakfastOnly) params.set("breakfastOnly", "true");
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
