"use client";

import { useState } from "react";
import { LLMRouter } from "@/components/LLMRouter";
import { PromptTester } from "@/components/PromptTester";
import { DollarSign, Zap, Clock } from "lucide-react";

// Define the PriorityItem type to match what LLMRouter expects
interface PriorityItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// Import the priority items structure
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

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [priorities, setPriorities] = useState(priorityItems);

  // Function to update priorities from PromptTester
  const handlePriorityUpdate = (newPriorityOrder: string[]) => {
    const reorderedPriorities = newPriorityOrder.map(priorityId => {
      return priorityItems.find(p => p.id === priorityId)!;
    });
    setPriorities(reorderedPriorities);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />

      <div className="relative container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-6">
            LLM Router Testing Environment
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-4xl mx-auto leading-relaxed">
            Test your LLM Router with 60+ curated prompts across different use
            cases and priorities.
            <br />
            <span className="text-lg opacity-80">
              Use the prompt tester on the right to quickly load test scenarios.
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main LLM Router - Left Side (2/3 columns) */}
          <div className="lg:col-span-2 min-w-0">
            <LLMRouter
              initialPrompt={prompt}
              initialPriorities={priorities}
              onPromptChange={setPrompt}
              onPrioritiesChange={(newPriorities: PriorityItem[]) =>
                setPriorities(newPriorities)
              }
            />
          </div>

          {/* Prompt Tester - Right Side (1/3 columns) */}
          <div className="lg:col-span-1 space-y-4 min-w-0">
            <PromptTester
              onPromptSelect={selectedPrompt => {
                setPrompt(selectedPrompt);
                console.log(
                  "📝 Loaded test prompt:",
                  selectedPrompt.slice(0, 100) + "..."
                );
              }}
              onPrioritySelect={newPriorities => {
                handlePriorityUpdate(newPriorities);
                console.log("🔄 Updated priority order:", newPriorities);
              }}
            />

            {/* Testing Instructions */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-3 border">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                🧪 Quick Guide
              </h3>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-4 h-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span className="leading-relaxed">Select test category</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-4 h-4 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span className="leading-relaxed">Click "Use" button</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-4 h-4 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span className="leading-relaxed">Adjust priorities</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-4 h-4 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  <span className="leading-relaxed">Find optimal model</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
