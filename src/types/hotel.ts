export type HotelOffer = {
  site: string;
  price: number;
  bookingUrl: string;
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
  rating: number;
  imageUrl: string;
  offers: HotelOffer[];
};
