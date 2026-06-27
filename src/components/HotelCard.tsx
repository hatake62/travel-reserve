import type { Hotel } from "@/types/hotel";
import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import HotelImage from "@/components/HotelImage";
import RakutenBookingButton from "@/components/RakutenBookingButton";
import {
  formatPrice,
  getLowestValidOffer,
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
  const hasDateCondition = Boolean(checkIn && checkOut && adults);
  const priceLabel =
    primaryOffer?.priceLabel ??
    (primaryOffer?.isDateSpecific ? "指定日の最安値" : "参考最安値");
  const noPriceMessage = primaryOffer?.isDateSpecific
    ? primaryOffer.notFoundReason === "api_data_not_found"
      ? "指定条件の空室・料金が見つかりませんでした"
      : primaryOffer.notFoundReason === "api_rate_limited"
      ? "料金取得が混み合っています"
      : primaryOffer.notFoundReason === "no_daily_charge_in_response"
      ? "料金情報を取得できませんでした"
      : primaryOffer.notFoundReason === "invalid_hotel_id"
      ? "施設番号を取得できませんでした"
      : "指定日価格は未確認"
    : "価格は予約サイトで確認してください";
  const detailHref = `/hotels/${hotel.id}`;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
      <div className="grid min-w-0 md:grid-cols-[210px_minmax(0,1fr)]">
        <HotelImage
          alt={`${hotel.name}の客室イメージ`}
          className="h-56 md:h-full"
          src={hotel.imageUrl}
        />

        <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1fr)_210px]">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1 truncate text-sm font-semibold text-sky-700">{hotel.area}</p>
                <h2 className="line-clamp-2 text-xl font-bold leading-tight text-slate-950">
                {hotel.name}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                    評価 {hotel.rating.toFixed(1)}
                  </span>
                  {hasDateCondition && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      {checkIn}泊 / 大人{adults}名
                    </span>
                  )}
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    価格追跡対応
                  </span>
                </div>
              </div>
              <FavoriteButton hotel={hotel} hotelId={String(hotel.id)} />
            </div>

            <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
              予約サイトの掲載情報をもとに、料金と詳細ページを確認できます。気になるホテルはお気に入りに追加すると価格推移を追跡できます。
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {sortedOffers.slice(0, 3).map((offer) => (
                <span
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600"
                  key={`${offer.site}-${offer.roomType}`}
                >
                  {offer.site}
                </span>
              ))}
              {sortedOffers.some((offer) => offer.hasBreakfast) && (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                  朝食あり
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link
                className="inline-flex h-11 items-center justify-center rounded-xl border border-sky-700 px-4 text-sm font-bold text-sky-700 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-200"
                href={detailHref}
              >
                詳細を見る
              </Link>
              <Link
                className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-700 px-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                href={detailHref}
              >
                価格推移を見る
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 xl:self-start">
            <p className="text-xs font-bold text-slate-500">{priceLabel}</p>
            {lowestOffer ? (
              <p className="mt-1">
                <span className="text-3xl font-bold tracking-tight text-slate-950">
                  {formatPrice(lowestOffer.price)}
                </span>
                <span className="ml-1 text-sm text-slate-500">〜</span>
              </p>
            ) : (
              <div className="mt-2">
                <p className="text-lg font-bold text-slate-950">
                  {primaryOffer?.notFoundReason === "api_rate_limited"
                    ? "混み合っています"
                    : "楽天トラベルで確認"}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  {noPriceMessage}
                </p>
              </div>
            )}
            {hasDateCondition && !lowestOffer && (
              <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600">
                指定日価格は未確認。候補からは除外していません。
              </p>
            )}
            {sortedOffers.length > 0 ? (
              <div className="mt-4">
                {sortedOffers.slice(0, 1).map((offer) => (
                  <div key={`${offer.site}-${offer.roomType}`}>
                    {(() => {
                      const bookingUrl = offer.bookingUrl.trim();
                      return (
                        <>
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
                            className="inline-flex w-full justify-center rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200"
                            href={bookingUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            予約サイトで確認
                          </a>
                        ) : (
                          <span className="inline-flex w-full justify-center rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-500">
                            予約サイトで確認
                          </span>
                        )}
                        </>
                      );
                    })()}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-500">
                現在、掲載中の料金はありません。
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
