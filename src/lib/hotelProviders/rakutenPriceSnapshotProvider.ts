import "server-only";

import type { PriceSnapshot } from "@/types/priceHistory";
import { fetchRakutenDateSpecificLowestPrice } from "./rakutenDateSpecificPriceProvider";

type FetchRakutenPriceSnapshotParams = {
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
};

export async function fetchRakutenPriceSnapshot({
  hotelId,
  checkInDate,
  checkOutDate,
  adults,
}: FetchRakutenPriceSnapshotParams): Promise<PriceSnapshot> {
  const result = await fetchRakutenDateSpecificLowestPrice({
    hotelId,
    checkInDate,
    checkOutDate,
    adults,
  });

  return {
    hotelId,
    provider: "rakuten",
    checkInDate,
    checkOutDate,
    adults,
    price: result.price,
    bookingUrl: result.bookingUrl,
    capturedAt: new Date().toISOString(),
    sourcePriceField: result.sourcePriceField,
    matchedPlanCount: result.matchedPlanCount,
    planName: result.planName,
    roomName: result.roomName,
    status: result.status,
    warnings: result.warnings,
  };
}
