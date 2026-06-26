export type BookingLinkStatus = "available" | "not_found" | "error";
export type BookingUrlType =
  | "reserveUrl"
  | "planListUrlWithDate"
  | "hotelInformationUrlWithDate"
  | "fallbackWithDate"
  | "fallbackWithoutDate"
  | "none";

export type BookingLink = {
  label: string;
  url: string;
  price: number | null;
  sourcePriceField?: string;
  roomName?: string;
  planName?: string;
};

export type BookingLinksResponse = {
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  status: BookingLinkStatus;
  bestUrl: string;
  urlType: BookingUrlType;
  dateParamsApplied: boolean;
  planListUrl: string;
  bestReserveUrl: string;
  fallbackUrl: string;
  links: BookingLink[];
  price?: number | null;
  sourcePriceField?: string;
  matchedPlanCount?: number;
  hotelNo?: string;
  rawPlanCount?: number;
  hasReserveUrl?: boolean;
  hasPlanListUrl?: boolean;
  hasHotelInformationUrl?: boolean;
  warnings: string[];
};
