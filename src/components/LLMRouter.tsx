"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Brain,
  Zap,
  DollarSign,
  Clock,
  Send,
  Sparkles,
  Settings,
  TrendingUp,
  Star,
  CheckCircle,
  BarChart3,
  Shield,
  GripVertical,
  Trophy,
  Medal,
  Award,
  Loader2,
  Database,
  Globe,
} from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { BenchmarkTable } from "@/components/BenchmarkTable";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { GoogleGenAI } from "@google/genai";

interface LLMModel {
  id: string;
  name: string;
  provider: string;
  costScore: number; // 1-10 (10 = most cost effective)
  performanceScore: number; // 1-10 (10 = best performance)
  speedScore: number; // 1-10 (10 = fastest)
  description: string;
}

interface PriorityItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// Build candidate models from live leaderboard data
const toFixedRange = (n: number, min = 1, max = 10) => {
  if (!isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
};

const priorityItems: PriorityItem[] = [
  {
    id: "cost",
    name: "Cost Efficiency",
    icon: DollarSign,
    description: "Optimize for budget and cost-effectiveness",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    borderColor: "border-emerald-200 dark:border-emerald-700/50",
  },
  {
    id: "performance",
    name: "Performance Quality",
    icon: Zap,
    description: "Prioritize accuracy and capability",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-700/50",
  },
  {
    id: "speed",
    name: "Response Speed",
    icon: Clock,
    description: "Minimize latency and response time",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-700/50",
  },
];

function SortableItem({
  priority,
  index,
}: {
  priority: PriorityItem;
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: priority.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityRank = (index: number) => {
    switch (index) {
      case 0:
        return {
          icon: Trophy,
          label: "High",
          color: "text-yellow-600 dark:text-yellow-400",
        };
      case 1:
        return {
          icon: Medal,
          label: "Medium",
          color: "text-gray-600 dark:text-gray-400",
        };
      case 2:
        return {
          icon: Award,
          label: "Low",
          color: "text-orange-600 dark:text-orange-400",
        };
      default:
        return { icon: Award, label: "Low", color: "text-gray-500" };
    }
  };

  const rank = getPriorityRank(index);
  const RankIcon = rank.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group p-4 rounded-xl border transition-all duration-300 cursor-grab active:cursor-grabbing ${
        isDragging
          ? "shadow-xl scale-105 bg-white dark:bg-slate-800 border-indigo-400 dark:border-indigo-500 z-50 rotate-1 ring-2 ring-indigo-100 dark:ring-indigo-900/50"
          : "border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/90 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600/50 shadow-sm hover:-translate-y-0.5"
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-3">
        <div className="text-sm font-bold text-slate-500 dark:text-slate-400 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
          {index + 1}
        </div>
        <div className={`p-2 rounded-lg ${priority.bgColor} shadow-sm group-hover:scale-105 transition-transform duration-300`}>
          <priority.icon className={`h-4 w-4 ${priority.color}`} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            {priority.name}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Weight: {3 - index}x multiplier
          </div>
        </div>
        <GripVertical className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
      </div>
    </div>
  );
}

interface LLMRouterProps {
  initialPrompt?: string;
  initialPriorities?: PriorityItem[];
  onPromptChange?: (prompt: string) => void;
  onPrioritiesChange?: (priorities: PriorityItem[]) => void;
}

export function LLMRouter({
  initialPrompt = "",
  initialPriorities = priorityItems,
  onPromptChange,
  onPrioritiesChange,
}: LLMRouterProps = {}) {
  const [prompt, setPromptInternal] = useState(initialPrompt);
  const [priorities, setPrioritiesInternal] =
    useState<PriorityItem[]>(initialPriorities);
  const [isClient, setIsClient] = useState(false);

  // Sync external prompt changes
  useEffect(() => {
    if (initialPrompt !== undefined) {
      setPromptInternal(initialPrompt);
    }
  }, [initialPrompt]);

  // Sync external priority changes
  useEffect(() => {
    if (initialPriorities !== undefined) {
      setPrioritiesInternal(initialPriorities);
    }
  }, [initialPriorities]);

  // Ensure client-side rendering for drag and drop
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle prompt changes
  const setPrompt = (newPrompt: string) => {
    setPromptInternal(newPrompt);
    onPromptChange?.(newPrompt);
  };

  // Handle priority changes
  const setPriorities = (newPriorities: PriorityItem[]) => {
    setPrioritiesInternal(newPriorities);
    onPrioritiesChange?.(newPriorities);
  };
  
  const [recommendedModel, setRecommendedModel] = useState<LLMModel | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { status, data, error, meta, refresh, backgroundRefresh } =
    useLeaderboard();

  const headerSubtitle = useMemo(() => {
    if (status === "loading") return "Fetching latest leaderboard…";
    if (status === "error") return "Failed to load leaderboard";
    if (meta?.cached)
      return `Cached snapshot • ${meta?.source} • ${new Date(meta.scrapedAt).toLocaleString()}`;
    if (data)
      return `Live snapshot • ${meta?.source} • ${new Date(meta?.scrapedAt || data.lastScraped).toLocaleString()}`;
    return "Real-time Analysis";
  }, [status, data, meta]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const calculateScore = (model: LLMModel) => {
    // Calculate weights based on priority order (higher priority = higher weight)
    const weights = priorities.reduce(
      (acc, priority, index) => {
        // First priority gets weight 3, second gets 2, third gets 1
        const weight = 3 - index;
        acc[priority.id] = weight;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalWeight = Object.values(weights).reduce(
      (sum, weight) => sum + weight,
      0
    );

    return (
      (model.costScore * (weights.cost || 0) +
        model.performanceScore * (weights.performance || 0) +
        model.speedScore * (weights.speed || 0)) /
      totalWeight
    );
  };

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = priorities.findIndex(
        (item: PriorityItem) => item.id === active.id
      );
      const newIndex = priorities.findIndex(
        (item: PriorityItem) => item.id === over.id
      );
      const newPriorities = arrayMove(priorities, oldIndex, newIndex);
      setPriorities(newPriorities);
    }
  }

  const findBestModel = async () => {
    setIsAnalyzing(true);
    toast({
      title: "Analysis Started",
      description: "AI task analysis + deterministic scoring in progress...",
    });

    try {
      const res = await fetch("/api/hybrid-select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          priorities,
          models: data?.models || [],
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || "Selection failed");

      // Use the deterministic selection result
      const selectedModel = result.selectedModel;
      const score = result.score;
      const breakdown = result.breakdown;
      const recommendedModelName = result.recommendedModelName || selectedModel?.name || "Unknown";
      console.log("🎯 Deterministically selected:", selectedModel.name);
      console.log("📊 Score breakdown:", breakdown);

      // Set the recommended model using the hybrid result
      if (selectedModel) {
        // Use hybrid selection result
        setRecommendedModel({
          id: selectedModel.name,
          name: selectedModel.name,
          provider: selectedModel.provider || "AI Provider",
          costScore: breakdown.costScore,
          performanceScore: breakdown.performanceScore,
          speedScore: breakdown.speedScore,
          description:
            selectedModel.description ||
            `${selectedModel.name} selected via AI task analysis + deterministic scoring.`,
        });

        toast({
          title: "Hybrid Analysis Complete! 🎉",
          description: `Selected: ${selectedModel.name} (Score: ${score.toFixed(1)}/10)`,
        });
      } else {
        // Model not found - this shouldn't happen with improved prompting
        console.error(
          "❌ Gemini recommended unavailable model:",
          recommendedModelName
        );
        console.log(
          "📋 Available models:",
          data?.models?.map(m => m.name)
        );

        // Instead of fallback, force selection of best available model based on priorities
        const bestAvailableModel = data?.models?.[0]; // Fallback to first available model

        if (bestAvailableModel) {
          setRecommendedModel({
            id: bestAvailableModel.name,
            name: bestAvailableModel.name,
            provider: bestAvailableModel.provider || "AI Provider",
            costScore: toFixedRange(
              Number(bestAvailableModel.cost_efficiency) || 5
            ),
            performanceScore: toFixedRange(
              Number(bestAvailableModel.performance_score) || 5
            ),
            speedScore: toFixedRange(
              Number(bestAvailableModel.speed_score) || 5
            ),
            description: `${bestAvailableModel.name} selected as fallback. Gemini recommended "${recommendedModelName}" which is not available.`,
          });

          toast({
            title: "⚠️ Fallback Model Selected",
            description: `Recommended model "${recommendedModelName}" not available. Using ${bestAvailableModel.name} instead.`,
            variant: "destructive",
          });
        } else {
          throw new Error("No models available in leaderboard data");
        }
      }
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    if (prompt.trim()) {
      findBestModel();
    }
  };

  // Loading Screen Component
  if (status === "loading" || (!data && status !== "error")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 dark:from-slate-950 dark:via-slate-900/90 dark:to-slate-950 flex items-center justify-center">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-grid-slate-100/20 dark:bg-grid-slate-800/10 [mask-image:radial-gradient(ellipse_at_center,white,rgba(255,255,255,0.3))] dark:[mask-image:radial-gradient(ellipse_at_center,rgba(255,255,255,0.1),transparent)]" />
        
        {/* Floating background elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-indigo-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 text-center max-w-md mx-auto px-6">
          {/* Main Loading Card */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-10 shadow-2xl">
            {/* Logo and Brand */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 rounded-2xl shadow-lg ring-1 ring-white/20">
                  <Brain className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse shadow-lg ring-2 ring-white dark:ring-slate-900" />
              </div>
            </div>

            {/* Loading Animation */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Loader2 className="h-12 w-12 text-indigo-600 dark:text-indigo-400 animate-spin" />
                <div className="absolute inset-0 rounded-full border-2 border-indigo-200 dark:border-indigo-800 animate-pulse"></div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300 bg-clip-text text-transparent mb-4">
              LLM Router
            </h1>

            {/* Loading Message */}
            <div className="space-y-3 mb-8">
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                Initializing AI Environment
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Fetching latest model leaderboard data...
              </p>
            </div>

            {/* Progress Indicators */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-slate-700 dark:text-slate-300">Scraping model data</span>
                </div>
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                  <div className="h-2 w-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-slate-700 dark:text-slate-300">Processing benchmarks</span>
                </div>
                <div className="h-2 w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse w-3/4"></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-slate-700 dark:text-slate-300">Preparing interface</span>
                </div>
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>

            {/* Estimated time */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This usually takes 10-30 seconds...
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-xs text-slate-500 dark:text-slate-400">
            <p>Loading 60+ curated prompts and live model data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 dark:from-slate-950 dark:via-slate-900/90 dark:to-slate-950">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-grid-slate-100/20 dark:bg-grid-slate-800/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.3),transparent)] dark:[mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.05),transparent)]" />
      
      {/* Header Bar */}
      <div className="relative border-b border-slate-200/50 dark:border-slate-800/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 rounded-2xl shadow-lg ring-1 ring-white/20">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse shadow-lg ring-2 ring-white dark:ring-slate-900" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300 bg-clip-text text-transparent">
                  LLM Router
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Intelligent AI Model Selection
                </p>
              </div>
            </div>
            <div className="h-10 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
            <a 
              href="/analysis" 
              className="group flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 font-medium px-3 py-2 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
            >
              <span>Model Analysis</span>
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <div className="relative h-2.5 w-2.5">
                <div className="absolute inset-0 bg-emerald-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                {headerSubtitle}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refresh(false)}
                disabled={!data}
                className="h-9 px-4 text-sm border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 shadow-sm"
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => backgroundRefresh()}
                disabled={!data}
                className="h-9 px-4 text-sm border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 shadow-sm"
              >
                Sync
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-97px)]">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Prompt Input Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto min-h-full flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-100 via-purple-100 to-indigo-100 dark:from-indigo-900/40 dark:via-purple-900/40 dark:to-indigo-900/40 rounded-lg shadow-sm ring-1 ring-indigo-200/50 dark:ring-indigo-800/30">
                    <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Chat Prompt
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Describe your task to receive intelligent model recommendations
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="relative mb-6 flex-1">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-xl blur opacity-20 dark:opacity-30"></div>
                <div className="relative h-full">
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Enter your prompt here... e.g., 'Analyze quarterly financial data and provide strategic insights' or 'Generate creative marketing copy for a tech startup'"
                    className="w-full h-56 p-5 bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/20 resize-none transition-all duration-300 text-base leading-relaxed shadow-lg hover:shadow-xl backdrop-blur-sm"
                  />
                  <div className="absolute bottom-4 right-5 flex items-center gap-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono bg-slate-100/80 dark:bg-slate-800/80 px-2 py-1 rounded-md">
                      {prompt.length}/2000
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <Button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isAnalyzing}
                  className="group bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-base ring-1 ring-white/20"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 animate-spin" />
                      <span>AI Analysis in Progress...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                      <span>Run Analysis</span>
                    </div>
                  )}
                </Button>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono border border-slate-200 dark:border-slate-700 shadow-sm">Ctrl</kbd>
                    <span className="text-slate-400">+</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono border border-slate-200 dark:border-slate-700 shadow-sm">Enter</kbd>
                  </div>
                  <span className="text-slate-400">to run</span>
                </div>
              </div>

              {/* Model Recommendation */}
              {recommendedModel && (
                <div className="mb-6">
                  <div className="relative">
                    {/* Animated background gradient */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400 rounded-2xl blur-sm opacity-30 animate-pulse"></div>
                    
                    <div className="relative bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-emerald-50/90 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-emerald-100 via-teal-100 to-emerald-100 dark:from-emerald-900/60 dark:via-teal-900/60 dark:to-emerald-900/60 rounded-xl shadow-sm ring-1 ring-emerald-200/50 dark:ring-emerald-800/40">
                            <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                              Recommended Model
                            </h3>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                                AI analysis + deterministic scoring complete
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-400 dark:via-teal-400 dark:to-emerald-300 bg-clip-text text-transparent">
                            {Math.round(calculateScore(recommendedModel) * 10)}%
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Match Score</div>
                        </div>
                      </div>
                      
                      <div className="mb-5 p-5 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-white/80 dark:border-slate-700/80 shadow-sm backdrop-blur-sm">
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                          {recommendedModel.name}
                        </h4>
                        <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-base mb-3">
                          by {recommendedModel.provider}
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                          {recommendedModel.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="group text-center p-4 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 rounded-xl w-fit mx-auto mb-3 group-hover:scale-105 transition-transform duration-300">
                            <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Cost Efficiency</div>
                          <div className="text-xl font-bold text-slate-900 dark:text-white">
                            {recommendedModel.costScore}/10
                          </div>
                        </div>
                        <div className="group text-center p-4 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                          <div className="p-2 bg-amber-100 dark:bg-amber-900/60 rounded-xl w-fit mx-auto mb-3 group-hover:scale-105 transition-transform duration-300">
                            <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Performance</div>
                          <div className="text-xl font-bold text-slate-900 dark:text-white">
                            {recommendedModel.performanceScore}/10
                          </div>
                        </div>
                        <div className="group text-center p-4 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/60 rounded-xl w-fit mx-auto mb-3 group-hover:scale-105 transition-transform duration-300">
                            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Response Speed</div>
                          <div className="text-xl font-bold text-slate-900 dark:text-white">
                            {recommendedModel.speedScore}/10
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[380px] border-l border-slate-200/50 dark:border-slate-800/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col min-h-0 shadow-xl">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Run Settings */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-lg shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                    <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Run Settings
                  </h3>
                </div>
                
                {/* Priority Settings */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Priority Ranking
                    </Label>
                    <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                      Drag to reorder
                    </div>
                  </div>
                  
                  <div suppressHydrationWarning>
                    {isClient ? (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={priorities}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3">
                            {priorities.map((priority, index) => (
                              <SortableItem
                                key={priority.id}
                                priority={priority}
                                index={index}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    ) : (
                      <div className="space-y-3">
                        {priorities.map((priority, index) => {
                          const Icon = priority.icon;
                          return (
                            <div
                              key={priority.id}
                              className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 shadow-sm hover:shadow-lg transition-all duration-300"
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-full w-6 h-6 flex items-center justify-center">
                                  {index + 1}
                                </div>
                                <div className={`p-2 rounded-lg ${priority.bgColor} shadow-sm`}>
                                  <Icon className={`h-4 w-4 ${priority.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                    {priority.name}
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Weight: {3 - index}x multiplier
                                  </div>
                                </div>
                                <GripVertical className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Model Overview */}
              {data?.models && data.models.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-100 via-indigo-100 to-blue-100 dark:from-blue-900/50 dark:via-indigo-900/50 dark:to-blue-900/50 rounded-lg shadow-sm ring-1 ring-blue-200/50 dark:ring-blue-800/30">
                        <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Quick Stats
                      </h3>
                    </div>
                    <a 
                      href="/analysis" 
                      className="group text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors whitespace-nowrap flex items-center gap-1"
                    >
                      <span>View Full Analysis</span>
                      <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Total Models</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">{data.models.length}</div>
                      </div>
                      <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Providers</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                          {new Set(data.models.map(m => m.provider).filter(Boolean)).size}
                        </div>
                      </div>
                    </div>
                    
                    {/* Top 3 Models Preview */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Top Models
                      </h4>
                      <div className="space-y-2">
                        {data.models.slice(0, 3).map((model, index) => (
                          <div 
                            key={model.name}
                            className={`group p-3 rounded-xl border transition-all duration-300 hover:shadow-lg ${
                              recommendedModel?.name === model.name 
                                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-200 dark:ring-emerald-800" 
                                : "bg-white/80 dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                  index === 0 ? "bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400" :
                                  index === 1 ? "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400" :
                                  "bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400"
                                }`}>
                                  {index + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {model.name}
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {model.provider}
                                  </div>
                                </div>
                              </div>
                              {recommendedModel?.name === model.name && (
                                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-2" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
