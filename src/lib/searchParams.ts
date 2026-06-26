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
    checkIn: params.get("checkIn") ?? "",
    checkOut: params.get("checkOut") ?? "",
    guests: parseGuests(params.get("guests")),
    sortBy: isSortBy(sortBy) ? sortBy : DEFAULT_SEARCH_CONDITION.sortBy,
    maxPrice: parseMaxPrice(params.get("maxPrice")),
    site: isBookingSite(site) ? site : DEFAULT_SEARCH_CONDITION.site,
    breakfastOnly: params.get("breakfastOnly") === "true",
    page: parsePage(params.get("page")),
    rakutenAreaCandidate,
  };
}
