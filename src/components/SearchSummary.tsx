import type { HotelSearchPagination } from "@/lib/hotelApi";
import type { SearchCondition, SortBy } from "@/types/search";

type SearchSummaryProps = {
  condition: SearchCondition;
  displayedCount: number;
  pagination: HotelSearchPagination | null;
  warning?: string | null;
  sortBy?: SortBy;
  onSortChange?: (sortBy: SortBy) => void;
};

export default function SearchSummary({
  condition,
  displayedCount,
  pagination,
  warning,
  sortBy = "recommended",
  onSortChange,
}: SearchSummaryProps) {
  const destination = condition.destination.trim() || "条件に合う";
  const total = pagination?.total ?? displayedCount;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">検索結果: {total}件</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950" id="hotel-list-heading">
            {destination}のホテル {total}件
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            参考最安値を表示しています。指定日の価格推移はお気に入り追加後に確認できます。
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <label className="text-xs font-semibold text-slate-500" htmlFor="sortBy">
            並び替え
          </label>
          <select
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            id="sortBy"
            onChange={(event) => onSortChange?.(event.target.value as SortBy)}
            value={sortBy}
          >
            <option value="recommended">おすすめ順</option>
            <option value="priceAsc">参考価格が安い順</option>
            <option value="priceDesc">参考価格が高い順</option>
            <option value="ratingDesc">評価が高い順</option>
          </select>
          <p className="text-xs font-semibold text-slate-500" aria-live="polite">
            {pagination
              ? `${(pagination.page - 1) * pagination.limit + 1}〜${Math.min(
                  pagination.total,
                  pagination.page * pagination.limit,
                )}件目`
              : `${displayedCount}件表示`}
          </p>
        </div>
      </div>
      {warning && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {warning}
        </p>
      )}
    </div>
  );
}
