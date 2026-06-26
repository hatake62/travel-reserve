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

  return (
    <nav
      aria-label="ホテル検索結果のページ移動"
      className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm font-medium text-slate-600">
        {first}〜{last}件目を表示 / 全{pagination.total}件
      </p>
      <div className="flex items-center gap-3">
        <button
          className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          disabled={!pagination.hasPrev || isLoading}
          onClick={() => onPageChange(pagination.page - 1)}
          type="button"
        >
          前へ
        </button>
        <span aria-live="polite" className="min-w-24 text-center text-sm font-bold text-slate-700">
          {pagination.page} / {pagination.totalPages} ページ
        </span>
        <button
          className="min-h-11 rounded-lg border border-sky-700 bg-sky-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300"
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
