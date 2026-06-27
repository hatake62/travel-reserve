"use client";

import { useState, type FormEvent } from "react";
import { DEFAULT_SEARCH_CONDITION } from "@/lib/searchParams";
import type { RakutenAreaCandidate } from "@/types/rakutenArea";
import type { BookingSite, MealPlan, SearchCondition, SortBy } from "@/types/search";

type SearchFormProps = {
  onSearch: (condition: SearchCondition) => void;
  onReset: () => void;
  initialCondition: SearchCondition;
  isLoading?: boolean;
};

const fieldClassName =
  "min-h-14 w-full border-0 bg-transparent px-0 text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400 focus:ring-0";

const FEATURE_OPTIONS = ["禁煙", "温泉", "大浴場", "インターネット利用可"];

export default function SearchForm({
  onSearch,
  onReset,
  initialCondition,
  isLoading = false,
}: SearchFormProps) {
  const [destination, setDestination] = useState(initialCondition.destination);
  const [sortBy, setSortBy] = useState<SortBy>(initialCondition.sortBy);
  const [mealPlan, setMealPlan] = useState<MealPlan>(initialCondition.mealPlan);
  const [minPrice, setMinPrice] = useState(
    initialCondition.minPrice === null ? "" : String(initialCondition.minPrice),
  );
  const [maxPrice, setMaxPrice] = useState(
    initialCondition.maxPrice === null ? "" : String(initialCondition.maxPrice),
  );
  const [site, setSite] = useState<BookingSite>(initialCondition.site);
  const [breakfastOnly, setBreakfastOnly] = useState(initialCondition.breakfastOnly);
  const [features, setFeatures] = useState<string[]>(initialCondition.features);
  const [rakutenAreaCandidate, setRakutenAreaCandidate] = useState<RakutenAreaCandidate>();
  const [areaCandidates, setAreaCandidates] = useState<RakutenAreaCandidate[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  const [areaError, setAreaError] = useState<string | null>(null);

  const handleReset = () => {
    setDestination(DEFAULT_SEARCH_CONDITION.destination);
    setSortBy(DEFAULT_SEARCH_CONDITION.sortBy);
    setMealPlan(DEFAULT_SEARCH_CONDITION.mealPlan);
    setMinPrice("");
    setMaxPrice("");
    setSite(DEFAULT_SEARCH_CONDITION.site);
    setBreakfastOnly(DEFAULT_SEARCH_CONDITION.breakfastOnly);
    setFeatures([]);
    setRakutenAreaCandidate(undefined);
    setAreaCandidates([]);
    setAreaError(null);
    onReset();
  };

  const handleFindAreas = async () => {
    const trimmedDestination = destination.trim();
    if (!trimmedDestination) {
      setAreaCandidates([]);
      setAreaError("目的地を入力してください。");
      return;
    }
    if (trimmedDestination.length < 2) {
      setAreaCandidates([]);
      setAreaError("地区候補は2文字以上で検索してください。");
      return;
    }

    setIsLoadingAreas(true);
    setAreaError(null);
    try {
      const response = await fetch(
        `/api/areas?keyword=${encodeURIComponent(trimmedDestination)}`,
      );
      const data = (await response.json()) as
        | RakutenAreaCandidate[]
        | { error?: string };
      if (!response.ok || !Array.isArray(data)) {
        throw new Error(
          !Array.isArray(data) && data.error
            ? data.error
            : "地区候補の取得に失敗しました。",
        );
      }
      setAreaCandidates(data.slice(0, 5));
      if (data.length === 0) setAreaError("一致する地区候補がありません。");
    } catch (error) {
      setAreaCandidates([]);
      setAreaError(
        error instanceof Error ? error.message : "地区候補の取得に失敗しました。",
      );
    } finally {
      setIsLoadingAreas(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch({
      destination,
      checkIn: "",
      checkOut: "",
      guests: DEFAULT_SEARCH_CONDITION.guests,
      sortBy,
      mealPlan,
      minPrice: minPrice === "" ? null : Number(minPrice),
      maxPrice: maxPrice === "" ? null : Number(maxPrice),
      features,
      site,
      breakfastOnly: breakfastOnly || mealPlan === "breakfast" || mealPlan === "dinnerBreakfast",
      page: 1,
      rakutenAreaCandidate,
    });
  };

  return (
    <form
      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="grid gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="border-b border-slate-200 p-4 lg:border-b-0 lg:border-r">
          <label className="block text-xs font-bold text-slate-500" htmlFor="destination">
            目的地
          </label>
          <input
            className={fieldClassName}
            id="destination"
            name="destination"
            onChange={(event) => {
              setDestination(event.target.value);
              setRakutenAreaCandidate(undefined);
              setAreaCandidates([]);
              setAreaError(null);
            }}
            placeholder="例: 東京、栃木、日光、那須"
            type="text"
            value={destination}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              aria-label="楽天トラベルの地区候補を検索"
              className="rounded-full border border-sky-700 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-50 disabled:cursor-wait disabled:border-slate-300 disabled:text-slate-400"
              disabled={isLoadingAreas}
              onClick={handleFindAreas}
              type="button"
            >
              {isLoadingAreas ? "候補取得中" : "地区候補"}
            </button>
            {rakutenAreaCandidate && (
              <span className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800" role="status">
                地区選択済み
              </span>
            )}
          </div>
          {areaError && <p className="text-xs text-rose-700" role="alert">{areaError}</p>}
          {areaCandidates.length > 0 && (
            <ul className="mt-2 grid gap-1 rounded-xl border border-slate-200 bg-slate-50 p-2">
              {areaCandidates.map((candidate) => (
                <li key={`${candidate.areaClassCode}-${candidate.middleClassCode}-${candidate.smallClassCode}-${candidate.detailClassCode}-${candidate.displayName}`}>
                  <button
                    className="w-full rounded-md px-2 py-2 text-left text-xs font-medium text-slate-700 hover:bg-white hover:text-sky-800"
                    onClick={() => {
                      setDestination(candidate.label ?? candidate.displayName);
                      setRakutenAreaCandidate(candidate);
                      setAreaCandidates([]);
                      setAreaError(null);
                    }}
                    type="button"
                  >
                    {candidate.label ?? candidate.displayName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-3">
          <button
            aria-label="指定した条件でホテルを検索"
            className="h-full min-h-12 w-full rounded-2xl bg-sky-700 px-7 text-base font-bold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-wait disabled:bg-slate-400"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "検索中" : "検索"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="grid gap-1 text-xs font-bold text-slate-500" htmlFor="mealPlan">
          食事条件
          <select
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100"
            id="mealPlan"
            name="mealPlan"
            onChange={(event) => {
              const nextMealPlan = event.target.value as MealPlan;
              setMealPlan(nextMealPlan);
              setBreakfastOnly(nextMealPlan === "breakfast" || nextMealPlan === "dinnerBreakfast");
            }}
            value={mealPlan}
          >
            <option value="">指定なし</option>
            <option value="breakfast">朝食付き</option>
            <option value="dinnerBreakfast">夕朝食付き</option>
          </select>
        </label>

        <label className="grid gap-1 text-xs font-bold text-slate-500" htmlFor="sortBy">
          並び替え
          <select
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100"
            id="sortBy"
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

        <label className="grid gap-1 text-xs font-bold text-slate-500" htmlFor="minPrice">
          価格下限
          <input
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100"
            id="minPrice"
            inputMode="numeric"
            min="0"
            name="minPrice"
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="例: 10000"
            step="100"
            type="number"
            value={minPrice}
          />
        </label>

        <label className="grid gap-1 text-xs font-bold text-slate-500" htmlFor="maxPrice">
          価格上限
          <input
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100"
            id="maxPrice"
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

        <label className="grid gap-1 text-xs font-bold text-slate-500" htmlFor="site">
          予約サイト
          <select
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100"
            id="site"
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

      <div className="mt-4 flex flex-col gap-4 border-t border-slate-200 pt-4 lg:flex-row lg:items-center lg:justify-between">
        <fieldset>
          <legend className="mb-2 text-xs font-bold text-slate-500">こだわり条件</legend>
          <div className="flex flex-wrap gap-2">
            {FEATURE_OPTIONS.map((feature) => {
              const checked = features.includes(feature);
              return (
                <label
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${
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
                      setFeatures((current) =>
                        event.target.checked
                          ? [...current, feature]
                          : current.filter((value) => value !== feature),
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

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-wait disabled:text-slate-400"
            disabled={isLoading}
            onClick={handleReset}
            type="button"
          >
            条件をリセット
          </button>
        </div>
      </div>
    </form>
  );
}
