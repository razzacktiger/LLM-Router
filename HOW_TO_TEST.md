# How to Test Your LLM Router 🚀

Complete step-by-step guide to test your LLM Router using the 60+ test prompts and utilities I've created.

## 🎯 What You Now Have

✅ **60 Test Prompts** (`TEST_PROMPTS.md`) - Comprehensive prompts across all use cases  
✅ **JSON Test Data** (`test-prompts.json`) - Programmatic access with metadata  
✅ **PromptTester Component** - Interactive UI for easy testing  
✅ **Testing Guide** (`TESTING_GUIDE.md`) - Detailed methodology  
✅ **Integration Instructions** - This file!

## 🚀 Quick Integration (2 Steps)

### Step 1: Add PromptTester to Your Page

Update your main LLM Router page to include the PromptTester component:

```tsx
// src/app/page.tsx or wherever your LLMRouter component is used
import { PromptTester } from "@/components/PromptTester";

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [priorities, setPriorities] = useState<PriorityItem[]>(priorityItems);

  // Function to update priorities from tester
  const handlePriorityUpdate = (newPriorityOrder: string[]) => {
    const updatedPriorities = newPriorityOrder.map((priorityId, index) => {
      const priority = priorityItems.find(p => p.id === priorityId);
      return priority!;
    });
    setPriorities(updatedPriorities);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Main LLM Router - Left Side */}
          <div className="xl:col-span-8">
            <LLMRouter
              prompt={prompt}
              setPrompt={setPrompt}
              priorities={priorities}
              setPriorities={setPriorities}
            />
          </div>

          {/* Prompt Tester - Right Side */}
          <div className="xl:col-span-4">
            <PromptTester
              onPromptSelect={setPrompt}
              onPrioritySelect={handlePriorityUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 2: Update LLMRouter Component (Optional)

If your `LLMRouter` component doesn't accept `prompt` and `setPrompt` as props, you can either:

**Option A**: Pass the state as props (recommended)
**Option B**: Import and use the PromptTester directly inside your existing LLMRouter component

## 🧪 Testing Workflow

### 1. **Manual Testing Process**

1. **Load the app** - Your LLM Router should now show the PromptTester in the sidebar
2. **Select a category** - Choose from coding, research, creative, business, etc.
3. **Pick a test prompt** - Click "Use Prompt" on any test prompt
4. **Adjust priorities** - Drag and drop priorities or use priority scenarios
5. **Submit & Analyze** - Click "Find Optimal Model" and evaluate the recommendation

### 2. **Systematic Testing Scenarios**

#### **Speed Priority Testing**

```bash
1. Select "Speed Tests" category
2. Choose "Speed Priority Test" scenario
3. Test prompts like "Quick Summary" or "Rapid Brainstorming"
4. Verify recommendations favor: Claude 3 Haiku, GPT-3.5 Turbo, Gemini Flash
```

#### **Cost Priority Testing**

```bash
1. Select "Cost Tests" category
2. Choose "Cost Priority Test" scenario
3. Test prompts like "Budget Content Creation"
4. Verify recommendations favor: Llama 2, Mistral 7B, Claude 3 Haiku
```

#### **Performance Priority Testing**

```bash
1. Select "Coding" or "Research" category
2. Choose "Performance Priority Test" scenario
3. Test complex prompts like "Architecture Design" or "Literature Review"
4. Verify recommendations favor: GPT-4o, Claude 3 Opus, Claude 3.5 Sonnet
```

### 3. **Automated Testing with Browser Console**

Open browser dev tools and run these tests:

```javascript
// Test multiple prompts quickly
const testPrompts = [
  "Write a function to reverse a string in Python",
  "Design a microservices architecture for an e-commerce platform",
  "Create 30 days of social media content for a small business",
  "Solve a system of 10 nonlinear equations with multiple variables",
];

// Simulate testing each prompt
testPrompts.forEach((prompt, index) => {
  console.log(`Testing prompt ${index + 1}: ${prompt.slice(0, 50)}...`);
  // You would manually input these or create a script
});
```

## 📊 Expected Results by Use Case

### **Coding Tasks**

- **Simple coding**: Claude 3 Haiku, GPT-4o mini, StarCoder
- **Complex architecture**: Claude 3.5 Sonnet, GPT-4o, Claude 3 Opus
- **ML/AI integration**: GPT-4o, DeepSeek-Coder, Claude 3.5 Sonnet

### **Research & Analysis**

- **Literature reviews**: GPT-4o, Claude 3 Opus, Gemini Ultra
- **Data analysis**: GPT-4o, Claude 3.5 Sonnet, DeepSeek-Math
- **Market research**: Claude 3.5 Sonnet, GPT-4o, Command R+

### **Creative Writing**

- **Brand storytelling**: Claude 3 Opus, Claude 3.5 Sonnet, GPT-4o
- **Technical writing**: Claude 3.5 Sonnet, GPT-4o, Command R+
- **Creative content**: Claude 3 Opus, GPT-4o, Command R+

### **Business Tasks**

- **Strategic planning**: GPT-4o, Claude 3.5 Sonnet, GPT-4 Turbo
- **Process optimization**: Claude 3.5 Sonnet, GPT-4o, Command R+
- **Financial analysis**: GPT-4o, Claude 3 Opus, GPT-4 Turbo

## 🔍 What to Look For

### ✅ **Good Recommendations**

- Speed priority → Fast models (Claude 3 Haiku, GPT-3.5 Turbo)
- Cost priority → Budget models (Llama 2, Mistral 7B)
- Performance priority → Premium models (GPT-4o, Claude 3 Opus)
- Coding tasks → Code-specialized models
- Research tasks → Analysis-focused models

### ❌ **Red Flags**

- Speed priority recommending slow models
- Cost priority recommending expensive models
- Simple tasks getting complex models
- Complex tasks getting basic models
- Inconsistent recommendations for same input

## 🐛 Troubleshooting

### **PromptTester Not Showing**

1. Check that all UI components are installed (`@radix-ui/react-select`)
2. Verify import paths in PromptTester.tsx
3. Make sure test-prompts.json is in the correct location

### **Recommendations Don't Match Priority**

1. Check priority order is correctly passed to the API
2. Verify Gemini API is receiving the priority weights
3. Test with simple prompts first to isolate the issue

### **Model Not Found Errors**

1. Check that your leaderboard data is loading correctly
2. Verify model name matching logic in LLMRouter component
3. Test fallback behavior with unknown models

## 📈 Advanced Testing

### **Batch Testing Script**

Create a simple test script to run multiple scenarios:

```javascript
// Save this as test-runner.js in your project
const testScenarios = [
  {
    prompt: "Simple coding task",
    priority: "speed",
    expected: "Claude 3 Haiku",
  },
  {
    prompt: "Complex architecture",
    priority: "performance",
    expected: "GPT-4o",
  },
  { prompt: "Budget content", priority: "cost", expected: "Mistral 7B" },
];

// Run each scenario and log results
testScenarios.forEach(scenario => {
  // Implementation would depend on your testing framework
  console.log(`Testing: ${scenario.prompt} with ${scenario.priority} priority`);
});
```

### **Performance Metrics**

Track these metrics during testing:

- **Response Time**: How long from submit to recommendation
- **Accuracy Rate**: Percentage of appropriate recommendations
- **Consistency Score**: Same input produces same output
- **Priority Adherence**: Recommendations match priority order

## 🎉 Success Criteria

### **Basic Success** (Good enough to ship)

- [x] Appropriate models for most use cases
- [x] Priority order generally reflected
- [x] No crashes or major errors
- [x] Reasonable response times

### **Advanced Success** (Production ready)

- [x] Specialized model selection for niche use cases
- [x] Nuanced understanding of prompt complexity
- [x] Smart trade-offs between competing priorities
- [x] Graceful degradation for edge cases
- [x] Consistent recommendations across sessions

---

## 🚀 Ready to Test!

You now have everything needed to thoroughly test your LLM Router:

1. **60 curated test prompts** across all major use cases
2. **Interactive PromptTester component** for easy testing
3. **Systematic testing methodology** with clear success criteria
4. **Expected results** for validation

Start with the Quick Integration steps above, then work through the testing scenarios. The PromptTester component will make it easy to rapidly test different combinations of prompts and priorities.

**Need help?** Check the `TESTING_GUIDE.md` for detailed methodology or `TEST_PROMPTS.md` for the full list of test prompts!
