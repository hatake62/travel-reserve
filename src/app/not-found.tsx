import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-16 text-slate-900">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
        <p className="text-sm font-bold text-sky-700">404 Not Found</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          ページが見つかりません
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          指定されたホテル情報は存在しないか、削除された可能性があります。
        </p>
        <Link
          className="mt-7 inline-flex h-11 items-center justify-center rounded-lg bg-sky-700 px-5 text-sm font-bold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
          href="/"
        >
          トップページへ戻る
        </Link>
      </div>
    </main>
  );
}
