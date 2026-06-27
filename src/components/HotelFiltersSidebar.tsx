"use client";

import { AMENITY_OPTIONS, DEFAULT_SEARCH_CONDITION } from "@/lib/searchParams";
import type { Amenity, SearchCondition } from "@/types/search";

type HotelFiltersSidebarProps = {
  condition: SearchCondition;
  onChange: (condition: SearchCondition) => void;
};

const ratingOptions = [
  { value: "", label: "指定なし" },
  { value: "3", label: "3.0以上" },
  { value: "3.5", label: "3.5以上" },
  { value: "4", label: "4.0以上" },
  { value: "4.5", label: "4.5以上" },
];

const classOptions = [
  { value: "", label: "指定なし" },
  { value: "3", label: "3つ星以上" },
  { value: "4", label: "4つ星以上" },
  { value: "5", label: "5つ星" },
];

export default function HotelFiltersSidebar({
  condition,
  onChange,
}: HotelFiltersSidebarProps) {
  const update = (next: Partial<SearchCondition>) => {
    onChange({ ...condition, ...next, page: 1 });
  };

  const clearAll = () => {
    onChange({
      ...condition,
      minUserRating: null,
      minHotelClass: null,
      amenities: [],
      page: 1,
    });
  };

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-bold text-slate-950">絞り込み</h2>
        <button
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          onClick={clearAll}
          type="button"
        >
          すべてクリア
        </button>
      </div>

      <section className="border-b border-slate-200 px-5 py-5">
        <h3 className="text-sm font-semibold text-slate-900">利用者評価</h3>
        <div className="mt-3 grid gap-2">
          {ratingOptions.map((option) => (
            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700" key={option.value}>
              <input
                checked={String(condition.minUserRating ?? "") === option.value}
                className="size-4 accent-blue-600"
                name="minUserRating"
                onChange={() =>
                  update({
                    minUserRating: option.value === "" ? null : Number(option.value),
                  })
                }
                type="radio"
              />
              {option.label}
            </label>
          ))}
        </div>
      </section>

      <section className="border-b border-slate-200 px-5 py-5">
        <h3 className="text-sm font-semibold text-slate-900">ホテルクラス</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          取得できる範囲で絞り込みます
        </p>
        <div className="mt-3 grid gap-2">
          {classOptions.map((option) => (
            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700" key={option.value}>
              <input
                checked={String(condition.minHotelClass ?? "") === option.value}
                className="size-4 accent-blue-600"
                name="minHotelClass"
                onChange={() =>
                  update({
                    minHotelClass: option.value === "" ? null : Number(option.value),
                  })
                }
                type="radio"
              />
              {option.label}
            </label>
          ))}
        </div>
      </section>

      <section className="px-5 py-5">
        <h3 className="text-sm font-semibold text-slate-900">設備・サービス</h3>
        <div className="mt-3 grid gap-2">
          {AMENITY_OPTIONS.map((option) => {
            const checked = condition.amenities.includes(option.value);
            return (
              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700" key={option.value}>
                <input
                  checked={checked}
                  className="size-4 rounded accent-blue-600"
                  onChange={(event) => {
                    const amenities = event.target.checked
                      ? [...condition.amenities, option.value]
                      : condition.amenities.filter(
                          (amenity: Amenity) => amenity !== option.value,
                        );
                    update({ amenities });
                  }}
                  type="checkbox"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </section>

      <div className="border-t border-slate-200 px-5 py-4">
        <button
          className="h-11 w-full rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          onClick={() =>
            onChange({
              ...DEFAULT_SEARCH_CONDITION,
              destination: condition.destination,
              minPrice: condition.minPrice,
              maxPrice: condition.maxPrice,
              rakutenAreaCandidate: condition.rakutenAreaCandidate,
            })
          }
          type="button"
        >
          フィルターをリセット
        </button>
      </div>
    </aside>
  );
}
