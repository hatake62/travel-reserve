export type HotelOffer = {
  site: string;
  price: number;
  bookingUrl: string;
  roomType: string;
  hasBreakfast: boolean;
  cancellation: string;
};

export type Hotel = {
  id: number;
  name: string;
  area: string;
  rating: number;
  imageUrl: string;
  offers: HotelOffer[];
};
