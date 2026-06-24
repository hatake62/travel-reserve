"use client";

import { useState, type FormEvent } from "react";
import { validateHotelSearch } from "@/lib/searchValidation";
import type { BookingSite, SearchCondition, SortBy } from "@/types/search";

type SearchFormProps = {
  onSearch: (condition: SearchCondition) => void;
  isLoading?: boolean;
};

const inputClassName =
  "h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-600 focus:ring-4 focus:ring-sky-100";

export default function SearchForm({ onSearch, isLoading = false }: SearchFormProps) {
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [sortBy, setSortBy] = useState<SortBy>("recommended");
  const [maxPrice, setMaxPrice] = useState("");
  const [site, setSite] = useState<BookingSite>("");
  const [breakfastOnly, setBreakfastOnly] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = validateHotelSearch({ checkIn, checkOut, guests });
    if (message) {
      setValidationMessage(message);
      return;
    }
    setValidationMessage(null);
    onSearch({
      destination,
      checkIn,
      checkOut,
      guests,
      sortBy,
      maxPrice: maxPrice === "" ? null : Number(maxPrice),
      site,
      breakfastOnly,
    });
  };

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 sm:p-6"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-2 text-sm font-semibold text-slate-700 lg:col-span-2">
          目的地
          <input
            className={inputClassName}
            name="destination"
            onChange={(event) => setDestination(event.target.value)}
            placeholder="例: 東京、新宿"
            type="text"
            value={destination}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          チェックイン日
          <input
            className={inputClassName}
            name="checkIn"
            required
            onChange={(event) => setCheckIn(event.target.value)}
            type="date"
            value={checkIn}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          チェックアウト日
          <input
            className={inputClassName}
            min={checkIn ? getNextDate(checkIn) : undefined}
            name="checkOut"
            required
            onChange={(event) => setCheckOut(event.target.value)}
            type="date"
            value={checkOut}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          人数
          <select
            className={inputClassName}
            name="guests"
            onChange={(event) => setGuests(Number(event.target.value))}
            value={guests}
          >
            <option value="1">1名</option>
            <option value="2">2名</option>
            <option value="3">3名</option>
            <option value="4">4名</option>
            <option value="5">5名以上</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          並び替え
          <select
            className={inputClassName}
            name="sortBy"
            onChange={(event) => setSortBy(event.target.value as SortBy)}
            value={sortBy}
          >
            <option value="recommended">おすすめ順</option>
            <option value="priceAsc">安い順</option>
            <option value="priceDesc">高い順</option>
            <option value="ratingDesc">評価が高い順</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          上限価格（1泊）
          <input
            className={inputClassName}
            inputMode="numeric"
            min="0"
            name="maxPrice"
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="例: 20000"
            step="100"
            type="number"
            value={maxPrice}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          予約サイト
          <select
            className={inputClassName}
            name="site"
            onChange={(event) => setSite(event.target.value as BookingSite)}
            value={site}
          >
            <option value="">すべて</option>
            <option value="楽天トラベル">楽天トラベル</option>
            <option value="じゃらん">じゃらん</option>
            <option value="Yahoo!トラベル">Yahoo!トラベル</option>
            <option value="一休.com">一休.com</option>
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700">
          <input
            checked={breakfastOnly}
            className="size-5 rounded border-slate-300 accent-sky-700 focus:ring-4 focus:ring-sky-100"
            name="breakfastOnly"
            onChange={(event) => setBreakfastOnly(event.target.checked)}
            type="checkbox"
          />
          朝食ありのプランがあるホテルのみ
        </label>

        <button
          className="h-12 rounded-lg bg-sky-700 px-9 text-base font-bold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-wait disabled:bg-slate-400"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "検索中..." : "この条件で検索"}
        </button>
      </div>
      {validationMessage && (
        <p className="mt-4 text-sm font-semibold text-rose-700" role="alert">
          {validationMessage}
        </p>
      )}
    </form>
  );
}

function getNextDate(date: string): string {
  const nextDate = new Date(`${date}T00:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  return nextDate.toISOString().slice(0, 10);
}
