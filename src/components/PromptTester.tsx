"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TestTube,
  Zap,
  DollarSign,
  Brain,
  Copy,
  CheckCircle,
} from "lucide-react";
import testPrompts from "../../test-prompts.json";

interface PromptTesterProps {
  onPromptSelect: (prompt: string) => void;
  onPrioritySelect: (priorities: string[]) => void;
}

export function PromptTester({
  onPromptSelect,
  onPrioritySelect,
}: PromptTesterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedScenario, setSelectedScenario] = useState<string>("balanced");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const allPrompts = Object.entries(testPrompts.testPrompts).flatMap(
    ([category, prompts]) => prompts.map(prompt => ({ ...prompt, category }))
  );

  const filteredPrompts =
    selectedCategory === "all"
      ? allPrompts
      : allPrompts.filter(prompt => prompt.category === selectedCategory);

  const handlePromptSelect = (prompt: any) => {
    onPromptSelect(prompt.prompt);

    // Auto-apply priority scenario if it's a priority test
    if ("priorityTest" in prompt && prompt.priorityTest) {
      const scenario = testPrompts.priorityTestScenarios.find(s =>
        s.name.toLowerCase().includes(prompt.priorityTest)
      );
      if (scenario) {
        onPrioritySelect(scenario.priorities);
      }
    }
  };

  const handleScenarioSelect = (scenarioName: string) => {
    setSelectedScenario(scenarioName);
    const scenario = testPrompts.priorityTestScenarios.find(
      s => s.name === scenarioName
    );
    if (scenario) {
      onPrioritySelect(scenario.priorities);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "simple":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "complex":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "coding":
        return "💻";
      case "research":
        return "🔬";
      case "creative":
        return "🎨";
      case "business":
        return "💼";
      case "mathematical":
        return "🧮";
      case "speed":
        return "🚀";
      case "cost":
        return "💰";
      case "multilingual":
        return "🌍";
      default:
        return "📝";
    }
  };

  return (
    <div className="relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-3xl blur opacity-20"></div>
      <Card className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-2xl overflow-hidden rounded-3xl">
        <CardHeader className="pb-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/30 dark:to-pink-950/30">
          <CardTitle className="text-slate-900 dark:text-white flex items-center gap-3 text-xl">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <TestTube className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="font-bold">Prompt Tester</div>
              <div className="text-sm font-normal text-slate-600 dark:text-slate-400 mt-1">
                Quick-load test prompts to evaluate LLM Router recommendations
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Enhanced Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Category Filter
              </label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="h-11 border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200/80 dark:border-slate-700/80">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="coding">💻 Coding</SelectItem>
                  <SelectItem value="research">🔬 Research</SelectItem>
                  <SelectItem value="creative">🎨 Creative</SelectItem>
                  <SelectItem value="business">💼 Business</SelectItem>
                  <SelectItem value="mathematical">🧮 Mathematical</SelectItem>
                  <SelectItem value="speed">🚀 Speed Tests</SelectItem>
                  <SelectItem value="cost">💰 Cost Tests</SelectItem>
                  <SelectItem value="multilingual">🌍 Multilingual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Priority Scenario
              </label>
              <Select
                value={selectedScenario}
                onValueChange={handleScenarioSelect}
              >
                <SelectTrigger className="h-11 border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                  <SelectValue placeholder="Select scenario" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200/80 dark:border-slate-700/80">
                  {testPrompts.priorityTestScenarios.map(scenario => (
                    <SelectItem key={scenario.name} value={scenario.name}>
                      {scenario.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Enhanced Quick Test Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="group flex items-center justify-center gap-2 h-12 text-sm font-semibold border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-700 rounded-xl transition-all duration-200"
              onClick={() => {
                const quickTests = testPrompts.testingSuggestions.quickTest;
                const randomPrompt = allPrompts.find(p =>
                  quickTests.includes(p.id)
                );
                if (randomPrompt) handlePromptSelect(randomPrompt);
              }}
            >
              <Zap className="h-4 w-4 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
              Quick
            </Button>

            <Button
              variant="outline"
              className="group flex items-center justify-center gap-2 h-12 text-sm font-semibold border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl transition-all duration-200"
              onClick={() => {
                const complexTests =
                  testPrompts.testingSuggestions.comprehensiveTest;
                const randomPrompt = allPrompts.find(p =>
                  complexTests.includes(p.id)
                );
                if (randomPrompt) handlePromptSelect(randomPrompt);
              }}
            >
              <Brain className="h-4 w-4 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              Complex
            </Button>

            <Button
              variant="outline"
              className="group flex items-center justify-center gap-2 h-12 text-sm font-semibold border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-300 dark:hover:border-purple-700 rounded-xl transition-all duration-200"
              onClick={() => {
                const speedPrompts = allPrompts.filter(
                  p => p.category === "speed"
                );
                const randomPrompt =
                  speedPrompts[Math.floor(Math.random() * speedPrompts.length)];
                if (randomPrompt) handlePromptSelect(randomPrompt);
              }}
            >
              <Zap className="h-4 w-4 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
              Speed
            </Button>

            <Button
              variant="outline"
              className="group flex items-center justify-center gap-2 h-12 text-sm font-semibold border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-300 dark:hover:border-amber-700 rounded-xl transition-all duration-200"
              onClick={() => {
                const costPrompts = allPrompts.filter(p => p.category === "cost");
                const randomPrompt =
                  costPrompts[Math.floor(Math.random() * costPrompts.length)];
                if (randomPrompt) handlePromptSelect(randomPrompt);
              }}
            >
              <DollarSign className="h-4 w-4 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
              Cost
            </Button>
          </div>

          {/* Enhanced Prompt List */}
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {filteredPrompts.map(prompt => (
              <div
                key={prompt.id}
                className="group p-5 bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <span className="text-xl flex-shrink-0">
                        {getCategoryIcon(prompt.category)}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">
                        {prompt.title}
                      </h4>
                      <Badge className={`${getComplexityColor(prompt.complexity)} text-xs font-semibold`}>
                        {prompt.complexity}
                      </Badge>
                      {"priorityTest" in prompt && prompt.priorityTest && (
                        <Badge variant="outline" className="text-xs font-medium">
                          {prompt.priorityTest} priority
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {prompt.prompt}
                    </p>
                    {prompt.expectedModels && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="text-xs text-slate-500 font-medium">
                          Expected:
                        </span>
                        {prompt.expectedModels.slice(0, 2).map(model => (
                          <Badge
                            key={model}
                            variant="secondary"
                            className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700"
                          >
                            {model.length > 12
                              ? model.slice(0, 12) + "..."
                              : model}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handlePromptSelect(prompt)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold whitespace-nowrap text-sm h-10 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      Use
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(prompt.prompt, prompt.id)}
                      className="group flex items-center justify-center w-full h-8 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
                    >
                      {copiedId === prompt.id ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPrompts.length === 0 && (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-lg font-semibold mb-2">No prompts found</p>
              <p className="text-sm opacity-75">
                Try selecting a different category
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
