"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { BenchmarkModel } from "@/types/leaderboard";

type SortField =
  | "name"
  | "provider"
  | "inputCostPer1M"
  | "outputCostPer1M"
  | "tokensPerSecond"
  | "timeToFirstToken"
  | "contextLength"
  | "gpqaDiamond"
  | "aime2024"
  | "sweBench";

type SortDirection = "asc" | "desc";

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

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
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "gpqaDiamond",
    direction: "desc",
  });

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction:
        prev.field === field && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4 text-blue-500" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-500" />
    );
  };

  const sorted = useMemo(() => {
    return [...models].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.field.startsWith("gpqa") || 
          sortConfig.field.startsWith("aime") || 
          sortConfig.field.startsWith("swe")) {
        // Handle benchmark fields
        aValue = a.benchmarks[sortConfig.field as keyof typeof a.benchmarks];
        bValue = b.benchmarks[sortConfig.field as keyof typeof b.benchmarks];
      } else {
        aValue = (a as any)[sortConfig.field];
        bValue = (b as any)[sortConfig.field];
      }

      // Handle undefined/null values - move them to end
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Convert string numbers to actual numbers for proper sorting
      if (typeof aValue === "string" && !isNaN(Number(aValue))) {
        aValue = Number(aValue);
      }
      if (typeof bValue === "string" && !isNaN(Number(bValue))) {
        bValue = Number(bValue);
      }

      // Handle string sorting
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle number sorting (with NaN protection)
      const numA = isNaN(aValue) ? 0 : aValue;
      const numB = isNaN(bValue) ? 0 : bValue;

      if (sortConfig.direction === "asc") {
        return numA - numB;
      } else {
        return numB - numA;
      }
    });
  }, [models, sortConfig]);

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            <th 
              className="px-4 py-3 text-left text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center gap-2">
                Model <SortIcon field="name" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => handleSort("provider")}
            >
              <div className="flex items-center gap-2">
                Provider <SortIcon field="provider" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => handleSort("inputCostPer1M")}
            >
              <div className="flex items-center gap-2">
                Input $/1M <SortIcon field="inputCostPer1M" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => handleSort("outputCostPer1M")}
            >
              <div className="flex items-center gap-2">
                Output $/1M <SortIcon field="outputCostPer1M" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => handleSort("tokensPerSecond")}
            >
              <div className="flex items-center gap-2">
                Speed <SortIcon field="tokensPerSecond" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => handleSort("timeToFirstToken")}
            >
              <div className="flex items-center gap-2">
                TTFT <SortIcon field="timeToFirstToken" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => handleSort("contextLength")}
            >
              <div className="flex items-center gap-2">
                Context <SortIcon field="contextLength" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => handleSort("gpqaDiamond")}
            >
              <div className="flex items-center gap-2">
                GPQA <SortIcon field="gpqaDiamond" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => handleSort("aime2024")}
            >
              <div className="flex items-center gap-2">
                AIME <SortIcon field="aime2024" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => handleSort("sweBench")}
            >
              <div className="flex items-center gap-2">
                SWE <SortIcon field="sweBench" />
              </div>
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
