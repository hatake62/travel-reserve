"use client";

import ErrorMessage from "@/components/ErrorMessage";
import LoadingState from "@/components/LoadingState";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import type { BookingLinksResponse } from "@/types/bookingLinks";
import type { PriceHistoryResponse } from "@/types/priceHistory";
import Link from "next/link";
import { useState } from "react";

type PriceHistorySectionProps = {
  hotelId: string | number;
};

type CaptureSnapshotSummary = {
  price: number | null;
  sourcePriceField?: string;
  matchedPlanCount?: number;
  planName?: string;
  roomName?: string;
  status?: "available" | "not_found";
};

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getDefaultDates(): { checkInDate: string; checkOutDate: string } {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 30);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 1);
  return {
    checkInDate: toDateInputValue(checkIn),
    checkOutDate: toDateInputValue(checkOut),
  };
}

function getStayNights(checkInDate: string, checkOutDate: string): number {
  const checkIn = new Date(`${checkInDate}T00:00:00.000Z`).getTime();
  const checkOut = new Date(`${checkOutDate}T00:00:00.000Z`).getTime();
  const nights = Math.round((checkOut - checkIn) / 86400000);
  return Number.isFinite(nights) && nights >= 1 ? nights : 1;
}

function formatSavedPrice(price: number | null): string {
  return typeof price === "number" && Number.isFinite(price) && price > 0
    ? `${price.toLocaleString("ja-JP")}円`
    : "価格未取得";
}

export default function PriceHistorySection({
  hotelId,
}: PriceHistorySectionProps) {
  const defaultDates = getDefaultDates();
  const [checkInDate, setCheckInDate] = useState(defaultDates.checkInDate);
  const [checkOutDate, setCheckOutDate] = useState(defaultDates.checkOutDate);
  const [adults, setAdults] = useState(2);
  const [history, setHistory] = useState<PriceHistoryResponse | null>(null);
  const [bookingLinks, setBookingLinks] = useState<BookingLinksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoadingBookingLinks, setIsLoadingBookingLinks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadPriceHistory(clearNotice = true) {
    setIsLoading(true);
    setError(null);
    if (clearNotice) setNotice(null);

    try {
      const params = new URLSearchParams({
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults: String(adults),
      });
      const response = await fetch(
        `/api/hotels/${encodeURIComponent(String(hotelId))}/price-history?${params.toString()}`,
        { headers: { Accept: "application/json" } },
      );
      const data = (await response.json().catch(() => ({}))) as
        | PriceHistoryResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "料金履歴の取得に失敗しました",
        );
      }
      setHistory(data as PriceHistoryResponse);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "料金履歴の取得に失敗しました",
      );
      setHistory(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function registerPriceWatchTarget() {
    setIsRegistering(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/price-watch/targets", {
        body: JSON.stringify({
          hotelId: String(hotelId),
          checkInDate,
          checkOutDate,
          adults,
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "料金推移の記録開始に失敗しました");
      }
      setNotice(
        "この条件を追跡対象に追加しました。今すぐ保存する場合は、現在価格を1回取得してください。",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "料金推移の記録開始に失敗しました",
      );
    } finally {
      setIsRegistering(false);
    }
  }

  async function captureOnce() {
    setIsCapturing(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/price-watch/capture-once", {
        body: JSON.stringify({
          hotelId: String(hotelId),
          checkInDate,
          checkOutDate,
          adults,
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        snapshot?: CaptureSnapshotSummary;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "現在価格の保存に失敗しました");
      }
      const snapshot = data.snapshot;
      const planText =
        snapshot?.planName || snapshot?.roomName
          ? ` / ${snapshot.planName || snapshot.roomName}`
          : "";
      setNotice(
        `${checkInDate}から${getStayNights(
          checkInDate,
          checkOutDate,
        )}泊、大人${adults}名の指定日最安値として${formatSavedPrice(
          snapshot?.price ?? null,
        )}を保存しました。取得元: ${
          snapshot?.sourcePriceField ?? "dailyCharge.total"
        } / 取得プラン数: ${snapshot?.matchedPlanCount ?? 0}件${planText}`,
      );
      await loadPriceHistory(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "現在価格の保存に失敗しました",
      );
    } finally {
      setIsCapturing(false);
    }
  }

  async function loadBookingLinks() {
    setIsLoadingBookingLinks(true);
    setError(null);
    setNotice(null);

    try {
      const params = new URLSearchParams({
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults: String(adults),
      });
      const response = await fetch(
        `/api/hotels/${encodeURIComponent(String(hotelId))}/booking-url?${params.toString()}`,
        { headers: { Accept: "application/json" } },
      );
      const data = (await response.json().catch(() => ({}))) as
        | BookingLinksResponse
        | { error?: string };
      if (!response.ok) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "予約リンクの取得に失敗しました",
        );
      }
      setBookingLinks(data as BookingLinksResponse);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "予約リンクの取得に失敗しました",
      );
      setBookingLinks(null);
    } finally {
      setIsLoadingBookingLinks(false);
    }
  }

  return (
    <section
      aria-labelledby="price-history-heading"
      className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="mb-6">
        <p className="text-sm font-semibold text-sky-700">料金推移</p>
        <h2
          className="mt-1 text-2xl font-bold tracking-tight text-slate-900"
          id="price-history-heading"
        >
          指定宿泊日の過去30日間
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          毎日保存した料金スナップショットから推移を表示します。表示価格は取得時点の参考価格です。
        </p>
        <Link
          className="mt-3 inline-flex text-sm font-bold text-sky-700 hover:text-sky-900 focus:outline-none focus:ring-4 focus:ring-sky-200"
          href="/price-watch"
        >
          追跡中一覧を見る
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr_120px] md:items-end">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">チェックイン</span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
            onChange={(event) => setCheckInDate(event.target.value)}
            type="date"
            value={checkInDate}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">チェックアウト</span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
            onChange={(event) => setCheckOutDate(event.target.value)}
            type="date"
            value={checkOutDate}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">人数</span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
            max={10}
            min={1}
            onChange={(event) => setAdults(Number(event.target.value))}
            type="number"
            value={adults}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          className="h-11 rounded-lg bg-sky-700 px-5 text-sm font-bold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isLoading || isRegistering || isCapturing || isLoadingBookingLinks}
          onClick={() => {
            void loadPriceHistory();
          }}
          type="button"
        >
          料金推移を表示
        </button>
        <button
          className="h-11 rounded-lg border border-sky-700 px-5 text-sm font-bold text-sky-700 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
          disabled={isLoading || isRegistering || isCapturing || isLoadingBookingLinks}
          onClick={registerPriceWatchTarget}
          type="button"
        >
          {isRegistering
            ? "記録対象に追加中..."
            : "この条件を追跡対象に追加"}
        </button>
        <button
          className="h-11 rounded-lg border border-amber-600 px-5 text-sm font-bold text-amber-700 transition hover:bg-amber-50 focus:outline-none focus:ring-4 focus:ring-amber-200 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
          disabled={isLoading || isRegistering || isCapturing || isLoadingBookingLinks}
          onClick={captureOnce}
          type="button"
        >
          {isCapturing ? "保存中..." : "今すぐ1回取得して保存"}
        </button>
        <button
          className="h-11 rounded-lg bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isLoading || isRegistering || isCapturing || isLoadingBookingLinks}
          onClick={loadBookingLinks}
          type="button"
        >
          {isLoadingBookingLinks
            ? "予約リンク取得中..."
            : "指定条件の楽天プランを見る"}
        </button>
      </div>

      <div className="mt-6">
        {notice && !error && (
          <div className="mb-5 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
            {notice}
          </div>
        )}
        {isLoading ? (
          <LoadingState message="料金履歴を読み込んでいます..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadPriceHistory} />
        ) : history ? (
          <div>
            {history.warnings.length > 0 && (
              <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                {history.warnings.join(" / ")}
              </div>
            )}
            {history.points.length > 0 ? (
              <PriceHistoryChart points={history.points} />
            ) : (
              <p className="rounded-xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">
                まだ実データの料金履歴がありません。記録を開始すると、データが追加されます。
              </p>
            )}
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
            宿泊日と人数を指定して、保存済みの料金推移を確認できます。
          </p>
        )}

        {bookingLinks && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4">
              <p className="text-sm font-bold text-slate-900">
                楽天トラベルの予約リンク
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {bookingLinks.status === "available"
                  ? "指定条件に対応する予約リンク候補を取得しました。"
                  : "指定条件に合う空室・料金は見つかりませんでした。"}
              </p>
            </div>
            {bookingLinks.warnings.length > 0 && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                {bookingLinks.warnings.join(" / ")}
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {bookingLinks.bestReserveUrl && (
                <a
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200"
                  href={bookingLinks.bestReserveUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  最安プランを楽天トラベルで見る
                </a>
              )}
              {bookingLinks.planListUrl && (
                <a
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-sky-700 px-5 text-sm font-bold text-sky-700 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-200"
                  href={bookingLinks.planListUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  指定条件でプラン一覧を見る
                </a>
              )}
              {!bookingLinks.bestReserveUrl &&
                !bookingLinks.planListUrl &&
                bookingLinks.fallbackUrl && (
                  <a
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-700 px-5 text-sm font-bold text-slate-700 transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-slate-200"
                    href={bookingLinks.fallbackUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    通常の楽天トラベルページを開く
                  </a>
                )}
              {!bookingLinks.bestReserveUrl &&
                !bookingLinks.planListUrl &&
                !bookingLinks.fallbackUrl && (
                  <span className="inline-flex h-11 items-center rounded-lg bg-slate-100 px-5 text-sm font-bold text-slate-500">
                    予約リンクを取得できませんでした
                  </span>
                )}
            </div>
            {bookingLinks.links.length > 0 && (
              <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                {bookingLinks.links.slice(0, 3).map((link) => (
                  <li className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between" key={link.url}>
                    <div>
                      <p className="font-bold text-slate-900">
                        {link.planName || link.roomName || "楽天トラベルのプラン"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {link.price ? `${link.price.toLocaleString("ja-JP")}円〜` : "価格未取得"}
                      </p>
                    </div>
                    <a
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-sky-700 px-4 text-xs font-bold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
                      href={link.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      このプランを見る
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
