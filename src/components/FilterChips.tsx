import { AMENITY_OPTIONS } from "@/lib/searchParams";
import type { SearchCondition } from "@/types/search";

type FilterChipsProps = {
  condition: SearchCondition;
  onChange: (condition: SearchCondition) => void;
};

const amenityLabels = new Map(
  AMENITY_OPTIONS.map((option) => [option.value, option.label]),
);

export default function FilterChips({ condition, onChange }: FilterChipsProps) {
  const chips: Array<{ key: string; label: string; remove: () => SearchCondition }> = [];

  if (condition.destination.trim()) {
    chips.push({
      key: "destination",
      label: condition.destination.trim(),
      remove: () => ({
        ...condition,
        destination: "",
        page: 1,
        rakutenAreaCandidate: undefined,
      }),
    });
  }

  if (condition.minPrice !== null) {
    chips.push({
      key: "minPrice",
      label: `${condition.minPrice.toLocaleString("ja-JP")}円以上`,
      remove: () => ({ ...condition, minPrice: null, page: 1 }),
    });
  }

  if (condition.maxPrice !== null) {
    chips.push({
      key: "maxPrice",
      label: `${condition.maxPrice.toLocaleString("ja-JP")}円以下`,
      remove: () => ({ ...condition, maxPrice: null, page: 1 }),
    });
  }

  if (condition.minUserRating !== null) {
    chips.push({
      key: "minUserRating",
      label: `評価${condition.minUserRating.toFixed(1)}以上`,
      remove: () => ({ ...condition, minUserRating: null, page: 1 }),
    });
  }

  if (condition.minHotelClass !== null) {
    chips.push({
      key: "minHotelClass",
      label:
        condition.minHotelClass === 5
          ? "5つ星"
          : `${condition.minHotelClass}つ星以上`,
      remove: () => ({ ...condition, minHotelClass: null, page: 1 }),
    });
  }

  for (const amenity of condition.amenities) {
    chips.push({
      key: `amenity-${amenity}`,
      label: amenityLabels.get(amenity) ?? amenity,
      remove: () => ({
        ...condition,
        amenities: condition.amenities.filter((value) => value !== amenity),
        page: 1,
      }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="選択中の検索条件">
      {chips.map((chip) => (
        <button
          aria-label={`${chip.label} の条件を削除`}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100"
          key={chip.key}
          onClick={() => onChange(chip.remove())}
          type="button"
        >
          <span>{chip.label}</span>
          <span aria-hidden="true" className="text-slate-400">×</span>
        </button>
      ))}
    </div>
  );
}
