import type { HotelSearchParams } from "@/types/search";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function validateHotelSearch({
  checkIn,
  checkOut,
  guests,
}: HotelSearchParams): string | null {
  if (!Number.isInteger(guests) || (guests ?? 0) < 1) {
    return "人数は1名以上にしてください";
  }
  if (!checkIn && !checkOut) return null;
  if (!checkIn) return "チェックイン日を入力してください";
  if (!checkOut) return "チェックアウト日を入力してください";
  if (!isValidDate(checkIn) || !isValidDate(checkOut)) {
    return "検索条件を確認してください";
  }
  if (checkOut <= checkIn) {
    return "チェックアウト日はチェックイン日より後にしてください";
  }
  return null;
}
