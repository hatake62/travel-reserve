type LoadingStateProps = {
  message?: string;
};

export default function LoadingState({
  message = "ホテル情報を検索中...",
}: LoadingStateProps) {
  return (
    <div
      aria-live="polite"
      className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm"
      role="status"
    >
      <div className="mx-auto size-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-700" />
      <p className="mt-5 text-lg font-bold text-slate-800">{message}</p>
      <p className="mt-2 text-sm text-slate-500">
        条件に合う宿泊先と料金を確認しています。
      </p>
    </div>
  );
}
