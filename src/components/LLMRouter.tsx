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
      className={`p-4 rounded-xl border transition-all duration-300 cursor-grab active:cursor-grabbing ${
        isDragging
          ? "shadow-2xl scale-105 bg-white dark:bg-slate-800 border-indigo-300 dark:border-indigo-600 z-50 rotate-2"
          : "border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-700/50 shadow-sm"
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-3">
        <div className="text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-full w-6 h-6 flex items-center justify-center">
          {index + 1}
        </div>
        <div className={`p-2 rounded-lg ${priority.bgColor} shadow-sm`}>
          <priority.icon className={`h-4 w-4 ${priority.color}`} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            {priority.name}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Weight: {3 - index}x multiplier
          </div>
        </div>
        <GripVertical className="h-4 w-4 text-slate-400 dark:text-slate-500" />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header Bar */}
      <div className="border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse shadow-sm" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-500 bg-clip-text text-transparent">
                  LLM Router
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Intelligent AI Model Selection
                </p>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
            <a 
              href="/analysis" 
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
            >
              Model Analysis →
            </a>
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
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => backgroundRefresh()}
                disabled={status === "loading"}
                className="h-8 px-3 text-xs border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Sync
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-89px)]">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Prompt Input Area */}
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto min-h-full">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-lg">
                    <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Chat Prompt
                  </h2>
                </div>
                <p className="text-slate-600 dark:text-slate-400 ml-12">
                  Describe your task to receive intelligent model recommendations
                </p>
              </div>
              
              <div className="relative mb-8">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Enter your prompt here... e.g., 'Analyze quarterly financial data and provide strategic insights' or 'Generate creative marketing copy for a tech startup'"
                  className="w-full h-72 p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/20 resize-none transition-all duration-300 text-base leading-relaxed shadow-sm hover:shadow-md"
                />
                <div className="absolute bottom-6 right-6 flex items-center gap-2">
                  <span className="text-sm text-slate-400 dark:text-slate-500 font-mono">
                    {prompt.length}/2000
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                <Button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isAnalyzing}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 animate-spin" />
                      <span>AI Analysis in Progress...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Send className="h-5 w-5" />
                      <span>Run Analysis</span>
                    </div>
                  )}
                </Button>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono border">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono border">Enter</kbd>
                  <span>to run</span>
                </div>
              </div>

              {/* Model Recommendation */}
              {recommendedModel && (
                <div className="mb-8">
                  <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-emerald-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 rounded-2xl p-8 shadow-xl backdrop-blur-sm">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-xl shadow-sm">
                          <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                            Recommended Model
                          </h3>
                          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                            ✨ AI analysis + deterministic scoring
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                          {Math.round(calculateScore(recommendedModel) * 10)}%
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Match Score</div>
                      </div>
                    </div>
                    
                    <div className="mb-6 p-6 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-white/60 dark:border-slate-700/60">
                      <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {recommendedModel.name}
                      </h4>
                      <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-lg mb-3">
                        by {recommendedModel.provider}
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {recommendedModel.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg w-fit mx-auto mb-3">
                          <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Cost Efficiency</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {recommendedModel.costScore}/10
                        </div>
                      </div>
                      <div className="text-center p-4 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg w-fit mx-auto mb-3">
                          <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Performance</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {recommendedModel.performanceScore}/10
                        </div>
                      </div>
                      <div className="text-center p-4 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg w-fit mx-auto mb-3">
                          <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Response Speed</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {recommendedModel.speedScore}/10
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
        <div className="w-[400px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-8">
              {/* Run Settings */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-lg">
                    <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Run Settings
                  </h3>
                </div>
                
                {/* Priority Settings */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Priority Ranking
                    </Label>
                    <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
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
                              className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 shadow-sm hover:shadow-md transition-all"
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
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Quick Stats
                      </h3>
                    </div>
                    <a 
                      href="/analysis" 
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors whitespace-nowrap"
                    >
                      View Full Analysis →
                    </a>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Total Models</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">{data.models.length}</div>
                      </div>
                      <div className="p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Providers</div>
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
                            className={`p-3 rounded-lg border transition-all ${
                              recommendedModel?.name === model.name 
                                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" 
                                : "bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                  index === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400" :
                                  index === 1 ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" :
                                  "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400"
                                }`}>
                                  {index + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
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
