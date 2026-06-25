export type BookingLinkStatus = "available" | "not_found" | "error";

export type BookingLink = {
  label: string;
  url: string;
  price: number | null;
  roomName?: string;
  planName?: string;
};

export type BookingLinksResponse = {
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  status: BookingLinkStatus;
  planListUrl: string;
  bestReserveUrl: string;
  fallbackUrl: string;
  links: BookingLink[];
  warnings: string[];
};
