type ErrorMessageProps = {
  title?: string;
  message: string;
  hint?: string;
  onRetry?: () => void;
};

export default function ErrorMessage({
  title = "ホテル情報を取得できませんでした",
  message,
  hint,
  onRetry,
}: ErrorMessageProps) {
  return (
    <div
      className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center shadow-sm"
      role="alert"
    >
      <p className="text-sm font-bold text-rose-700">{title}</p>
      <p className="mt-2 text-lg font-bold text-rose-950">{message}</p>
      {hint && <p className="mt-3 text-sm leading-6 text-rose-700">{hint}</p>}
      {onRetry && (
        <button
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-rose-700 px-5 text-sm font-bold text-white transition hover:bg-rose-800 focus:outline-none focus:ring-4 focus:ring-rose-200"
          onClick={onRetry}
          type="button"
        >
          再試行
        </button>
      )}
    </div>
  );
}
