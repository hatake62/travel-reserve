export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <section className="mx-auto flex max-w-5xl flex-col gap-10">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
            Hotel Price Comparison
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            ホテル価格比較サイト
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            目的地と宿泊日を入力して、条件に合うホテルの価格をすばやく比較できます。
          </p>
        </div>

        <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            目的地
            <input
              className="h-12 rounded-md border border-slate-300 px-4 text-base text-slate-900 outline-none transition focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
              name="destination"
              placeholder="例: 東京"
              type="text"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            チェックイン日
            <input
              className="h-12 rounded-md border border-slate-300 px-4 text-base text-slate-900 outline-none transition focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
              name="checkIn"
              type="date"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            チェックアウト日
            <input
              className="h-12 rounded-md border border-slate-300 px-4 text-base text-slate-900 outline-none transition focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
              name="checkOut"
              type="date"
            />
          </label>

          <button
            className="h-12 rounded-md bg-sky-700 px-6 text-base font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
            type="submit"
          >
            検索
          </button>
        </form>
      </section>
    </main>
  );
}
