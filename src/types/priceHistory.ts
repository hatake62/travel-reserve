export type PriceSnapshotProvider = "rakuten";

export type PriceSnapshot = {
  id?: string;
  hotelId: string;
  provider: PriceSnapshotProvider;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  price: number | null;
  bookingUrl?: string;
  capturedAt: string;
};

export type PriceHistoryPoint = {
  capturedDate: string;
  price: number | null;
  provider: string;
};

export type PriceHistoryResponse = {
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  points: PriceHistoryPoint[];
  warnings: string[];
};

export type PriceHistoryParams = {
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
};

export type PriceWatchTarget = PriceHistoryParams & {
  id?: string;
  provider: PriceSnapshotProvider;
  enabled: boolean;
  createdAt?: string;
};
