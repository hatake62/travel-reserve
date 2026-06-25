type EmptyStateProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({
  title = "条件に一致するホテルが見つかりませんでした",
  message = "目的地や日付、人数の条件を変更して再検索してください。",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm"
      role="status"
    >
      <p className="text-lg font-bold text-slate-900">{title}</p>
      <p className="mt-3 text-sm leading-6 text-slate-500">{message}</p>
      {actionLabel && onAction && (
        <button
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg border border-sky-700 bg-white px-5 text-sm font-bold text-sky-700 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-200"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
