"use client";

import type { PriceHistoryPoint } from "@/types/priceHistory";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PriceHistoryChartProps = {
  points: PriceHistoryPoint[];
};

const yenFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

function formatPrice(price: number | null): string {
  return typeof price === "number" && Number.isFinite(price) && price >= 1
    ? yenFormatter.format(price)
    : "価格未取得";
}

export default function PriceHistoryChart({ points }: PriceHistoryChartProps) {
  const prices = points
    .map((point) => point.price)
    .filter((price): price is number => typeof price === "number" && Number.isFinite(price) && price > 0);
  const latestPrice = [...points].reverse().find((point) => typeof point.price === "number" && point.price > 0)?.price ?? null;
  const missingCount = points.length - prices.length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-bold text-slate-500">データ点数</p>
          <p className="mt-1 text-lg font-bold text-slate-950">{points.length}件</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-bold text-slate-500">最新価格</p>
          <p className="mt-1 text-lg font-bold text-slate-950">{formatPrice(latestPrice)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-bold text-slate-500">最安値</p>
          <p className="mt-1 text-lg font-bold text-slate-950">{formatPrice(prices.length ? Math.min(...prices) : null)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-bold text-slate-500">最高値</p>
          <p className="mt-1 text-lg font-bold text-slate-950">{formatPrice(prices.length ? Math.max(...prices) : null)}</p>
        </div>
      </div>
      {points.length === 1 && (
        <p className="mb-4 rounded-xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
          記録を開始しました。日数が経つと推移が表示されます。
        </p>
      )}
      {missingCount > 0 && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          価格未取得の日が{missingCount}件あります。
        </p>
      )}
      <div className="h-80 w-full">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart
            data={points}
            margin={{ bottom: 8, left: 8, right: 24, top: 16 }}
          >
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
            <XAxis
              dataKey="capturedDate"
              minTickGap={24}
              stroke="#64748b"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) =>
                typeof value === "number" && value >= 1
                  ? `${Math.round(value / 1000)}千円`
                  : ""
              }
              width={64}
            />
            <Tooltip
              formatter={(value) => [
                formatPrice(typeof value === "number" ? value : null),
                "料金",
              ]}
              labelFormatter={(label) => `取得日: ${label}`}
            />
            <Line
              connectNulls={false}
              dataKey="price"
              dot={{ r: 4 }}
              name="料金"
              stroke="#0369a1"
              strokeWidth={3}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
