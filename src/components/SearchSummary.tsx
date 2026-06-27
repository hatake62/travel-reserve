import type { HotelSearchPagination } from "@/lib/hotelApi";
import type { SearchCondition } from "@/types/search";

type SearchSummaryProps = {
  condition: SearchCondition;
  displayedCount: number;
  pagination: HotelSearchPagination | null;
  warning?: string | null;
};

export default function SearchSummary({
  condition,
  displayedCount,
  pagination,
  warning,
}: SearchSummaryProps) {
  const destination = condition.destination.trim() || "条件に合う";
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
            トップ画面ではホテル候補を探します。宿泊日と人数は、詳細ページで価格追跡を開始するときに指定します。
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
