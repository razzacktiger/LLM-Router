"use client";

import { useMemo } from "react";
import type { BenchmarkModel } from "@/types/leaderboard";

function formatUsdPerM(value: number) {
  if (value === 0) return "-";
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatTokensPerSecond(value: number) {
  if (value === 0) return "-";
  return `${value.toLocaleString()} tps`;
}

function formatContext(value: number) {
  if (value === 0) return "-";
  return `${value.toLocaleString()} tok`;
}

export function LeaderboardTable({ models }: { models: BenchmarkModel[] }) {
  const sorted = useMemo(() => {
    return [...models].sort((a, b) => {
      // Example sort: highest gpqaDiamond first, then AIME
      const aScore =
        (a.benchmarks.gpqaDiamond || 0) + (a.benchmarks.aime2024 || 0) * 0.5;
      const bScore =
        (b.benchmarks.gpqaDiamond || 0) + (b.benchmarks.aime2024 || 0) * 0.5;
      return bScore - aScore;
    });
  }, [models]);

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-300">
              Model
            </th>
            <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-300">
              Provider
            </th>
            <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-300">
              Input $/1M
            </th>
            <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-300">
              Output $/1M
            </th>
            <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-300">
              Speed
            </th>
            <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-300">
              TTFT
            </th>
            <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-300">
              Context
            </th>
            <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-300">
              GPQA
            </th>
            <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-300">
              AIME
            </th>
            <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-300">
              SWE
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(m => (
            <tr
              key={m.id}
              className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
            >
              <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">
                {m.name}
              </td>
              <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                {m.provider}
              </td>
              <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                {formatUsdPerM(m.inputCostPer1M)}
              </td>
              <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                {formatUsdPerM(m.outputCostPer1M)}
              </td>
              <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                {formatTokensPerSecond(m.tokensPerSecond)}
              </td>
              <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                {m.timeToFirstToken ? `${m.timeToFirstToken}s` : "-"}
              </td>
              <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                {formatContext(m.contextLength)}
              </td>
              <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                {m.benchmarks.gpqaDiamond || "-"}
              </td>
              <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                {m.benchmarks.aime2024 || "-"}
              </td>
              <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                {m.benchmarks.sweBench || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
