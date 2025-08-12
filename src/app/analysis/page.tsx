"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Brain,
  BarChart3,
  TrendingUp,
  Trophy,
  Zap,
  DollarSign,
  Clock,
  Shield,
  Star,
  RefreshCw,
  Download,
  Filter,
  Search,
} from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { BenchmarkTable } from "@/components/BenchmarkTable";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import Link from "next/link";

export default function ModelAnalysisPage() {
  const { status, data, error, meta, refresh, backgroundRefresh } = useLeaderboard();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("all");

  const headerSubtitle = useMemo(() => {
    if (status === "loading") return "Fetching latest leaderboard…";
    if (status === "error") return "Failed to load leaderboard";
    if (meta?.cached)
      return `Cached snapshot • ${meta?.source} • ${new Date(meta.scrapedAt).toLocaleString()}`;
    if (data)
      return `Live snapshot • ${meta?.source} • ${new Date(meta?.scrapedAt || data.lastScraped).toLocaleString()}`;
    return "Real-time Analysis";
  }, [status, data, meta]);

  const filteredModels = useMemo(() => {
    if (!data?.models) return [];
    
    return data.models.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (model.provider || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProvider = selectedProvider === "all" || model.provider === selectedProvider;
      return matchesSearch && matchesProvider;
    });
  }, [data?.models, searchTerm, selectedProvider]);

  const providers = useMemo(() => {
    if (!data?.models) return [];
    const providerSet = new Set(data.models.map(model => model.provider).filter(Boolean));
    return Array.from(providerSet).sort();
  }, [data?.models]);

  const stats = useMemo(() => {
    if (!data?.models) return { total: 0, providers: 0, avgCost: 0, avgPerformance: 0 };
    
    const models = data.models;
    const totalModels = models.length;
    const uniqueProviders = new Set(models.map(m => m.provider).filter(Boolean)).size;
    const avgCost = models.reduce((acc, m) => acc + (Number(m.cost_efficiency) || 0), 0) / totalModels;
    const avgPerformance = models.reduce((acc, m) => acc + (Number(m.performance_score) || 0), 0) / totalModels;
    
    return {
      total: totalModels,
      providers: uniqueProviders,
      avgCost: avgCost.toFixed(1),
      avgPerformance: avgPerformance.toFixed(1)
    };
  }, [data?.models]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header Bar */}
      <div className="border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="relative">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse shadow-sm" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-500 bg-clip-text text-transparent">
                  Model Analysis
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Comprehensive AI Model Benchmarks
                </p>
              </div>
            </Link>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
            <Link 
              href="/" 
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
            >
              ← Back to Router
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {headerSubtitle}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refresh(false)}
                disabled={status === "loading"}
                className="h-8 px-3 text-xs border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => backgroundRefresh()}
                disabled={status === "loading"}
                className="h-8 px-3 text-xs border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download className="h-3 w-3 mr-1" />
                Sync
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container items-center mx-auto px-6 py-8 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Models</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                  <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Providers</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.providers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 shadow-sm mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-3">
              <Filter className="h-5 w-5" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search models or providers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20"
                />
              </div>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20"
              >
                <option value="all">All Providers</option>
                {providers.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Showing {filteredModels.length} of {data?.models?.length || 0} models
            </div>
          </CardContent>
        </Card>

        {/* Analysis Tables */}
        <div className="space-y-8">
          {/* Detailed Benchmark Table */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-slate-900 dark:text-white flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                Comprehensive Model Benchmarks
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Detailed performance metrics and comparison across all available models
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {filteredModels.length > 0 ? (
                <BenchmarkTable models={filteredModels} />
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  {status === "loading" ? "Loading models..." : "No models found matching your filters."}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Leaderboard */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-slate-900 dark:text-white flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-900/50 rounded-lg">
                  <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                Performance Leaderboard
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Quick overview and ranking of model performance
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {filteredModels.length > 0 ? (
                <LeaderboardTable models={filteredModels} />
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  {status === "loading" ? "Loading leaderboard..." : "No models found matching your filters."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {status === "error" && (
          <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/60 shadow-sm">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
                  Failed to Load Model Data
                </div>
                <div className="text-red-500 dark:text-red-300 text-sm mb-4">
                  {error}
                </div>
                <Button 
                  onClick={() => refresh(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
