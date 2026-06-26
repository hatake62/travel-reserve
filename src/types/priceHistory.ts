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
  sourcePriceField?: string;
  matchedPlanCount?: number;
  rawPlanCount?: number;
  extractedPriceCount?: number;
  searchPatternsTried?: string[];
  pagesFetched?: number;
  planName?: string;
  roomName?: string;
  status?: "available" | "not_found";
  warnings?: string[];
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
  updatedAt?: string;
};

export type PriceCaptureLog = {
  id?: string;
  startedAt: string;
  finishedAt?: string;
  targetCount: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  message?: string;
};

export type PriceCaptureLogItemStatus = "success" | "failure" | "skipped";

export type PriceCaptureLogItem = PriceHistoryParams & {
  id?: string;
  captureLogId: string;
  targetId?: string;
  provider: PriceSnapshotProvider;
  status: PriceCaptureLogItemStatus;
  message?: string;
};
