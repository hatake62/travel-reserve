import type { BookingSite, SearchCondition, SortBy } from "@/types/search";

export const DEFAULT_SEARCH_CONDITION: SearchCondition = {
  destination: "",
  checkIn: "",
  checkOut: "",
  guests: 2,
  sortBy: "recommended",
  maxPrice: null,
  site: "",
  breakfastOnly: false,
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

function isSortBy(value: string): value is SortBy {
  return SORT_VALUES.some((sortBy) => sortBy === value);
}

function isBookingSite(value: string): value is BookingSite {
  return SITE_VALUES.some((site) => site === value);
}

function parseGuests(value: string | null): number {
  if (value === null || value.trim() === "") return DEFAULT_SEARCH_CONDITION.guests;
  const guests = Number(value);
  return Number.isInteger(guests) && guests >= 1 && guests <= 5 ? guests : 1;
}

function parseMaxPrice(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const maxPrice = Number(value);
  return Number.isFinite(maxPrice) && maxPrice >= 0 ? maxPrice : null;
}

export function searchConditionToParams(
  condition: SearchCondition,
): URLSearchParams {
  const params = new URLSearchParams();

  if (condition.destination.trim()) {
    params.set("destination", condition.destination.trim());
  }
  if (condition.checkIn) params.set("checkIn", condition.checkIn);
  if (condition.checkOut) params.set("checkOut", condition.checkOut);
  params.set("guests", String(condition.guests));
  if (condition.sortBy !== DEFAULT_SEARCH_CONDITION.sortBy) {
    params.set("sortBy", condition.sortBy);
  }
  if (condition.maxPrice !== null) {
    params.set("maxPrice", String(condition.maxPrice));
  }
  if (condition.site) params.set("site", condition.site);
  if (condition.breakfastOnly) params.set("breakfastOnly", "true");

  return params;
}

export function searchParamsToCondition(
  params: URLSearchParams,
): SearchCondition {
  const sortBy = params.get("sortBy") ?? "";
  const site = params.get("site") ?? "";

  return {
    destination: params.get("destination") ?? "",
    checkIn: params.get("checkIn") ?? "",
    checkOut: params.get("checkOut") ?? "",
    guests: parseGuests(params.get("guests")),
    sortBy: isSortBy(sortBy) ? sortBy : DEFAULT_SEARCH_CONDITION.sortBy,
    maxPrice: parseMaxPrice(params.get("maxPrice")),
    site: isBookingSite(site) ? site : DEFAULT_SEARCH_CONDITION.site,
    breakfastOnly: params.get("breakfastOnly") === "true",
  };
}
