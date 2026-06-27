export type HotelOffer = {
  site: string;
  price?: number | null;
  bookingUrl: string;
  planListUrl?: string;
  reserveUrl?: string;
  isDateSpecific?: boolean;
  priceLabel?: string;
  sourcePriceField?: string;
  checkInDate?: string;
  checkOutDate?: string;
  adults?: number;
  planName?: string;
  roomName?: string;
  matchedPlanCount?: number;
  notFoundReason?: string;
  roomType: string;
  hasBreakfast: boolean;
  cancellation: string;
};

export type Hotel = {
  id: string | number;
  providerIds?: {
    rakuten?: string;
    jalan?: string;
  };
  name: string;
  area: string;
  rating?: number | null;
  reviewCount?: number | null;
  hotelClass?: number | null;
  amenities?: string[];
  amenityText?: string;
  access?: string;
  description?: string;
  sourceFields?: {
    rating?: string;
    hotelClass?: string;
    amenities?: string[];
  };
  imageUrl?: string | null;
  offers: HotelOffer[];
};
