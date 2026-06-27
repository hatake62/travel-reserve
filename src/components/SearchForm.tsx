"use client";

import { useState, type FormEvent } from "react";
import { DEFAULT_SEARCH_CONDITION } from "@/lib/searchParams";
import type { RakutenAreaCandidate } from "@/types/rakutenArea";
import type { SearchCondition } from "@/types/search";

type SearchFormProps = {
  onSearch: (condition: SearchCondition) => void;
  onReset: () => void;
  initialCondition: SearchCondition;
  isLoading?: boolean;
};

const inputClassName =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

export default function SearchForm({
  onSearch,
  onReset,
  initialCondition,
  isLoading = false,
}: SearchFormProps) {
  const [destination, setDestination] = useState(initialCondition.destination);
  const [minPrice, setMinPrice] = useState(
    initialCondition.minPrice === null ? "" : String(initialCondition.minPrice),
  );
  const [maxPrice, setMaxPrice] = useState(
    initialCondition.maxPrice === null ? "" : String(initialCondition.maxPrice),
  );
  const [rakutenAreaCandidate, setRakutenAreaCandidate] = useState<RakutenAreaCandidate | undefined>(
    initialCondition.rakutenAreaCandidate,
  );
  const [areaCandidates, setAreaCandidates] = useState<RakutenAreaCandidate[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  const [areaError, setAreaError] = useState<string | null>(null);

  const handleReset = () => {
    setDestination(DEFAULT_SEARCH_CONDITION.destination);
    setMinPrice("");
    setMaxPrice("");
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
      ...initialCondition,
      destination,
      checkIn: "",
      checkOut: "",
      guests: DEFAULT_SEARCH_CONDITION.guests,
      mealPlan: "",
      minPrice: minPrice === "" ? null : Number(minPrice),
      maxPrice: maxPrice === "" ? null : Number(maxPrice),
      features: [],
      site: "",
      breakfastOnly: false,
      page: 1,
      rakutenAreaCandidate,
    });
  };

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_160px_160px_auto] lg:items-end">
        <div className="relative">
          <label className="mb-1.5 block text-xs font-semibold text-slate-500" htmlFor="destination">
            目的地
          </label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              ⌖
            </span>
            <input
              className={`${inputClassName} pl-9 pr-10`}
              id="destination"
              name="destination"
              onChange={(event) => {
                setDestination(event.target.value);
                setRakutenAreaCandidate(undefined);
                setAreaCandidates([]);
                setAreaError(null);
              }}
              placeholder="東京、栃木、日光、那須"
              type="text"
              value={destination}
            />
            {destination && (
              <button
                aria-label="目的地をクリア"
                className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                onClick={() => {
                  setDestination("");
                  setRakutenAreaCandidate(undefined);
                  setAreaCandidates([]);
                  setAreaError(null);
                }}
                type="button"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">最低価格</span>
          <input
            className={inputClassName}
            inputMode="numeric"
            min="0"
            name="minPrice"
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="5,000"
            step="100"
            type="number"
            value={minPrice}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">最高価格</span>
          <input
            className={inputClassName}
            inputMode="numeric"
            min="0"
            name="maxPrice"
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="20,000"
            step="100"
            type="number"
            value={maxPrice}
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <button
            className="h-12 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-300"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "検索中" : "検索する"}
          </button>
          <button
            className="h-10 px-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600 disabled:text-slate-300"
            disabled={isLoading}
            onClick={handleReset}
            type="button"
          >
            条件をクリア
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-wait disabled:text-slate-300"
          disabled={isLoadingAreas}
          onClick={handleFindAreas}
          type="button"
        >
          {isLoadingAreas ? "地区候補を取得中" : "地区候補から選ぶ"}
        </button>
        {rakutenAreaCandidate && (
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600">
            地区選択済み
          </span>
        )}
        {areaError && <p className="text-xs font-semibold text-rose-700">{areaError}</p>}
      </div>

      {areaCandidates.length > 0 && (
        <ul className="mt-3 grid gap-1 rounded-xl border border-slate-200 bg-slate-50 p-2">
          {areaCandidates.map((candidate) => (
            <li key={`${candidate.areaClassCode}-${candidate.middleClassCode}-${candidate.smallClassCode}-${candidate.detailClassCode}-${candidate.displayName}`}>
              <button
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-white hover:text-blue-600"
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
    </form>
  );
}
