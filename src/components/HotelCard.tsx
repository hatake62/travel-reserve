"use client";

import FavoriteButton from "@/components/FavoriteButton";
import HotelImage from "@/components/HotelImage";
import RakutenBookingButton from "@/components/RakutenBookingButton";
import { AMENITY_OPTIONS } from "@/lib/searchParams";
import {
  formatPrice,
  getLowestValidOffer,
  sortOffersByPrice,
} from "@/lib/price";
import type { Hotel } from "@/types/hotel";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type HotelCardProps = {
  hotel: Hotel;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
};

const amenityLabels = new Map<string, string>(
  AMENITY_OPTIONS.map((option) => [option.value, option.label]),
);

function getAmenityTags(hotel: Hotel): string[] {
  const explicit = (hotel.amenities ?? [])
    .map((amenity) => amenityLabels.get(amenity) ?? amenity)
    .filter(Boolean);
  if (explicit.length > 0) return explicit;

  const text = hotel.amenityText ?? "";
  return [
    ["温泉", /温泉/],
    ["大浴場", /大浴場/],
    ["駐車場", /駐車場|パーキング/],
    ["Wi-Fi無料", /Wi-?Fi|wifi|インターネット|LAN/i],
    ["禁煙ルーム", /禁煙/],
    ["駅近", /駅|徒歩/],
  ]
    .filter(([, pattern]) => (pattern as RegExp).test(text))
    .map(([label]) => label as string);
}

export default function HotelCard({ hotel, checkIn, checkOut, adults }: HotelCardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sortedOffers = sortOffersByPrice(hotel.offers);
  const lowestOffer = getLowestValidOffer(sortedOffers);
  const primaryOffer = lowestOffer ?? sortedOffers[0];
  const hasDateCondition = Boolean(checkIn && checkOut && adults);
  const priceLabel =
    primaryOffer?.priceLabel ??
    (primaryOffer?.isDateSpecific ? "指定日の最安値" : "参考最安値");
  const noPriceMessage = primaryOffer?.isDateSpecific
    ? "指定条件の料金は取得できませんでした"
    : "実際の料金は楽天トラベルで確認";
  const currentQuery = searchParams.toString();
  const returnTo = `${pathname}${currentQuery ? `?${currentQuery}` : ""}`;
  const detailHref = `/hotels/${hotel.id}?returnTo=${encodeURIComponent(returnTo)}`;
  const amenityTags = getAmenityTags(hotel);
  const visibleTags = amenityTags.slice(0, 4);
  const hiddenTagCount = Math.max(0, amenityTags.length - visibleTags.length);
  const description =
    hotel.description ||
    "ホテル情報と参考価格を確認できます。気になるホテルはお気に入りに追加して、宿泊日の価格推移を追跡できます。";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="grid min-w-0 md:grid-cols-[240px_minmax(0,1fr)]">
        <HotelImage
          alt={`${hotel.name}のイメージ`}
          className="h-52 md:h-full md:min-h-[170px]"
          src={hotel.imageUrl}
        />

        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_190px]">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="line-clamp-2 text-xl font-bold leading-tight text-slate-950">
                  {hotel.name}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  {typeof hotel.rating === "number" && Number.isFinite(hotel.rating) ? (
                    <span className="font-semibold text-slate-900">
                      評価 {hotel.rating.toFixed(1)}
                    </span>
                  ) : (
                    <span>評価未取得</span>
                  )}
                  {typeof hotel.reviewCount === "number" && hotel.reviewCount > 0 && (
                    <span>{hotel.reviewCount.toLocaleString("ja-JP")}件のレビュー</span>
                  )}
                  {typeof hotel.hotelClass === "number" && Number.isFinite(hotel.hotelClass) && (
                    <span>{hotel.hotelClass}つ星</span>
                  )}
                </div>
                <p className="mt-2 line-clamp-1 text-sm font-medium text-slate-600">
                  {hotel.access || hotel.area}
                </p>
              </div>
              <FavoriteButton hotel={hotel} hotelId={String(hotel.id)} />
            </div>

            <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
              {description}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {visibleTags.map((tag) => (
                <span
                  className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
              {hiddenTagCount > 0 && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  +{hiddenTagCount}
                </span>
              )}
              {visibleTags.length === 0 && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  施設情報は楽天トラベルで確認
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-xs font-bold text-slate-500">{priceLabel}</p>
              {lowestOffer ? (
                <p className="mt-1">
                  <span className="text-2xl font-bold tracking-tight text-slate-950">
                    {formatPrice(lowestOffer.price)}
                  </span>
                  <span className="ml-1 text-sm text-slate-500">〜</span>
                </p>
              ) : (
                <div className="mt-2">
                  <p className="text-base font-bold text-slate-950">価格未定</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {noPriceMessage}
                  </p>
                </div>
              )}
              <p className="mt-2 text-xs leading-5 text-slate-500">
                実際の料金は楽天トラベルで確認
              </p>
              {hasDateCondition && (
                <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                  {checkIn}泊 / 大人{adults}名
                </p>
              )}
            </div>

            <div className="mt-4 grid gap-2">
              <Link
                className="inline-flex h-10 items-center justify-center rounded-xl border border-blue-600 bg-white px-3 text-sm font-bold text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
                href={detailHref}
              >
                詳細を見る
              </Link>
              {primaryOffer?.site === "楽天トラベル" ? (
                <RakutenBookingButton
                  adults={adults}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  fallbackUrl={primaryOffer.bookingUrl.trim()}
                  hotelId={hotel.id}
                />
              ) : primaryOffer?.bookingUrl.trim() ? (
                <a
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-3 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  href={primaryOffer.bookingUrl.trim()}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  予約サイトで見る
                </a>
              ) : (
                <span className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-200 px-3 text-sm font-bold text-slate-500">
                  楽天トラベルで見る
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
