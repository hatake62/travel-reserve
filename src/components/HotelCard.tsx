import type { Hotel } from "@/types/hotel";
import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import HotelImage from "@/components/HotelImage";
import RakutenBookingButton from "@/components/RakutenBookingButton";
import {
  formatPrice,
  getLowestValidOffer,
  isValidPrice,
  sortOffersByPrice,
} from "@/lib/price";

type HotelCardProps = {
  hotel: Hotel;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
};

export default function HotelCard({ hotel, checkIn, checkOut, adults }: HotelCardProps) {
  const sortedOffers = sortOffersByPrice(hotel.offers);
  const lowestOffer = getLowestValidOffer(sortedOffers);
  const primaryOffer = lowestOffer ?? sortedOffers[0];
  const priceLabel =
    primaryOffer?.priceLabel ??
    (primaryOffer?.isDateSpecific ? "指定日の最安値" : "参考最安値");

  return (
    <article className="flex h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex min-w-0 flex-1 flex-col">
        <HotelImage alt={`${hotel.name}の客室イメージ`} src={hotel.imageUrl} />

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-1 text-sm font-medium text-sky-700">{hotel.area}</p>
              <h2 className="line-clamp-2 text-xl font-bold text-slate-900">
                {hotel.name}
              </h2>
              <div className="mt-3">
                <FavoriteButton hotelId={String(hotel.id)} />
              </div>
            </div>
            <span className="shrink-0 rounded-md bg-amber-50 px-2.5 py-1 text-sm font-bold text-amber-700">
              ★ {hotel.rating.toFixed(1)}
            </span>
          </div>

          <div className="mb-5 rounded-xl bg-sky-50 p-4 ring-1 ring-inset ring-sky-100">
            <p className="text-xs font-bold text-sky-700">{priceLabel}</p>
            <p className="mt-1">
              <span className="text-3xl font-bold tracking-tight text-slate-950">
                {lowestOffer ? formatPrice(lowestOffer.price) : "予約サイトで確認"}
              </span>
              {lowestOffer && (
                <span className="ml-1 text-sm text-slate-500">〜 / 1泊</span>
              )}
            </p>
            {!lowestOffer && (
              <p className="mt-1 text-xs font-medium text-slate-500">
                {primaryOffer?.isDateSpecific
                  ? primaryOffer.notFoundReason === "api_data_not_found"
                    ? "指定条件の空室・料金が見つかりませんでした。"
                    : primaryOffer.notFoundReason === "no_daily_charge_in_response"
                    ? "料金情報を取得できませんでした。楽天トラベルで確認してください。"
                    : primaryOffer.notFoundReason === "invalid_hotel_id"
                    ? "施設番号を取得できませんでした。"
                    : primaryOffer.notFoundReason === "api_http_error" || primaryOffer.notFoundReason === "api_rate_limited"
                    ? "料金取得に失敗しました。時間をおいて再試行してください。"
                    : "指定条件の料金は取得できませんでした。"
                  : "価格は予約サイトで確認してください。"}
              </p>
            )}
          </div>

          <Link
            className="mb-5 inline-flex w-full items-center justify-center rounded-xl border border-sky-700 px-4 py-3 text-sm font-bold text-sky-700 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-200"
            href={`/hotels/${hotel.id}`}
          >
            詳細を見る
          </Link>

          <div className="mt-auto">
            <h3 className="mb-3 text-sm font-bold text-slate-800">予約サイト料金比較</h3>
            {sortedOffers.length > 0 ? (
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                {sortedOffers.map((offer) => (
                  <li className="p-3" key={`${offer.site}-${offer.roomType}`}>
                    {(() => {
                      const bookingUrl = offer.bookingUrl.trim();
                      return (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-900">{offer.site}</p>
                          {offer.priceLabel && (
                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700">
                              {offer.priceLabel}
                            </span>
                          )}
                          {lowestOffer === offer && isValidPrice(offer.price) && (
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
                          {formatPrice(offer.price)}
                        </p>
                        {offer.site === "楽天トラベル" ? (
                          <RakutenBookingButton
                            adults={adults}
                            checkIn={checkIn}
                            checkOut={checkOut}
                            fallbackUrl={bookingUrl}
                            hotelId={hotel.id}
                          />
                        ) : bookingUrl ? (
                          <a
                            aria-label={`${offer.site}で${hotel.name}を予約する`}
                            className="mt-2 inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200"
                            href={bookingUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            予約サイトへ
                          </a>
                        ) : (
                          <span className="mt-2 inline-flex rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
                            予約サイトで確認
                          </span>
                        )}
                      </div>
                    </div>
                      );
                    })()}
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
      </div>
    </article>
  );
}
