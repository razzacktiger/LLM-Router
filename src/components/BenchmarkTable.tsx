"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BenchmarkModel } from "@/types/leaderboard";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Clock,
  DollarSign,
  Zap,
  Brain,
  Code,
  Calculator,
} from "lucide-react";

interface BenchmarkTableProps {
  models: BenchmarkModel[];
  highlightedModel?: string; // Model name to highlight
}

type SortField =
  | "name"
  | "provider"
  | "cost_efficiency"
  | "performance_score"
  | "speed_score"
  | "inputCostPer1M"
  | "outputCostPer1M"
  | "tokensPerSecond"
  | "timeToFirstToken"
  | "contextLength"
  | "gpqaDiamond"
  | "aime2024"
  | "sweBench"
  | "bfcl"
  | "alderPolyglot";

type SortDirection = "asc" | "desc";

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export function BenchmarkTable({
  models,
  highlightedModel,
}: BenchmarkTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "performance_score",
    direction: "desc",
  });

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction:
        prev.field === field && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const sortedModels = useMemo(() => {
    const sorted = [...models].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.field.includes(".")) {
        // Handle nested properties like benchmarks.gpqaDiamond
        const [parent, child] = sortConfig.field.split(".");
        aValue = (a as any)[parent]?.[child];
        bValue = (b as any)[parent]?.[child];
      } else if (
        sortConfig.field.startsWith("gpqa") ||
        sortConfig.field.startsWith("aime") ||
        sortConfig.field.startsWith("swe") ||
        sortConfig.field.startsWith("bfcl") ||
        sortConfig.field.startsWith("alder")
      ) {
        // Handle benchmark fields directly
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

    return sorted;
  }, [models, sortConfig]);

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

  const getScoreColor = (
    score: number | string | undefined | null,
    type: "cost" | "performance" | "speed"
  ) => {
    let numScore = 0;

    if (score != null && score !== undefined) {
      if (typeof score === "string") {
        numScore = parseFloat(score);
        if (isNaN(numScore)) numScore = 0;
      } else if (typeof score === "number") {
        numScore = isNaN(score) ? 0 : score;
      }
    }

    if (type === "cost") {
      // Higher cost efficiency is better (green)
      if (numScore >= 9) return "bg-green-100 text-green-800 border-green-200";
      if (numScore >= 7)
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      return "bg-red-100 text-red-800 border-red-200";
    } else {
      // Higher performance/speed is better
      if (numScore >= 8) return "bg-green-100 text-green-800 border-green-200";
      if (numScore >= 6)
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      return "bg-red-100 text-red-800 border-red-200";
    }
  };

  const formatScore = (score: number | string | undefined | null) => {
    if (score == null || score === undefined) return "0.0";

    let numScore: number;
    if (typeof score === "string") {
      numScore = parseFloat(score);
      if (isNaN(numScore)) return "0.0";
    } else if (typeof score === "number") {
      numScore = score;
      if (isNaN(numScore)) return "0.0";
    } else {
      return "0.0";
    }

    return numScore.toFixed(1);
  };

  const getBenchmarkColor = (score: number | undefined | null) => {
    const numScore = score != null && !isNaN(score) ? score : 0;

    // Special styling for missing data (0 values)
    if (numScore === 0) return "bg-gray-100 text-gray-600 border-gray-300";

    if (numScore >= 80) return "bg-green-100 text-green-800 border-green-200";
    if (numScore >= 60)
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (numScore >= 40)
      return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Model Benchmark Comparison
        </CardTitle>
        <CardDescription>
          Comprehensive comparison of all available LLM models with detailed
          benchmarks and performance metrics. Click column headers to sort. (
          {models.length} models total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                {/* Model Info */}
                <th
                  className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-2">
                    Model <SortIcon field="name" />
                  </div>
                </th>
                <th
                  className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("provider")}
                >
                  <div className="flex items-center gap-2">
                    Provider <SortIcon field="provider" />
                  </div>
                </th>

                {/* Scores */}
                <th
                  className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("cost_efficiency")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Cost <SortIcon field="cost_efficiency" />
                  </div>
                </th>
                <th
                  className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("performance_score")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Brain className="w-4 h-4" />
                    Performance <SortIcon field="performance_score" />
                  </div>
                </th>
                <th
                  className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("speed_score")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" />
                    Speed <SortIcon field="speed_score" />
                  </div>
                </th>

                {/* Detailed Costs */}
                <th
                  className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("inputCostPer1M")}
                >
                  <div className="flex items-center justify-center gap-2">
                    Input $/1M <SortIcon field="inputCostPer1M" />
                  </div>
                </th>
                <th
                  className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("outputCostPer1M")}
                >
                  <div className="flex items-center justify-center gap-2">
                    Output $/1M <SortIcon field="outputCostPer1M" />
                  </div>
                </th>

                {/* Speed Metrics */}
                <th
                  className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("tokensPerSecond")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    Tokens/sec <SortIcon field="tokensPerSecond" />
                  </div>
                </th>
                <th
                  className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("timeToFirstToken")}
                >
                  <div className="flex items-center justify-center gap-2">
                    TTFT (sec) <SortIcon field="timeToFirstToken" />
                  </div>
                </th>

                {/* Benchmarks */}
                <th
                  className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("gpqaDiamond")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Calculator className="w-4 h-4" />
                    GPQA <SortIcon field="gpqaDiamond" />
                  </div>
                </th>
                <th
                  className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("aime2024")}
                >
                  <div className="flex items-center justify-center gap-2">
                    AIME <SortIcon field="aime2024" />
                  </div>
                </th>
                <th
                  className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("sweBench")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Code className="w-4 h-4" />
                    SWE-Bench <SortIcon field="sweBench" />
                  </div>
                </th>
                <th
                  className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("bfcl")}
                >
                  <div className="flex items-center justify-center gap-2">
                    BFCL <SortIcon field="bfcl" />
                  </div>
                </th>
                <th
                  className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("alderPolyglot")}
                >
                  <div className="flex items-center justify-center gap-2">
                    Alder <SortIcon field="alderPolyglot" />
                  </div>
                </th>

                {/* Context Length */}
                <th
                  className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("contextLength")}
                >
                  <div className="flex items-center justify-center gap-2">
                    Context <SortIcon field="contextLength" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedModels.map(model => {
                const isHighlighted = model.name === highlightedModel;
                return (
                  <tr
                    key={model.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      isHighlighted
                        ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"
                        : ""
                    }`}
                  >
                    {/* Model Info */}
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {model.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {model.description}
                      </div>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3">
                      <Badge variant="outline">{model.provider}</Badge>
                    </td>

                    {/* Scores */}
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center">
                      <Badge
                        className={getScoreColor(model.cost_efficiency, "cost")}
                      >
                        {formatScore(model.cost_efficiency)}/10
                      </Badge>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center">
                      <Badge
                        className={getScoreColor(
                          model.performance_score,
                          "performance"
                        )}
                      >
                        {formatScore(model.performance_score)}/10
                      </Badge>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center">
                      <Badge
                        className={getScoreColor(model.speed_score, "speed")}
                      >
                        {formatScore(model.speed_score)}/10
                      </Badge>
                    </td>

                    {/* Detailed Costs */}
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center">
                      <span className="text-sm">
                        ${model.inputCostPer1M || 0}
                      </span>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center">
                      <span className="text-sm">
                        ${model.outputCostPer1M || 0}
                      </span>
                    </td>

                    {/* Speed Metrics */}
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center">
                      <span className="text-sm">
                        {model.tokensPerSecond || 0}
                      </span>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center">
                      <span className="text-sm">
                        {model.timeToFirstToken || 0}s
                      </span>
                    </td>

                    {/* Benchmarks */}
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center">
                      <Badge
                        className={getBenchmarkColor(
                          model.benchmarks?.gpqaDiamond
                        )}
                      >
                        {model.benchmarks?.gpqaDiamond
                          ? `${model.benchmarks.gpqaDiamond}%`
                          : "N/A"}
                      </Badge>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center">
                      <Badge
                        className={getBenchmarkColor(
                          model.benchmarks?.aime2024
                        )}
                      >
                        {model.benchmarks?.aime2024
                          ? `${model.benchmarks.aime2024}%`
                          : "N/A"}
                      </Badge>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center">
                      <Badge
                        className={getBenchmarkColor(
                          model.benchmarks?.sweBench
                        )}
                      >
                        {model.benchmarks?.sweBench
                          ? `${model.benchmarks.sweBench}%`
                          : "N/A"}
                      </Badge>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center">
                      <Badge
                        className={getBenchmarkColor(model.benchmarks?.bfcl)}
                      >
                        {model.benchmarks?.bfcl
                          ? `${model.benchmarks.bfcl}%`
                          : "N/A"}
                      </Badge>
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center">
                      <Badge
                        className={getBenchmarkColor(
                          model.benchmarks?.alderPolyglot
                        )}
                      >
                        {model.benchmarks?.alderPolyglot
                          ? `${model.benchmarks.alderPolyglot}%`
                          : "N/A"}
                      </Badge>
                    </td>

                    {/* Context Length */}
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center">
                      <span className="text-sm">
                        {(model.contextLength || 0).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium mb-2">Benchmark Explanations:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <strong>GPQA:</strong> Graduate-level science questions
            </div>
            <div>
              <strong>AIME:</strong> Advanced mathematics competition
            </div>
            <div>
              <strong>SWE-Bench:</strong> Software engineering tasks
            </div>
            <div>
              <strong>BFCL:</strong> Berkeley function calling leaderboard
            </div>
            <div>
              <strong>Alder:</strong> Multilingual reasoning tasks
            </div>
            <div>
              <strong>TTFT:</strong> Time to first token response
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
