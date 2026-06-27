type LoadingStateProps = {
  message?: string;
};

export default function LoadingState({
  message = "ホテル情報を検索中...",
}: LoadingStateProps) {
  return (
    <div
      aria-live="polite"
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      role="status"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="size-10 animate-spin rounded-full border-4 border-slate-200 border-t-sky-700" />
        <div>
          <p className="text-lg font-bold text-slate-800">{message}</p>
          <p className="mt-1 text-sm text-slate-500">
            条件に合う宿泊先と料金を確認しています。
          </p>
        </div>
      </div>
      <div className="grid gap-4">
        {[0, 1, 2].map((item) => (
          <div className="grid gap-4 rounded-2xl border border-slate-200 p-3 md:grid-cols-[180px_minmax(0,1fr)]" key={item}>
            <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
            <div className="space-y-3 p-2">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
              <div className="h-6 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
