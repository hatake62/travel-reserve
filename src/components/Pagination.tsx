import type { HotelSearchPagination } from "@/lib/hotelApi";

type PaginationProps = {
  pagination: HotelSearchPagination;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
};

export default function Pagination({
  pagination,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  if (pagination.totalPages <= 1) return null;

  const first = (pagination.page - 1) * pagination.limit + 1;
  const last = Math.min(pagination.total, pagination.page * pagination.limit);
  const pages = Array.from(
    { length: Math.min(5, pagination.totalPages) },
    (_, index) => {
      const start = Math.min(
        Math.max(1, pagination.page - 2),
        Math.max(1, pagination.totalPages - 4),
      );
      return start + index;
    },
  );

  return (
    <nav
      aria-label="ホテル検索結果のページ移動"
      className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm font-medium text-slate-600">
        {first}〜{last}件目を表示 / 全{pagination.total}件
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
          disabled={!pagination.hasPrev || isLoading}
          onClick={() => onPageChange(pagination.page - 1)}
          type="button"
        >
          前へ
        </button>
        {pages[0] > 1 && (
          <span className="px-1 text-sm font-bold text-slate-400">...</span>
        )}
        {pages.map((page) => (
          <button
            aria-current={page === pagination.page ? "page" : undefined}
            className={`flex size-11 items-center justify-center rounded-xl border text-sm font-bold transition ${
              page === pagination.page
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            disabled={isLoading}
            key={page}
            onClick={() => onPageChange(page)}
            type="button"
          >
            {page}
          </button>
        ))}
        {pages[pages.length - 1] < pagination.totalPages && (
          <span className="px-1 text-sm font-bold text-slate-400">...</span>
        )}
        <button
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
          disabled={!pagination.hasNext || isLoading}
          onClick={() => onPageChange(pagination.page + 1)}
          type="button"
        >
          次へ
        </button>
      </div>
    </nav>
  );
}
