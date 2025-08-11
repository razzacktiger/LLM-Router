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
    <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 text-lg">
          <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <TestTube className="h-4 w-4 text-white" />
          </div>
          Prompt Tester
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          Quick-load test prompts to evaluate LLM Router recommendations
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Category Filter
            </label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Priority Scenario
            </label>
            <Select
              value={selectedScenario}
              onValueChange={handleScenarioSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select scenario" />
              </SelectTrigger>
              <SelectContent>
                {testPrompts.priorityTestScenarios.map(scenario => (
                  <SelectItem key={scenario.name} value={scenario.name}>
                    {scenario.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Test Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-1 h-8 text-xs font-medium"
            onClick={() => {
              const quickTests = testPrompts.testingSuggestions.quickTest;
              const randomPrompt = allPrompts.find(p =>
                quickTests.includes(p.id)
              );
              if (randomPrompt) handlePromptSelect(randomPrompt);
            }}
          >
            <Zap className="h-3 w-3" />
            Quick
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-1 h-8 text-xs font-medium"
            onClick={() => {
              const complexTests =
                testPrompts.testingSuggestions.comprehensiveTest;
              const randomPrompt = allPrompts.find(p =>
                complexTests.includes(p.id)
              );
              if (randomPrompt) handlePromptSelect(randomPrompt);
            }}
          >
            <Brain className="h-3 w-3" />
            Complex
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-1 h-8 text-xs font-medium"
            onClick={() => {
              const speedPrompts = allPrompts.filter(
                p => p.category === "speed"
              );
              const randomPrompt =
                speedPrompts[Math.floor(Math.random() * speedPrompts.length)];
              if (randomPrompt) handlePromptSelect(randomPrompt);
            }}
          >
            <Zap className="h-3 w-3" />
            Speed
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-1 h-8 text-xs font-medium"
            onClick={() => {
              const costPrompts = allPrompts.filter(p => p.category === "cost");
              const randomPrompt =
                costPrompts[Math.floor(Math.random() * costPrompts.length)];
              if (randomPrompt) handlePromptSelect(randomPrompt);
            }}
          >
            <DollarSign className="h-3 w-3" />
            Cost
          </Button>
        </div>

        {/* Prompt List */}
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {filteredPrompts.map(prompt => (
            <Card
              key={prompt.id}
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-shadow duration-200 overflow-hidden"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-lg flex-shrink-0">
                        {getCategoryIcon(prompt.category)}
                      </span>
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm leading-tight truncate">
                        {prompt.title}
                      </h4>
                      <Badge className={getComplexityColor(prompt.complexity)}>
                        {prompt.complexity}
                      </Badge>
                      {"priorityTest" in prompt && prompt.priorityTest && (
                        <Badge variant="outline" className="text-xs">
                          {prompt.priorityTest} priority
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {prompt.prompt}
                    </p>
                    {prompt.expectedModels && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="text-xs text-slate-500">
                          Expected:
                        </span>
                        {prompt.expectedModels.slice(0, 2).map(model => (
                          <Badge
                            key={model}
                            variant="secondary"
                            className="text-xs px-1 py-0"
                          >
                            {model.length > 12
                              ? model.slice(0, 12) + "..."
                              : model}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handlePromptSelect(prompt)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium whitespace-nowrap text-xs h-8"
                    >
                      Use
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(prompt.prompt, prompt.id)}
                      className="flex items-center justify-center w-full h-6"
                    >
                      {copiedId === prompt.id ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPrompts.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <div className="text-2xl mb-2">🔍</div>
            <p className="text-base font-medium">No prompts found</p>
            <p className="text-sm opacity-75">
              Try selecting a different category
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
