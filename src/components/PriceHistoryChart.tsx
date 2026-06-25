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
  return (
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
  );
}
