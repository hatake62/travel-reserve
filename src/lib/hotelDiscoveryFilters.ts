import { getLowestValidPrice } from "@/lib/price";
import type { Hotel } from "@/types/hotel";
import type { Amenity } from "@/types/search";

export const AMENITY_MATCHERS: Record<Amenity, RegExp> = {
  onsen: /温泉/,
  largeBath: /大浴場/,
  parking: /駐車場|パーキング/,
  internet: /Wi-?Fi|wifi|インターネット|LAN/i,
  nonSmoking: /禁煙/,
  petFriendly: /ペット/,
  stationNear: /駅|徒歩/,
  sauna: /サウナ/,
  pool: /プール/,
  fitness: /フィットネス|ジム/,
};

export type HotelDiscoveryFilterParams = {
  minPrice?: number;
  maxPrice?: number;
  minUserRating?: number;
  minHotelClass?: number;
  amenities: Amenity[];
  applyPriceFilter?: boolean;
};

export type HotelDiscoveryFilterDebug = {
  minUserRating?: number;
  minHotelClass?: number;
  amenities: Amenity[];
  ratingFilterApplied: boolean;
  ratingMissingCount: number;
  ratingFilteredOutCount: number;
  hotelClassFilterApplied: boolean;
  hotelClassUnavailable: boolean;
  hotelClassFilteredOutCount: number;
  amenityFilterApplied: boolean;
  amenityMatchedCount: number;
  amenityUnknownCount: number;
  amenityMissingCount: number;
  amenityFilteredOutCount: number;
  amenityRelaxedToAvoidEmpty: boolean;
};

function hasFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getAmenityText(hotel: Hotel): string {
  return [
    hotel.amenityText,
    hotel.name,
    hotel.description,
    hotel.access,
    hotel.area,
    ...(hotel.amenities ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

function matchesAmenities(hotel: Hotel, amenities: Amenity[]): "matched" | "missing" | "not_matched" {
  if (amenities.length === 0) return "matched";
  const text = getAmenityText(hotel);
  if (!text.trim()) return "missing";
  return amenities.every((amenity) => AMENITY_MATCHERS[amenity].test(text))
    ? "matched"
    : "not_matched";
}

export function applyHotelDiscoveryFilters(
  hotels: Hotel[],
  filters: HotelDiscoveryFilterParams,
): { hotels: Hotel[]; debug: HotelDiscoveryFilterDebug } {
  const ratingFilterApplied = filters.minUserRating !== undefined;
  const ratingMissingCount = ratingFilterApplied
    ? hotels.filter((hotel) => !hasFiniteNumber(hotel.rating)).length
    : 0;
  let ratingFilteredOutCount = 0;
  let hotelClassFilteredOutCount = 0;

  let filtered = hotels.filter((hotel) => {
    const lowestPrice = getLowestValidPrice(hotel.offers);
    if (filters.applyPriceFilter && filters.minPrice !== undefined && (lowestPrice === undefined || lowestPrice < filters.minPrice)) {
      return false;
    }
    if (filters.applyPriceFilter && filters.maxPrice !== undefined && (lowestPrice === undefined || lowestPrice > filters.maxPrice)) {
      return false;
    }
    if (filters.minUserRating !== undefined) {
      const keep = hasFiniteNumber(hotel.rating) && hotel.rating >= filters.minUserRating;
      if (!keep) ratingFilteredOutCount += 1;
      return keep;
    }
    return true;
  });

  const anyHotelClassAvailable = filtered.some((hotel) =>
    hasFiniteNumber(hotel.hotelClass),
  );
  const hotelClassFilterApplied =
    filters.minHotelClass !== undefined && anyHotelClassAvailable;
  const minHotelClass = filters.minHotelClass;
  if (hotelClassFilterApplied && minHotelClass !== undefined) {
    filtered = filtered.filter(
      (hotel) => {
        const keep =
          !hasFiniteNumber(hotel.hotelClass) ||
          hotel.hotelClass >= minHotelClass;
        if (!keep) hotelClassFilteredOutCount += 1;
        return keep;
      },
    );
  }

  let amenityMatchedCount = 0;
  let amenityUnknownCount = 0;
  let amenityFilteredOutCount = 0;
  let amenityRelaxedToAvoidEmpty = false;
  if (filters.amenities.length > 0) {
    const beforeAmenityFilter = filtered;
    const amenityFiltered = filtered.filter((hotel) => {
      const result = matchesAmenities(hotel, filters.amenities);
      if (result === "matched") {
        amenityMatchedCount += 1;
        return true;
      }
      if (result === "missing") {
        amenityUnknownCount += 1;
        return true;
      }
      amenityFilteredOutCount += 1;
      return false;
    });
    if (amenityFiltered.length === 0 && beforeAmenityFilter.length > 0) {
      amenityRelaxedToAvoidEmpty = true;
      filtered = beforeAmenityFilter;
    } else {
      filtered = amenityFiltered;
    }
  }

  return {
    hotels: filtered,
    debug: {
      minUserRating: filters.minUserRating,
      minHotelClass: filters.minHotelClass,
      amenities: filters.amenities,
      ratingFilterApplied,
      ratingMissingCount,
      ratingFilteredOutCount,
      hotelClassFilterApplied,
      hotelClassUnavailable: filters.minHotelClass !== undefined && !anyHotelClassAvailable,
      hotelClassFilteredOutCount,
      amenityFilterApplied: filters.amenities.length > 0,
      amenityMatchedCount,
      amenityUnknownCount,
      amenityMissingCount: amenityUnknownCount,
      amenityFilteredOutCount,
      amenityRelaxedToAvoidEmpty,
    },
  };
}
