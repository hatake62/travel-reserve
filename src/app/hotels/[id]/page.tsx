"use client";

import ErrorMessage from "@/components/ErrorMessage";
import FavoriteButton from "@/components/FavoriteButton";
import HotelImage from "@/components/HotelImage";
import LoadingState from "@/components/LoadingState";
import { fetchHotelById, HotelApiError } from "@/lib/hotelApi";
import {
  formatPrice,
  getLowestValidOffer,
  isValidPrice,
  sortOffersByPrice,
} from "@/lib/price";
import type { Hotel } from "@/types/hotel";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";

type HotelDetailPageProps = {
  params: Promise<{ id: string }>;
};

type PageError = {
  message: string;
  hint?: string;
  isNotFound?: boolean;
};

export default function HotelDetailPage({
  params,
}: HotelDetailPageProps) {
  const { id } = use(params);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PageError | null>(null);

  const loadHotel = useCallback((resetState = true) => {
    let isActive = true;

    if (resetState) {
      setIsLoading(true);
      setError(null);
    }
    fetchHotelById(id)
      .then((data) => {
        if (isActive) setHotel(data);
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        const isNotFound = error instanceof HotelApiError && error.status === 404;
        setError({
          message: isNotFound
            ? "ホテルが見つかりませんでした"
            : error instanceof Error
            ? error.message
            : "ホテル情報の取得に失敗しました",
          hint: error instanceof HotelApiError ? error.hint : undefined,
          isNotFound,
        });
        setHotel(null);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [id]);

  useEffect(() => {
    let isActive = true;

    fetchHotelById(id)
      .then((data) => {
        if (isActive) setHotel(data);
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        const isNotFound = error instanceof HotelApiError && error.status === 404;
        setError({
          message: isNotFound
            ? "ホテルが見つかりませんでした"
            : error instanceof Error
            ? error.message
            : "ホテル情報の取得に失敗しました",
          hint: error instanceof HotelApiError ? error.hint : undefined,
          isNotFound,
        });
        setHotel(null);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <StatusShell>
        <LoadingState message="ホテル情報を読み込んでいます..." />
      </StatusShell>
    );
  }

  if (error?.isNotFound) {
    return <DetailNotFound />;
  }

  if (error) {
    return (
      <StatusShell>
        <ErrorMessage
          hint={error.hint}
          message={error.message}
          onRetry={() => {
            loadHotel();
          }}
        />
      </StatusShell>
    );
  }

  if (!hotel) {
    return <DetailNotFound />;
  }

  const sortedOffers = sortOffersByPrice(hotel.offers);
  const lowestOffer = getLowestValidOffer(sortedOffers);

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-sky-700 transition hover:text-sky-900 focus:outline-none focus:ring-4 focus:ring-sky-200"
          href="/"
        >
          <span aria-hidden="true">←</span>
          ホテル一覧へ戻る
        </Link>

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <HotelImage
            alt={`${hotel.name}の客室イメージ`}
            src={hotel.imageUrl}
            variant="detail"
          />

          <div className="p-6 sm:p-9">
            <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-sky-700">{hotel.area}</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  {hotel.name}
                </h1>
                <div className="mt-4">
                  <FavoriteButton hotelId={String(hotel.id)} />
                </div>
              </div>
              <span className="w-fit shrink-0 rounded-lg bg-amber-50 px-3 py-2 font-bold text-amber-700">
                ★ {hotel.rating.toFixed(1)}
              </span>
            </header>

            <section
              aria-labelledby="lowest-price-heading"
              className="mt-8 rounded-2xl bg-sky-50 p-5 ring-1 ring-inset ring-sky-100 sm:p-6"
            >
              <h2
                className="text-sm font-bold text-sky-700"
                id="lowest-price-heading"
              >
                このホテルの最安値
              </h2>
              {lowestOffer ? (
                <p className="mt-1">
                  <span className="text-4xl font-bold tracking-tight text-slate-950">
                    {formatPrice(lowestOffer.price)}
                  </span>
                  <span className="ml-2 text-sm text-slate-500">〜 / 1泊</span>
                </p>
              ) : (
                <div className="mt-2">
                  <p className="text-2xl font-bold text-slate-700">
                    価格は予約サイトで確認
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    現在、有効な価格情報は取得できていません。
                  </p>
                </div>
              )}
            </section>

            <section className="mt-10" aria-labelledby="offer-heading">
              <div className="mb-5">
                <p className="text-sm font-semibold text-sky-700">料金を比較</p>
                <h2
                  className="mt-1 text-2xl font-bold tracking-tight"
                  id="offer-heading"
                >
                  予約サイトごとの料金一覧
                </h2>
              </div>

              {sortedOffers.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-5 py-4 font-bold" scope="col">予約サイト</th>
                        <th className="px-5 py-4 font-bold" scope="col">料金</th>
                        <th className="px-5 py-4 font-bold" scope="col">部屋タイプ</th>
                        <th className="px-5 py-4 font-bold" scope="col">朝食</th>
                        <th className="px-5 py-4 font-bold" scope="col">キャンセル条件</th>
                        <th className="px-5 py-4 font-bold" scope="col"><span className="sr-only">予約</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {sortedOffers.map((offer) => (
                        <tr
                          className={
                            lowestOffer === offer && isValidPrice(offer.price)
                              ? "bg-rose-50/50"
                              : "bg-white"
                          }
                          key={`${offer.site}-${offer.roomType}`}
                        >
                          <th className="px-5 py-5 font-bold text-slate-900" scope="row">
                            <div className="flex items-center gap-2">
                              {offer.site}
                              {lowestOffer === offer && isValidPrice(offer.price) && (
                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">最安値</span>
                              )}
                            </div>
                          </th>
                          <td className="whitespace-nowrap px-5 py-5 text-lg font-bold text-slate-950">{formatPrice(offer.price)}</td>
                          <td className="px-5 py-5 text-slate-700">{offer.roomType}</td>
                          <td className="whitespace-nowrap px-5 py-5 text-slate-700">{offer.hasBreakfast ? "朝食あり" : "朝食なし"}</td>
                          <td className="px-5 py-5 text-slate-700">{offer.cancellation}</td>
                          <td className="px-5 py-5 text-right">
                            <a
                              aria-label={`${offer.site}で${hotel.name}を予約する`}
                              className="inline-flex whitespace-nowrap rounded-lg bg-slate-900 px-4 py-2.5 font-bold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200"
                              href={offer.bookingUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              予約サイトへ
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="rounded-2xl bg-slate-50 p-6 text-slate-500">
                  現在、掲載中の料金はありません。
                </p>
              )}
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}

function StatusShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-16 text-slate-900">
      <div className="mx-auto max-w-xl">
        <Link
          className="mb-6 inline-flex text-sm font-bold text-sky-700 hover:text-sky-900 focus:outline-none focus:ring-4 focus:ring-sky-200"
          href="/"
        >
          ホテル一覧へ戻る
        </Link>
        {children}
      </div>
    </main>
  );
}

function DetailNotFound() {
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
