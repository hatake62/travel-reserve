export type SortBy = "recommended" | "priceAsc" | "priceDesc" | "ratingDesc";

export type BookingSite =
  | ""
  | "楽天トラベル"
  | "じゃらん"
  | "Yahoo!トラベル"
  | "一休.com";

export type SearchCondition = {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  sortBy: SortBy;
  maxPrice: number | null;
  site: BookingSite;
  breakfastOnly: boolean;
};
