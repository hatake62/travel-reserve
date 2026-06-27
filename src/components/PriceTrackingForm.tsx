"use client";

import type { MealPlan } from "@/types/search";
import { AMENITY_OPTIONS } from "@/lib/searchParams";

type PriceTrackingFormProps = {
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  mealPlan: MealPlan;
  minPrice: string;
  maxPrice: string;
  features: string[];
  onCheckInDateChange: (value: string) => void;
  onCheckOutDateChange: (value: string) => void;
  onAdultsChange: (value: number) => void;
  onMealPlanChange: (value: MealPlan) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onFeaturesChange: (value: string[]) => void;
};

const FEATURE_OPTIONS = AMENITY_OPTIONS.map((option) => option.label);

export default function PriceTrackingForm({
  checkInDate,
  checkOutDate,
  adults,
  mealPlan,
  minPrice,
  maxPrice,
  features,
  onCheckInDateChange,
  onCheckOutDateChange,
  onAdultsChange,
  onMealPlanChange,
  onMinPriceChange,
  onMaxPriceChange,
  onFeaturesChange,
}: PriceTrackingFormProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_120px] md:items-end">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">チェックイン</span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
            onChange={(event) => onCheckInDateChange(event.target.value)}
            type="date"
            value={checkInDate}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">チェックアウト</span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
            onChange={(event) => onCheckOutDateChange(event.target.value)}
            type="date"
            value={checkOutDate}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">大人人数</span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
            max={10}
            min={1}
            onChange={(event) => onAdultsChange(Number(event.target.value))}
            type="number"
            value={adults}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">食事条件</span>
          <select
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
            onChange={(event) => onMealPlanChange(event.target.value as MealPlan)}
            value={mealPlan}
          >
            <option value="">指定なし</option>
            <option value="breakfast">朝食付き</option>
            <option value="dinner">夕食付き</option>
            <option value="dinnerBreakfast">夕朝食付き</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">希望価格下限</span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
            inputMode="numeric"
            min="0"
            onChange={(event) => onMinPriceChange(event.target.value)}
            placeholder="例: 5000"
            type="number"
            value={minPrice}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">希望価格上限</span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
            inputMode="numeric"
            min="0"
            onChange={(event) => onMaxPriceChange(event.target.value)}
            placeholder="例: 20000"
            type="number"
            value={maxPrice}
          />
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-bold text-slate-700">設備条件</legend>
        <div className="flex flex-wrap gap-2">
          {FEATURE_OPTIONS.map((feature) => {
            const checked = features.includes(feature);
            return (
              <label
                className={`inline-flex cursor-pointer rounded-full border px-3 py-2 text-xs font-bold transition ${
                  checked
                    ? "border-sky-700 bg-sky-50 text-sky-800"
                    : "border-slate-300 bg-white text-slate-700 hover:border-sky-300"
                }`}
                key={feature}
              >
                <input
                  checked={checked}
                  className="sr-only"
                  onChange={(event) => {
                    onFeaturesChange(
                      event.target.checked
                        ? [...features, feature]
                        : features.filter((value) => value !== feature),
                    );
                  }}
                  type="checkbox"
                />
                {feature}
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
