import type { HotelOffer } from "@/types/hotel";

export const yenFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export function isValidPrice(price?: number | null): price is number {
  return typeof price === "number" && Number.isFinite(price) && price >= 1;
}

export function formatPrice(price?: number | null): string {
  return isValidPrice(price) ? yenFormatter.format(price) : "価格未定";
}

export function getLowestValidOffer(offers: HotelOffer[]): HotelOffer | null {
  return sortOffersByPrice(offers).find((offer) => isValidPrice(offer.price)) ?? null;
}

export function getLowestValidPrice(offers: HotelOffer[]): number | undefined {
  const price = getLowestValidOffer(offers)?.price;
  return isValidPrice(price) ? price : undefined;
}

export function sortOffersByPrice(offers: HotelOffer[]): HotelOffer[] {
  return [...offers].sort((a, b) => {
    const priceA = isValidPrice(a.price) ? a.price : null;
    const priceB = isValidPrice(b.price) ? b.price : null;

    if (priceA === null && priceB === null) return 0;
    if (priceA === null) return 1;
    if (priceB === null) return -1;
    return priceA - priceB;
  });
}
