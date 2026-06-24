import HotelCard from "@/components/HotelCard";
import SearchForm from "@/components/SearchForm";
import { hotels } from "@/data/hotels";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <header className="mb-9 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
            Hotel Price Comparison
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            ぴったりのホテルを、もっと手軽に。
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            目的地と宿泊日を入力して、条件に合うホテルの価格をすばやく比較できます。
          </p>
        </header>

        <SearchForm />

        <section className="mt-12" aria-labelledby="hotel-list-heading">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-sky-700">おすすめの宿泊先</p>
              <h2
                className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
                id="hotel-list-heading"
              >
                ホテルを比較する
              </h2>
            </div>
            <p className="text-sm text-slate-500">{hotels.length}件のホテル</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {hotels.map((hotel) => (
              <HotelCard hotel={hotel} key={hotel.id} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
