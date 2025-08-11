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
          label: "Highest Priority",
          color: "text-yellow-600 dark:text-yellow-400",
        };
      case 1:
        return {
          icon: Medal,
          label: "Medium Priority",
          color: "text-gray-600 dark:text-gray-400",
        };
      case 2:
        return {
          icon: Award,
          label: "Lowest Priority",
          color: "text-orange-600 dark:text-orange-400",
        };
      default:
        return { icon: Award, label: "Low Priority", color: "text-gray-500" };
    }
  };

  const rank = getPriorityRank(index);
  const RankIcon = rank.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-grab active:cursor-grabbing ${
        isDragging
          ? "shadow-2xl scale-105 bg-white dark:bg-slate-800 border-indigo-300 dark:border-indigo-600 z-50"
          : `${priority.bgColor} ${priority.borderColor} hover:shadow-lg hover:scale-[1.02]`
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <GripVertical className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          <div className={`p-2 rounded-lg ${priority.bgColor}`}>
            <priority.icon className={`h-5 w-5 ${priority.color}`} />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              {priority.name}
            </h3>
            <div className="flex items-center gap-1">
              <RankIcon className={`h-4 w-4 ${rank.color}`} />
              <span className={`text-xs font-medium ${rank.color}`}>
                #{index + 1}
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {priority.description}
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Rank
          </div>
          <div className={`text-sm font-bold ${rank.color}`}>{rank.label}</div>
        </div>
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
      description: "Evaluating AI models based on your priorities...",
    });

    try {
      const res = await fetch("/api/gemini-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          priorities,
          models: data?.models || [],
        }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      // Find the actual model data from leaderboard
      const recommendedModelName = result.result.trim();

      // More robust model matching
      const foundModel = data?.models?.find(model => {
        const modelNameLower = model.name.toLowerCase();
        const recommendedLower = recommendedModelName.toLowerCase();

        // Exact match
        if (modelNameLower === recommendedLower) return true;

        // Contains match (either direction)
        if (
          modelNameLower.includes(recommendedLower) ||
          recommendedLower.includes(modelNameLower)
        )
          return true;

        // Remove common prefixes/suffixes and try again
        const cleanModel = modelNameLower.replace(
          /(gpt-|claude-|gemini-|llama-)/g,
          ""
        );
        const cleanRecommended = recommendedLower.replace(
          /(gpt-|claude-|gemini-|llama-)/g,
          ""
        );
        if (
          cleanModel.includes(cleanRecommended) ||
          cleanRecommended.includes(cleanModel)
        )
          return true;

        return false;
      });

      if (foundModel) {
        // Use actual model data with real scores
        setRecommendedModel({
          id: foundModel.name,
          name: foundModel.name,
          provider: foundModel.provider || "AI Provider",
          costScore: toFixedRange(Number(foundModel.cost_efficiency) || 5),
          performanceScore: toFixedRange(
            Number(foundModel.performance_score) || 5
          ),
          speedScore: toFixedRange(Number(foundModel.speed_score) || 5),
          description:
            foundModel.description ||
            `${foundModel.name} recommended by Gemini analysis based on your prompt and priorities.`,
        });

        toast({
          title: "Analysis Complete! 🎉",
          description: `Recommended: ${foundModel.name} (${foundModel.provider})`,
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
    <div className="w-full">
      <div className="container mx-auto px-4 py-8 max-w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <Brain className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              LLM Router
            </h1>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Intelligent AI model selection powered by your priorities. Get
            personalized recommendations for cost, performance, and speed
            optimization.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Shield className="h-4 w-4" />
              Enterprise Ready
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <BarChart3 className="h-4 w-4" />
              {headerSubtitle}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Star className="h-4 w-4" />
              6+ AI Models
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Prompt Input Section */}
          <div className="space-y-8">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  Your Prompt
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-lg">
                  Describe your task to receive intelligent model
                  recommendations tailored to your needs.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-6">
                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder="Enter your prompt here... e.g., 'Analyze quarterly financial data and provide strategic insights' or 'Generate creative marketing copy for a tech startup'"
                      className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 resize-none transition-all duration-200 text-base leading-relaxed"
                    />
                    <div className="absolute bottom-4 right-4 text-sm text-slate-400 dark:text-slate-500">
                      {prompt.length}/2000
                    </div>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={!prompt.trim() || isAnalyzing}
                    className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="flex items-center gap-3">
                          <Sparkles className="h-5 w-5 animate-spin" />
                          <span>Analyzing your requirements...</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-3" />
                        Find Optimal Model
                      </>
                    )}
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => refresh(false)}
                      disabled={status === "loading"}
                    >
                      Refresh
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => refresh(true)}
                      disabled={status === "loading"}
                    >
                      Force Fresh
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => backgroundRefresh()}
                      disabled={status === "loading"}
                    >
                      Background Refresh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Model Recommendation */}
            {recommendedModel && (
              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-700/50 shadow-xl animate-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="pb-4">
                  <CardTitle className="text-slate-900 dark:text-white flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    Recommended Model
                    <div className="ml-auto">
                      <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl p-6 border border-emerald-200/50 dark:border-emerald-700/50">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                          {recommendedModel.name}
                        </h3>
                        <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-lg mb-3">
                          by {recommendedModel.provider}
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                          {recommendedModel.description}
                        </p>
                      </div>
                      <div className="text-right ml-6">
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Match Score
                        </div>
                        <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                          {Math.round(calculateScore(recommendedModel) * 10)}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <DollarSign className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Cost Efficiency
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {recommendedModel.costScore}/10
                        </div>
                      </div>
                      <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <Zap className="h-8 w-8 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Performance
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {recommendedModel.performanceScore}/10
                        </div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Response Speed
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {recommendedModel.speedScore}/10
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Live Leaderboard */}
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  LLM Leaderboard
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">
                  {status === "loading" && "Loading models…"}
                  {status === "error" && (
                    <span className="text-red-500">{error}</span>
                  )}
                  {status === "success" && meta && (
                    <span>
                      {meta.modelCount} models • {meta.source} •{" "}
                      {new Date(meta.scrapedAt).toLocaleString()}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {data?.models && data.models.length > 0 && (
                  <LeaderboardTable models={data.models} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Priority Settings */}
          <div className="space-y-8">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  Priority Ranking
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Drag and drop to reorder priorities from most important (top)
                  to least important (bottom).
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <GripVertical className="h-4 w-4" />
                    <span className="font-medium">Tip:</span> Hold and drag the
                    grip icon to reorder priorities
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
                    // Server-side fallback without drag functionality
                    <div className="space-y-3">
                      {priorities.map((priority, index) => {
                        const position = index + 1;
                        const emoji =
                          position === 1 ? "🥇" : position === 2 ? "🥈" : "🥉";
                        const Icon = priority.icon;
                        return (
                          <div
                            key={priority.id}
                            className={`p-4 rounded-lg border-2 ${priority.borderColor} ${priority.bgColor} transition-all duration-200`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                                  <span className="text-lg">{emoji}</span>
                                  <span>#{position}</span>
                                </div>
                                <div
                                  className={`p-2 rounded-lg ${priority.color}`}
                                >
                                  <Icon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-slate-900 dark:text-white">
                                    {priority.name}
                                  </h3>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {priority.description}
                                  </p>
                                </div>
                              </div>
                              <GripVertical className="h-5 w-5 text-slate-400" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-600">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    Current Priority Order:
                  </h4>
                  <div className="space-y-1">
                    {priorities.map((priority, index) => {
                      const weight = 3 - index;
                      return (
                        <div
                          key={priority.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-slate-600 dark:text-slate-400">
                            {index + 1}. {priority.name}
                          </span>
                          <span
                            className={`font-medium ${
                              index === 0
                                ? "text-green-600 dark:text-green-400"
                                : index === 1
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-orange-600 dark:text-orange-400"
                            }`}
                          >
                            Weight: {weight}x
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
