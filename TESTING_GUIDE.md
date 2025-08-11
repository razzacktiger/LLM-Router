# LLM Router Testing Guide

Complete guide for testing your LLM Router with the provided test prompts and utilities.

## 🚀 Quick Start

### 1. Use the Test Prompts File

Load `TEST_PROMPTS.md` for a comprehensive list of 60 curated test prompts organized by category.

### 2. Use the JSON Test Data

Import `test-prompts.json` for programmatic access to test prompts with metadata.

### 3. Use the PromptTester Component

Integrate the `PromptTester` component into your app for easy testing interface.

## 📋 Testing Categories

### **Software Development & Coding (12 prompts)**

- **Simple**: String reversal, basic algorithms
- **Medium**: Data structures, API development
- **Complex**: Architecture design, ML integration

**Priority Testing:**

- **Speed Priority**: Quick debugging, simple scripts
- **Cost Priority**: Basic automation, templates
- **Performance Priority**: Complex algorithms, architecture

### **Research & Analysis (10 prompts)**

- Literature reviews and scientific analysis
- Market research and business intelligence
- Data science and predictive modeling

### **Creative Writing & Content (8 prompts)**

- Brand storytelling and marketing campaigns
- Creative writing (screenplays, novels)
- Technical documentation

### **Mathematical & Scientific (6 prompts)**

- Complex calculations and optimization
- Physics simulations and statistical modeling
- Engineering calculations

### **Business & Professional (8 prompts)**

- Strategic planning and digital transformation
- Operations management and process optimization
- Financial planning and HR strategies

### **Multilingual & Global (6 prompts)**

- Translation and localization
- Cross-cultural communication
- International business scenarios

## 🧪 Testing Strategies

### Systematic Testing Approach

#### 1. **Priority Validation Testing**

Test each priority order with the same prompt:

```javascript
// Test with different priority orders
const testPrompt =
  "Design a microservices architecture for an e-commerce platform";

// Test 1: Performance → Cost → Speed
priorities: ["performance", "cost", "speed"];

// Test 2: Speed → Performance → Cost
priorities: ["speed", "performance", "cost"];

// Test 3: Cost → Speed → Performance
priorities: ["cost", "speed", "performance"];
```

#### 2. **Complexity Gradient Testing**

Use prompts of increasing complexity:

```javascript
// Simple → Medium → Complex
const gradientTest = [
  "Write a function to reverse a string in Python", // Simple
  "Create a binary search tree class with CRUD methods", // Medium
  "Design a microservices architecture for e-commerce", // Complex
];
```

#### 3. **Use Case Specialization Testing**

Test domain-specific recommendations:

```javascript
const specializationTests = {
  coding: "Implement a real-time recommendation system using TensorFlow",
  research: "Conduct comprehensive literature review on AI in healthcare",
  creative: "Write a 10-page screenplay for a sci-fi short film",
  business: "Develop 5-year strategic plan for international expansion",
  mathematical:
    "Solve system of 10 nonlinear equations with multiple variables",
};
```

## 🔧 Integration with PromptTester Component

### Add to your main page:

```tsx
import { PromptTester } from "@/components/PromptTester";

// In your component:
const [prompt, setPrompt] = useState("");
const [priorities, setPriorities] = useState(["performance", "cost", "speed"]);

return (
  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
    {/* Your existing LLMRouter component */}
    <div className="xl:col-span-8">{/* Main router content */}</div>

    {/* Add PromptTester in sidebar */}
    <div className="xl:col-span-4">
      <PromptTester
        onPromptSelect={setPrompt}
        onPrioritySelect={newPriorities => {
          // Update your priority state based on the array
          // Map array to your priority objects
        }}
      />
    </div>
  </div>
);
```

## 📊 Expected Outcomes by Priority

### **Speed Priority Models:**

- Claude 3 Haiku
- GPT-3.5 Turbo
- Gemini Flash
- Mistral 7B

### **Cost Priority Models:**

- Llama 2 variants (open-source)
- Mistral 7B
- Claude 3 Haiku
- GPT-3.5 Turbo

### **Performance Priority Models:**

- GPT-4o
- Claude 3 Opus
- Claude 3.5 Sonnet
- Gemini Ultra

## 🎯 Testing Scenarios

### **Scenario 1: Quick Content Generation**

```
Prompt: "Create 30 days of social media content for a small business"
Priority: Cost → Speed → Performance
Expected: Claude 3 Haiku, GPT-3.5 Turbo, or Mistral 7B
```

### **Scenario 2: Complex Code Architecture**

```
Prompt: "Design microservices architecture for e-commerce platform"
Priority: Performance → Speed → Cost
Expected: Claude 3.5 Sonnet, GPT-4o, or Claude 3 Opus
```

### **Scenario 3: Real-time Debugging**

```
Prompt: "Quickly identify and fix the bug in this 100-line Python script"
Priority: Speed → Performance → Cost
Expected: Claude 3 Haiku, GPT-4o mini, or StarCoder
```

### **Scenario 4: Research Analysis**

```
Prompt: "Comprehensive literature review on AI in healthcare outcomes"
Priority: Performance → Cost → Speed
Expected: GPT-4o, Claude 3 Opus, or Gemini Ultra
```

## 📈 Testing Metrics to Track

### **Recommendation Accuracy**

- Does the recommended model match expected category?
- Is the priority weighting reflected in the choice?
- Are specialized models chosen for domain-specific tasks?

### **Consistency Testing**

- Same prompt + same priorities = same recommendation
- Similar prompts should recommend similar model categories
- Priority changes should shift recommendations appropriately

### **Edge Case Handling**

- Very short prompts
- Extremely complex prompts
- Ambiguous task descriptions
- Multiple conflicting requirements

## 🚨 Common Issues to Test

### **Model Not Found**

- Recommended model not in leaderboard
- Fallback behavior working correctly
- Error handling for unavailable models

### **Priority Confusion**

- Speed priority recommending slow models
- Cost priority recommending expensive models
- Performance priority recommending low-quality models

### **Use Case Misidentification**

- Coding prompts getting creative writing models
- Research tasks getting simple models
- Complex tasks getting basic models

## 📋 Testing Checklist

- [ ] Test all 6 main categories (coding, research, creative, business, math, multilingual)
- [ ] Test all 3 priority orders (6 combinations total)
- [ ] Test complexity gradients (simple → medium → complex)
- [ ] Test speed-focused prompts with speed priority
- [ ] Test cost-focused prompts with cost priority
- [ ] Test performance-focused prompts with performance priority
- [ ] Test edge cases (very short/long prompts)
- [ ] Test model fallback behavior
- [ ] Test consistency (same input = same output)
- [ ] Test priority weighting accuracy

## 🎉 Success Criteria

✅ **Good Performance:**

- Appropriate model recommendations for use case
- Priority order reflected in model selection
- Consistent recommendations for identical inputs
- Graceful handling of edge cases

✅ **Excellent Performance:**

- Specialized model selection for niche use cases
- Nuanced understanding of prompt complexity
- Smart trade-offs between competing priorities
- Accurate fallback for unavailable models
