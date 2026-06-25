"use client";

import ErrorMessage from "@/components/ErrorMessage";
import LoadingState from "@/components/LoadingState";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import type { PriceHistoryResponse } from "@/types/priceHistory";
import { useState } from "react";

type PriceHistorySectionProps = {
  hotelId: string | number;
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

export default function PriceHistorySection({
  hotelId,
}: PriceHistorySectionProps) {
  const defaultDates = getDefaultDates();
  const [checkInDate, setCheckInDate] = useState(defaultDates.checkInDate);
  const [checkOutDate, setCheckOutDate] = useState(defaultDates.checkOutDate);
  const [adults, setAdults] = useState(2);
  const [history, setHistory] = useState<PriceHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadPriceHistory() {
    setIsLoading(true);
    setError(null);
    setNotice(null);

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
        "この宿泊日の料金推移を記録対象に追加しました。Cron実行後に実データが追加されます。",
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
          disabled={isLoading || isRegistering}
          onClick={loadPriceHistory}
          type="button"
        >
          料金推移を表示
        </button>
        <button
          className="h-11 rounded-lg border border-sky-700 px-5 text-sm font-bold text-sky-700 transition hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
          disabled={isLoading || isRegistering}
          onClick={registerPriceWatchTarget}
          type="button"
        >
          {isRegistering
            ? "記録対象に追加中..."
            : "この宿泊日の料金推移を記録する"}
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
                まだ実データの料金履歴がありません。記録を開始すると、毎日データが追加されます。
              </p>
            )}
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
            宿泊日と人数を指定して、保存済みの料金推移を確認できます。
          </p>
        )}
      </div>
    </section>
  );
}
