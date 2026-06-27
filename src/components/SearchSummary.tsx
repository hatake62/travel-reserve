import type { HotelSearchPagination } from "@/lib/hotelApi";
import type { SearchCondition } from "@/types/search";

type SearchSummaryProps = {
  condition: SearchCondition;
  displayedCount: number;
  pagination: HotelSearchPagination | null;
  warning?: string | null;
};

function getNights(checkIn: string, checkOut: string): number | null {
  if (!checkIn || !checkOut) return null;
  const start = new Date(`${checkIn}T00:00:00Z`).getTime();
  const end = new Date(`${checkOut}T00:00:00Z`).getTime();
  const nights = Math.round((end - start) / 86400000);
  return Number.isFinite(nights) && nights > 0 ? nights : null;
}

export default function SearchSummary({
  condition,
  displayedCount,
  pagination,
  warning,
}: SearchSummaryProps) {
  const destination = condition.destination.trim() || "条件に合う";
  const nights = getNights(condition.checkIn, condition.checkOut);
  const total = pagination?.total ?? displayedCount;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-sky-700">検索結果</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950" id="hotel-list-heading">
            {destination}のホテル {total}件
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {condition.checkIn && condition.checkOut
              ? `${condition.checkIn}から${nights ?? 1}泊・大人${condition.guests}名`
              : `大人${condition.guests}名・日付未指定`}
          </p>
        </div>
        <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700" aria-live="polite">
          {pagination
            ? `${(pagination.page - 1) * pagination.limit + 1}〜${Math.min(
                pagination.total,
                pagination.page * pagination.limit,
              )}件目`
            : `${displayedCount}件表示`}
        </p>
      </div>
      {warning && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {warning}
        </p>
      )}
      <p className="mt-3 text-xs leading-5 text-slate-500">
        一部ホテルの指定日価格は未取得の場合があります。実際の料金・空室は楽天トラベルで確認してください。
      </p>
    </div>
  );
}
