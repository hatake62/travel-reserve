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
  const sortedOffers = [...hotel.offers].sort((a, b) => a.price - b.price);
  const lowestPrice = sortedOffers[0]?.price;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
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

        <div className="mb-5 rounded-xl bg-sky-50 p-4 ring-1 ring-inset ring-sky-100">
          <p className="text-xs font-bold text-sky-700">このホテルの最安値</p>
          <p className="mt-1">
            <span className="text-3xl font-bold tracking-tight text-slate-950">
              {lowestPrice === undefined ? "料金未定" : yenFormatter.format(lowestPrice)}
            </span>
            {lowestPrice !== undefined && (
              <span className="ml-1 text-sm text-slate-500">〜 / 1泊</span>
            )}
          </p>
        </div>

        <div className="mt-auto">
          <h3 className="mb-3 text-sm font-bold text-slate-800">予約サイト料金比較</h3>
          {sortedOffers.length > 0 ? (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
              {sortedOffers.map((offer, index) => (
                <li className="p-3" key={`${offer.site}-${offer.roomType}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-900">{offer.site}</p>
                        {index === 0 && (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                            最安値
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-600">
                        {offer.roomType}・{offer.hasBreakfast ? "朝食付き" : "食事なし"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {offer.cancellation}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-bold text-slate-950">
                        {yenFormatter.format(offer.price)}
                      </p>
                      <a
                        aria-label={`${offer.site}で${hotel.name}を予約する`}
                        className="mt-2 inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200"
                        href={offer.bookingUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        予約サイトへ
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              現在、掲載中の料金はありません。
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
