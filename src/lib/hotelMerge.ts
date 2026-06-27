import type { Hotel, HotelOffer } from "@/types/hotel";
import { isValidPrice, sortOffersByPrice } from "@/lib/price";

const MIN_NORMALIZED_NAME_LENGTH = 4;

export function normalizeHotelName(name: string): string {
  return name
    .normalize("NFKC")
    .toLocaleLowerCase("ja")
    .replace(/[\s\u3000]/g, "")
    .replace(/[!-/:-@[-`{-~、。・「」『』【】（）［］｛｝〈〉《》〔〕]/g, "");
}

export function normalizeAddressOrArea(area: string): string {
  return area
    .normalize("NFKC")
    .toLocaleLowerCase("ja")
    .replace(/[\s\u3000]/g, "")
    .replace(/[〒ー‐‑‒–—―,，、。・]/g, "")
    .replace(/(都|道|府|県|市|区|町|村)/g, "");
}

export function isSameHotel(a: Hotel, b: Hotel): boolean {
  const nameA = normalizeHotelName(a.name);
  const nameB = normalizeHotelName(b.name);

  if (
    nameA.length < MIN_NORMALIZED_NAME_LENGTH ||
    nameB.length < MIN_NORMALIZED_NAME_LENGTH
  ) {
    return false;
  }
  if (nameA === nameB) return true;

  const areaA = normalizeAddressOrArea(a.area);
  const areaB = normalizeAddressOrArea(b.area);
  const hasSimilarArea =
    areaA.length >= 3 &&
    areaB.length >= 3 &&
    (areaA.includes(areaB) || areaB.includes(areaA));
  const hasSimilarName =
    Math.min(nameA.length, nameB.length) >= 6 &&
    (nameA.includes(nameB) || nameB.includes(nameA));

  return hasSimilarName && hasSimilarArea;
}

function compareOfferPrice(a: HotelOffer, b: HotelOffer): number {
  const priceA = isValidPrice(a.price) ? a.price : null;
  const priceB = isValidPrice(b.price) ? b.price : null;

  if (priceA === null && priceB === null) return 0;
  if (priceA === null) return 1;
  if (priceB === null) return -1;
  return priceA - priceB;
}

function mergeOffers(...offerGroups: HotelOffer[][]): HotelOffer[] {
  const cheapestBySite = new Map<string, HotelOffer>();

  for (const offer of offerGroups.flat()) {
    const existing = cheapestBySite.get(offer.site);
    if (!existing || compareOfferPrice(offer, existing) < 0) {
      cheapestBySite.set(offer.site, offer);
    }
  }

  return sortOffersByPrice([...cheapestBySite.values()]);
}

function informationScore(hotel: Hotel): number {
  return (
    hotel.name.trim().length +
    hotel.area.trim().length +
    (hotel.imageUrl?.trim() ? 20 : 0) +
    ((hotel.rating ?? 0) > 0 ? 5 : 0)
  );
}

function mergeHotelPair(current: Hotel, incoming: Hotel): Hotel {
  const richer = informationScore(incoming) > informationScore(current) ? incoming : current;
  const currentRating = current.rating ?? null;
  const incomingRating = incoming.rating ?? null;
  const rating =
    currentRating === null && incomingRating === null
      ? null
      : Math.max(currentRating ?? 0, incomingRating ?? 0);

  return {
    ...current,
    name: richer.name,
    area:
      incoming.area.trim().length > current.area.trim().length
        ? incoming.area
        : current.area,
    imageUrl: richer.imageUrl?.trim()
      ? richer.imageUrl
      : current.imageUrl || incoming.imageUrl,
    rating,
    hotelClass: current.hotelClass ?? incoming.hotelClass ?? null,
    amenities: [...new Set([...(current.amenities ?? []), ...(incoming.amenities ?? [])])],
    amenityText: [current.amenityText, incoming.amenityText].filter(Boolean).join(" "),
    access: current.access || incoming.access,
    description: current.description || incoming.description,
    sourceFields: {
      ...current.sourceFields,
      ...incoming.sourceFields,
      amenities: [
        ...(current.sourceFields?.amenities ?? []),
        ...(incoming.sourceFields?.amenities ?? []),
      ],
    },
    providerIds: {
      ...current.providerIds,
      ...incoming.providerIds,
    },
    offers: mergeOffers(current.offers, incoming.offers),
  };
}

/**
 * Provider横断で同一と思われるホテルをまとめる。
 *
 * Example:
 * - 同じ正規化名の2件は1件になり、両方のoffersを持つ。
 * - 異なる名前のホテルは別々に残る。
 * - 同じsiteのofferは、0円を未定扱いとして最も安い料金だけ残る。
 *
 * TODO: 緯度経度、より厳密な住所正規化、類似度スコア、手動統合ルールを追加する。
 */
export function mergeHotelsByIdentity(hotels: Hotel[]): Hotel[] {
  const merged: Hotel[] = [];

  for (const hotel of hotels) {
    const sameHotelIndex = merged.findIndex((candidate) =>
      isSameHotel(candidate, hotel),
    );
    if (sameHotelIndex === -1) {
      merged.push({ ...hotel, offers: mergeOffers(hotel.offers) });
      continue;
    }
    merged[sameHotelIndex] = mergeHotelPair(merged[sameHotelIndex], hotel);
  }

  return merged;
}
