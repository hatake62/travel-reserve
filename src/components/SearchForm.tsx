"use client";

import type { FormEvent } from "react";

const inputClassName =
  "h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-600 focus:ring-4 focus:ring-sky-100";

export default function SearchForm() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <form
      className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 sm:p-6 lg:grid-cols-[1.4fr_1fr_1fr_0.7fr_auto] lg:items-end"
      onSubmit={handleSubmit}
    >
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        目的地
        <input
          className={inputClassName}
          name="destination"
          placeholder="例: 東京、新宿"
          type="text"
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        チェックイン日
        <input className={inputClassName} name="checkIn" type="date" />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        チェックアウト日
        <input className={inputClassName} name="checkOut" type="date" />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        人数
        <select className={inputClassName} defaultValue="2" name="guests">
          <option value="1">1名</option>
          <option value="2">2名</option>
          <option value="3">3名</option>
          <option value="4">4名</option>
          <option value="5">5名以上</option>
        </select>
      </label>

      <button
        className="h-12 rounded-lg bg-sky-700 px-7 text-base font-bold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200"
        type="submit"
      >
        検索
      </button>
    </form>
  );
}
