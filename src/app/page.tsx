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
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900/95 dark:to-indigo-950/90">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100/30 dark:bg-grid-slate-800/20 [mask-image:radial-gradient(ellipse_at_center,white,rgba(255,255,255,0.2))] dark:[mask-image:radial-gradient(ellipse_at_center,rgba(255,255,255,0.1),transparent)]" />
      
      {/* Floating background elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-indigo-400/10 to-purple-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-indigo-600/10 rounded-full blur-3xl"></div>

      <div className="relative container mx-auto px-6 py-16 max-w-7xl">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <h1 className="text-6xl md:text-56xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300 bg-clip-text text-transparent mb-6 leading-tight">
              LLM Router Testing Environment
            </h1>
            <div className="h-1 w-32 bg-gradient-to-r from-indigo-500 to-purple-600 mx-auto rounded-full"></div>
          </div>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-5xl mx-auto leading-relaxed font-medium">
            Test your LLM Router with <span className="font-bold text-indigo-600 dark:text-indigo-400">60+ curated prompts</span> across different use cases and priorities.
          </p>
          <p className="text-lg text-slate-500 dark:text-slate-400 mt-4 max-w-4xl mx-auto">
            Use the prompt tester on the right to quickly load test scenarios and find your optimal AI model.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

          {/* Enhanced Prompt Tester - Right Side (1/3 columns) */}
          <div className="lg:col-span-1 space-y-6 min-w-0">
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

            {/* Enhanced Testing Instructions */}
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-xl rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  Quick Guide
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 group">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm group-hover:scale-110 transition-transform duration-200">
                      1
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      Select test category
                    </span>
                  </div>
                  <div className="flex items-center gap-3 group">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-700 dark:text-blue-400 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm group-hover:scale-110 transition-transform duration-200">
                      2
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      Click "Use" button
                    </span>
                  </div>
                  <div className="flex items-center gap-3 group">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 text-purple-700 dark:text-purple-400 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm group-hover:scale-110 transition-transform duration-200">
                      3
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      Adjust priorities
                    </span>
                  </div>
                  <div className="flex items-center gap-3 group">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40 text-orange-700 dark:text-orange-400 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm group-hover:scale-110 transition-transform duration-200">
                      4
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      Find optimal model
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
