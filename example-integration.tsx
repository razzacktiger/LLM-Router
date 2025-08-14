// Example of how to integrate PromptTester into your existing LLMRouter page

"use client";

import { useState } from "react";
import { LLMRouter } from "@/components/LLMRouter";
import { PromptTester } from "@/components/PromptTester";

// Your existing priority items
const priorityItems = [
  {
    id: "cost",
    name: "Cost Efficiency",
    // ... rest of your priority item structure
  },
  {
    id: "performance",
    name: "Performance Quality",
    // ... rest of your priority item structure
  },
  {
    id: "speed",
    name: "Response Speed",
    // ... rest of your priority item structure
  },
];

export default function TestingPage() {
  const [prompt, setPrompt] = useState("");
  const [priorities, setPriorities] = useState(priorityItems);

  // Function to update priorities from the tester
  const handlePriorityUpdate = (newPriorityOrder: string[]) => {
    // Reorder your priority items based on the new order
    const reorderedPriorities = newPriorityOrder.map(priorityId => {
      return priorityItems.find(p => p.id === priorityId)!;
    });
    setPriorities(reorderedPriorities);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            LLM Router Testing Environment
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Test your LLM Router with 60+ curated prompts across different use
            cases and priorities
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Main LLM Router - Left Side (8/12 columns) */}
          <div className="xl:col-span-8">
            <LLMRouter
              // Pass the controlled prompt and priorities
              initialPrompt={prompt}
              initialPriorities={priorities}
              onPromptChange={setPrompt}
              onPrioritiesChange={setPriorities}
            />
          </div>

          {/* Prompt Tester - Right Side (4/12 columns) */}
          <div className="xl:col-span-4">
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
          </div>
        </div>
      </div>
    </div>
  );
}

/* 
TESTING WORKFLOW:

1. 🚀 QUICK START:
   - Load the page
   - Click any "Use Prompt" button in the right sidebar
   - Click "Find Optimal Model" 
   - Observe the recommendation

2. 🧪 SYSTEMATIC TESTING:
   
   Step A: Test Speed Priority
   - Select "Speed Tests" category in PromptTester
   - Choose "Speed Priority Test" scenario (auto-sets priorities)
   - Test prompts like "Quick Summary" or "Fast Debugging"
   - Expected: Claude 3 Haiku, GPT-3.5 Turbo, Gemini Flash
   
   Step B: Test Cost Priority  
   - Select "Cost Tests" category
   - Choose "Cost Priority Test" scenario
   - Test "Budget Content Creation" prompts
   - Expected: Llama 2, Mistral 7B, Claude 3 Haiku
   
   Step C: Test Performance Priority
   - Select "Coding" or "Research" category
   - Choose "Performance Priority Test" scenario  
   - Test complex prompts like "Architecture Design"
   - Expected: GPT-4o, Claude 3 Opus, Claude 3.5 Sonnet

3. 🔍 VALIDATION CHECKLIST:
   ✅ Speed priority → Fast models recommended
   ✅ Cost priority → Budget-friendly models recommended  
   ✅ Performance priority → High-quality models recommended
   ✅ Coding prompts → Code-specialized models
   ✅ Research prompts → Analysis-focused models
   ✅ Same prompt + same priorities = same recommendation

4. 📊 CONSOLE TESTING:
   Open browser dev tools and run:
   
   ```javascript
   // Test consistency
   console.log("Testing consistency...");
   // Submit same prompt 3 times, verify same result
   
   // Test priority switching  
   console.log("Testing priority switching...");
   // Same prompt with different priority orders
   
   // Test edge cases
   console.log("Testing edge cases...");
   // Very short prompt: "Help"
   // Very long prompt: 1000+ character description
   ```

5. 🐛 COMMON ISSUES TO CHECK:
   - Model not found in leaderboard (should show fallback)
   - Inconsistent recommendations for identical inputs  
   - Wrong model type for use case (coding prompt → creative model)
   - Priority order not reflected in recommendation
*/
