"use client";

import ErrorMessage from "@/components/ErrorMessage";
import LayoutShell from "@/components/LayoutShell";
import LoadingState from "@/components/LoadingState";
import type { PriceWatchTarget } from "@/types/priceHistory";
import Link from "next/link";
import { useEffect, useState } from "react";

type TargetsResponse = {
  targets?: PriceWatchTarget[];
  warnings?: string[];
  error?: string;
};

export default function PriceWatchPage() {
  const [targets, setTargets] = useState<PriceWatchTarget[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadTargets() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/price-watch/targets", {
        headers: { Accept: "application/json" },
      });
      const data = (await response.json().catch(() => ({}))) as TargetsResponse;
      if (!response.ok) {
        throw new Error(data.error ?? "追跡対象の取得に失敗しました");
      }
      setTargets(data.targets ?? []);
      setWarnings(data.warnings ?? []);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "追跡対象の取得に失敗しました",
      );
      setTargets([]);
      setWarnings([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateTarget(target: PriceWatchTarget, enabled: boolean) {
    if (!target.id) return;
    setUpdatingId(target.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/price-watch/targets/${encodeURIComponent(target.id)}`,
        {
          body: JSON.stringify({ enabled }),
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          method: "PATCH",
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "追跡対象の更新に失敗しました");
      }
      await loadTargets();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "追跡対象の更新に失敗しました",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTargets();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <LayoutShell>
      <main className="px-5 py-8 text-slate-900 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
        <Link
          className="mb-6 inline-flex text-sm font-bold text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          href="/"
        >
          ホテル一覧へ戻る
        </Link>
        <header className="mb-8">
          <p className="text-sm font-semibold text-blue-600">Price Watch</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            料金追跡の管理
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            登録済みのホテル・宿泊条件を確認し、不要な追跡を停止できます。追跡対象は最大10件です。
          </p>
        </header>

        {warnings.length > 0 && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {warnings.join(" / ")}
          </div>
        )}

        {isLoading ? (
          <LoadingState message="追跡対象を読み込んでいます..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadTargets} />
        ) : targets.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-5 py-4 font-bold" scope="col">ホテルID</th>
                  <th className="px-5 py-4 font-bold" scope="col">チェックイン</th>
                  <th className="px-5 py-4 font-bold" scope="col">チェックアウト</th>
                  <th className="px-5 py-4 font-bold" scope="col">人数</th>
                  <th className="px-5 py-4 font-bold" scope="col">状態</th>
                  <th className="px-5 py-4 font-bold" scope="col">最終更新</th>
                  <th className="px-5 py-4 font-bold" scope="col"><span className="sr-only">操作</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {targets.map((target) => (
                  <tr className="bg-white" key={target.id ?? `${target.hotelId}-${target.checkInDate}`}>
                    <td className="px-5 py-5 font-bold text-slate-900">
                      {target.hotelId}
                    </td>
                    <td className="px-5 py-5 text-slate-700">{target.checkInDate}</td>
                    <td className="px-5 py-5 text-slate-700">{target.checkOutDate}</td>
                    <td className="px-5 py-5 text-slate-700">{target.adults}名</td>
                    <td className="px-5 py-5">
                      <span
                        className={
                          target.enabled
                            ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700"
                            : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"
                        }
                      >
                        {target.enabled ? "追跡中" : "停止中"}
                      </span>
                    </td>
                    <td className="px-5 py-5 text-slate-700">
                      {target.updatedAt?.slice(0, 10) ?? "-"}
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex justify-end gap-2">
                        <Link
                          className="inline-flex h-10 items-center rounded-xl border border-blue-600 px-3 text-xs font-bold text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
                          href={`/hotels/${encodeURIComponent(target.hotelId)}`}
                        >
                          料金履歴を見る
                        </Link>
                        <button
                          className="inline-flex h-10 items-center rounded-xl bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-300"
                          disabled={updatingId === target.id}
                          onClick={() => {
                            void updateTarget(target, !target.enabled);
                          }}
                          type="button"
                        >
                          {target.enabled ? "追跡停止" : "再開"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-2xl bg-white p-8 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
            追跡対象はまだ登録されていません。ホテル詳細ページから宿泊条件を追加できます。
          </p>
        )}
        </div>
      </main>
    </LayoutShell>
  );
}
