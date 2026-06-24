import type { Hotel } from "@/types/hotel";

type HotelCardProps = {
  hotel: Hotel;
};

const yenFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export default function HotelCard({ hotel }: HotelCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div
        aria-label={`${hotel.name}の客室イメージ`}
        className="h-48 bg-slate-200 bg-cover bg-center"
        role="img"
        style={{ backgroundImage: `url(${hotel.imageUrl})` }}
      />

      <div className="flex h-[calc(100%-12rem)] flex-col p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-medium text-sky-700">{hotel.area}</p>
            <h2 className="text-xl font-bold text-slate-900">{hotel.name}</h2>
          </div>
          <span className="shrink-0 rounded-md bg-amber-50 px-2.5 py-1 text-sm font-bold text-amber-700">
            ★ {hotel.rating.toFixed(1)}
          </span>
        </div>

        <div className="mt-auto border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">{hotel.site}</p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <p>
              <span className="text-2xl font-bold text-slate-900">
                {yenFormatter.format(hotel.price)}
              </span>
              <span className="ml-1 text-sm text-slate-500">〜 / 1泊</span>
            </p>
            <a
              className="shrink-0 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200"
              href={hotel.bookingUrl}
              rel="noreferrer"
              target="_blank"
            >
              予約サイトへ
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
