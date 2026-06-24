"use client";

import { fetchHotelById, HotelApiError } from "@/lib/hotelApi";
import type { Hotel } from "@/types/hotel";
import Link from "next/link";
import { use, useEffect, useState } from "react";

type HotelDetailPageProps = {
  params: Promise<{ id: string }>;
};

const yenFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export default function HotelDetailPage({
  params,
}: HotelDetailPageProps) {
  const { id } = use(params);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    fetchHotelById(id)
      .then((data) => {
        if (isActive) setHotel(data);
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setErrorMessage(
          error instanceof HotelApiError && error.status === 404
            ? "ホテルが見つかりませんでした"
            : "ホテル情報の取得に失敗しました",
        );
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [id]);

  if (isLoading) {
    return <StatusMessage message="ホテル情報を読み込んでいます…" />;
  }

  if (errorMessage || !hotel) {
    return <StatusMessage isError message={errorMessage ?? "ホテルが見つかりませんでした"} />;
  }

  const sortedOffers = [...hotel.offers].sort((a, b) => a.price - b.price);
  const lowestOffer = sortedOffers[0];

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
          <div
            aria-label={`${hotel.name}の客室イメージ`}
            className="h-64 bg-slate-200 bg-cover bg-center sm:h-96"
            role="img"
            style={{ backgroundImage: `url(${hotel.imageUrl})` }}
          />

          <div className="p-6 sm:p-9">
            <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-sky-700">{hotel.area}</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  {hotel.name}
                </h1>
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
                    {yenFormatter.format(lowestOffer.price)}
                  </span>
                  <span className="ml-2 text-sm text-slate-500">〜 / 1泊</span>
                </p>
              ) : (
                <p className="mt-1 text-2xl font-bold text-slate-700">料金未定</p>
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
                  <table className="w-full min-w-[850px] border-collapse text-left text-sm">
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
                      {sortedOffers.map((offer, index) => (
                        <tr className={index === 0 ? "bg-rose-50/50" : "bg-white"} key={`${offer.site}-${offer.roomType}`}>
                          <th className="px-5 py-5 font-bold text-slate-900" scope="row">
                            <div className="flex items-center gap-2">
                              {offer.site}
                              {index === 0 && (
                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">最安値</span>
                              )}
                            </div>
                          </th>
                          <td className="whitespace-nowrap px-5 py-5 text-lg font-bold text-slate-950">{yenFormatter.format(offer.price)}</td>
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

function StatusMessage({
  message,
  isError = false,
}: {
  message: string;
  isError?: boolean;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-16 text-slate-900">
      <div
        className={`mx-auto max-w-xl rounded-2xl border bg-white px-6 py-16 text-center shadow-sm ${
          isError ? "border-rose-200" : "border-slate-200"
        }`}
        role={isError ? "alert" : "status"}
      >
        <p className="text-lg font-bold text-slate-800">{message}</p>
        <Link className="mt-5 inline-block font-bold text-sky-700" href="/">
          ホテル一覧へ戻る
        </Link>
      </div>
    </main>
  );
}
