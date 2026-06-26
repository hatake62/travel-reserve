"use client";

import type { BookingLinksResponse } from "@/types/bookingLinks";
import { useState } from "react";

type RakutenBookingButtonProps = {
  hotelId: string | number;
  fallbackUrl: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
};

export default function RakutenBookingButton({
  hotelId,
  fallbackUrl,
  checkIn,
  checkOut,
  adults,
}: RakutenBookingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState("");
  const [message, setMessage] = useState("");
  const hasStayCondition = Boolean(checkIn && checkOut && adults);
  const isRakutenHotel = String(hotelId).startsWith("rakuten-");

  if (!hasStayCondition || !isRakutenHotel) {
    return fallbackUrl ? (
      <div className="mt-2 grid justify-items-end gap-1">
        <a
          className="inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200"
          href={fallbackUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          予約サイトへ
        </a>
        {isRakutenHotel && (
          <p className="max-w-44 text-right text-[11px] leading-4 text-slate-500">
            日付を指定すると該当プランへ移動できます。
          </p>
        )}
      </div>
    ) : (
      <span className="mt-2 inline-flex rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
        予約サイトで確認
      </span>
    );
  }

  async function loadBookingUrl() {
    setIsLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({
        checkIn: checkIn!,
        checkOut: checkOut!,
        adults: String(adults),
      });
      const response = await fetch(
        `/api/hotels/${encodeURIComponent(String(hotelId))}/booking-url?${params.toString()}`,
        { headers: { Accept: "application/json" } },
      );
      const data = (await response.json().catch(() => ({}))) as Partial<BookingLinksResponse>;
      const url = data.bestUrl || data.fallbackUrl || fallbackUrl;
      setResolvedUrl(url);
      setMessage(
        data.urlType === "fallbackWithoutDate"
          ? "通常ページを開きます。楽天トラベル側で日付を再指定してください。"
          : url
          ? "指定条件を付けた予約リンクを取得しました。"
          : "予約リンクを取得できませんでした。",
      );
    } catch {
      setResolvedUrl(fallbackUrl);
      setMessage("通常ページを開きます。楽天トラベル側で日付を再指定してください。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-2 grid justify-items-end gap-1">
      {resolvedUrl ? (
        <a
          className="inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200"
          href={resolvedUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          指定条件で予約する
        </a>
      ) : (
        <button
          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-wait disabled:bg-slate-400"
          disabled={isLoading}
          onClick={() => void loadBookingUrl()}
          type="button"
        >
          {isLoading ? "予約リンク取得中..." : "指定条件の予約リンクを取得"}
        </button>
      )}
      {message && <p className="max-w-44 text-right text-[11px] leading-4 text-slate-500">{message}</p>}
    </div>
  );
}
