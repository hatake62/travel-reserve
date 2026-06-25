"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-16 text-slate-900">
      <div
        className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 px-6 py-14 text-center shadow-sm"
        role="alert"
      >
        <p className="text-sm font-bold text-rose-700">Unexpected Error</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-rose-950">
          予期しないエラーが発生しました
        </h1>
        <p className="mt-4 text-sm leading-6 text-rose-700">
          {error.message || "時間をおいて、もう一度お試しください。"}
        </p>
        <button
          className="mt-7 inline-flex h-11 items-center justify-center rounded-lg bg-rose-700 px-5 text-sm font-bold text-white transition hover:bg-rose-800 focus:outline-none focus:ring-4 focus:ring-rose-200"
          onClick={reset}
          type="button"
        >
          再試行
        </button>
      </div>
    </main>
  );
}
