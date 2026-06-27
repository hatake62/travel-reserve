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
  minPrice: number | null;
  maxPrice: number | null;
  minUserRating: number | null;
  minHotelClass: number | null;
  amenities: Amenity[];
};

export type HotelDiscoveryFilterDebug = {
  minUserRating: number | null;
  minHotelClass: number | null;
  amenities: Amenity[];
  ratingFilterApplied: boolean;
  ratingMissingCount: number;
  hotelClassFilterApplied: boolean;
  hotelClassUnavailable: boolean;
  amenityFilterApplied: boolean;
  amenityMatchedCount: number;
  amenityMissingCount: number;
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
  const ratingFilterApplied = filters.minUserRating !== null;
  const ratingMissingCount = ratingFilterApplied
    ? hotels.filter((hotel) => !hasFiniteNumber(hotel.rating)).length
    : 0;

  let filtered = hotels.filter((hotel) => {
    const lowestPrice = getLowestValidPrice(hotel.offers);
    if (filters.minPrice !== null && (lowestPrice === undefined || lowestPrice < filters.minPrice)) {
      return false;
    }
    if (filters.maxPrice !== null && (lowestPrice === undefined || lowestPrice > filters.maxPrice)) {
      return false;
    }
    if (filters.minUserRating !== null) {
      return hasFiniteNumber(hotel.rating) && hotel.rating >= filters.minUserRating;
    }
    return true;
  });

  const anyHotelClassAvailable = filtered.some((hotel) =>
    hasFiniteNumber(hotel.hotelClass),
  );
  const hotelClassFilterApplied =
    filters.minHotelClass !== null && anyHotelClassAvailable;
  const minHotelClass = filters.minHotelClass;
  if (hotelClassFilterApplied && minHotelClass !== null) {
    filtered = filtered.filter(
      (hotel) =>
        !hasFiniteNumber(hotel.hotelClass) ||
        hotel.hotelClass >= minHotelClass,
    );
  }

  let amenityMatchedCount = 0;
  let amenityMissingCount = 0;
  if (filters.amenities.length > 0) {
    filtered = filtered.filter((hotel) => {
      const result = matchesAmenities(hotel, filters.amenities);
      if (result === "matched") {
        amenityMatchedCount += 1;
        return true;
      }
      if (result === "missing") {
        amenityMissingCount += 1;
        return true;
      }
      return false;
    });
  }

  return {
    hotels: filtered,
    debug: {
      minUserRating: filters.minUserRating,
      minHotelClass: filters.minHotelClass,
      amenities: filters.amenities,
      ratingFilterApplied,
      ratingMissingCount,
      hotelClassFilterApplied,
      hotelClassUnavailable: filters.minHotelClass !== null && !anyHotelClassAvailable,
      amenityFilterApplied: filters.amenities.length > 0,
      amenityMatchedCount,
      amenityMissingCount,
    },
  };
}
