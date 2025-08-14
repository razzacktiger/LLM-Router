# 🤖 LLM Router Core

> Intelligent language model selection with hybrid AI + deterministic scoring + Advanced Language Detection

[![npm version](https://badge.fury.io/js/llm-router-core.svg)](https://badge.fury.io/js/llm-router-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

**LLM Router Core** is a powerful NPM package that intelligently selects the best language model for any task. It combines Google Gemini's AI analysis with deterministic scoring across 35+ models from live leaderboards, ensuring you always get the optimal model for your specific needs.

## 🎉 **NEW: Advanced Multi-Language Detection**
✨ **Smart Language Recognition**: Automatically detects 15+ programming languages with framework identification  
🎯 **Domain-Specific Scoring**: Context-aware model selection for systems, web, mobile, data science, and more  
📊 **Confidence Metrics**: Reliability scoring for all language detection decisions  
⚡ **Enhanced Examples**: Run `node examples/advanced-language-detection.js` to see it in action!

## ✨ Features

- 🧠 **Hybrid Intelligence**: AI task analysis + mathematical scoring
- 📊 **Live Vellum Leaderboard Data**: Always up-to-date model performance from Vellum.ai 
- 🎯 **Smart Recommendations**: Task-specific model selection
- ⚡ **Batch Processing**: Analyze multiple prompts efficiently
- 🏷️ **TypeScript First**: Full type safety and IntelliSense
- 🔧 **Highly Configurable**: Custom priorities and filtering
- 💰 **Cost Optimization**: Balance performance, speed, and cost
- 🚀 **Easy Integration**: Simple API, works anywhere Node.js runs

## 🚀 Quick Start

```bash
npm install llm-router-core
```

```javascript
const { LLMRouter } = require('llm-router-core');

// Initialize router with live scraping capabilities
const router = new LLMRouter({
  geminiApiKey: 'your-gemini-api-key',    // Optional: enables AI analysis
  firecrawlApiKey: 'your-firecrawl-api-key' // Optional: enables live Vellum scraping
});

// Get intelligent model recommendation with live data
const result = await router.selectModel(
  "Write a Python function to reverse a binary tree",
  { performance: 0.6, cost: 0.2, speed: 0.2 }
);

console.log('Recommended:', result.selectedModel.name);
console.log('Score:', result.score);
console.log('Reasoning:', result.reasoning);
```

### 🔥 **NEW: Live Vellum Leaderboard Scraping**

```javascript
// Enable live data scraping from Vellum leaderboard
const router = new LLMRouter({
  firecrawlApiKey: 'fc-your-api-key', // Get from https://firecrawl.dev
  geminiApiKey: 'your-gemini-key'     // Get from https://makersuite.google.com
});

// Now uses real-time leaderboard data!
const result = await router.selectModel("Complex coding task", priorities);
```

## 📖 API Reference

### `new LLMRouter(config)`

Create a new router instance.

```typescript
const router = new LLMRouter({
  geminiApiKey?: string;        // Optional: Your Gemini API key for AI analysis
  firecrawlApiKey?: string;     // Optional: Your Firecrawl API key for live scraping
  leaderboardUrl?: string;      // Optional: Custom leaderboard URL
  cacheTimeout?: number;        // Optional: Cache timeout in ms (default: 5min)
  enableLogging?: boolean;      // Optional: Enable debug logging
  version?: string;             // Optional: Version for metadata
});
```

### `selectModel(prompt, priorities, options?)`

Select the best model for a specific task.

```typescript
const result = await router.selectModel(
  "Your task prompt",
  { performance: 0.5, cost: 0.3, speed: 0.2 }, // Must sum to 1.0
  {
    includeReasoning: true,     // Include AI reasoning in response
    maxModels: 20,             // Limit models considered
    filterProviders: ['OpenAI', 'Anthropic'] // Filter by provider
  }
);
```

**Response Format:**
```typescript
{
  selectedModel: {
    name: string;
    provider: string;
    score: number;
    performanceScore: number;
    costScore: number;
    speedScore: number;
    benchmarks: { /* benchmark scores */ }
  };
  score: number;                    // Overall match score (0-10)
  reasoning?: string;               // AI explanation (if requested)
  taskAnalysis: {
    taskType: 'CODING' | 'MATH' | 'CREATIVE' | 'RESEARCH' | 'BUSINESS' | 'REASONING';
    complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX';
    reasoning: string;
  };
  alternatives: LLMModel[];         // Top 3 alternatives
  prioritiesUsed: PriorityWeights;  // Final priorities after AI adjustment
  metadata: {
    totalModelsConsidered: number;
    timestamp: string;
    version: string;
  };
}
```

### `batchSelect(requests, options?)`

Process multiple prompts efficiently.

```typescript
const results = await router.batchSelect([
  { 
    id: 'task-1',
    prompt: "First task", 
    priorities: { performance: 0.7, cost: 0.2, speed: 0.1 }
  },
  { 
    id: 'task-2', 
    prompt: "Second task", 
    priorities: { performance: 0.3, cost: 0.5, speed: 0.2 }
  }
], {
  concurrency: 3,              // Process 3 at a time (default: 3, max: 10)
  includeReasoning: true       // Include AI reasoning
});
```

### `getRecommendationsForDomain(domain, options?)`

Get pre-optimized recommendations for common domains.

```typescript
// Get best models for coding tasks
const codingModels = await router.getRecommendationsForDomain('coding', {
  budget: 'medium',  // 'low' | 'medium' | 'high'
  count: 5          // Number of models to return
});

// Available domains: 'coding', 'math', 'creative', 'research', 'business'
```

### `getAvailableModels(options?)`

Get detailed information about available models with filtering.

```typescript
const models = await router.getAvailableModels({
  provider: 'OpenAI',        // Filter by provider
  minPerformance: 8.0,       // Minimum performance score
  maxCost: 7.0              // Maximum cost score (higher = more cost-effective)
});
```

## 🛠️ Configuration

### Priority Weights

Control what matters most for your use case:

```typescript
const priorities = {
  performance: 0.6,  // Benchmark scores (0-1)
  cost: 0.2,        // Cost efficiency (0-1)  
  speed: 0.2        // Response speed (0-1)
};
// Must sum to 1.0
```

### Task Types

The AI automatically classifies tasks into:
- `CODING` - Programming, debugging, algorithms
- `MATH` - Mathematical problem solving
- `CREATIVE` - Writing, brainstorming, content
- `RESEARCH` - Analysis, information gathering  
- `BUSINESS` - Professional tasks, emails
- `REASONING` - Logic, complex analysis

## 💡 Examples

### Basic Model Selection

```javascript
const { LLMRouter } = require('llm-router-core');

const router = new LLMRouter({
  geminiApiKey: process.env.GEMINI_API_KEY // Optional
});

const result = await router.selectModel(
  "Optimize this SQL query for better performance",
  { performance: 0.7, cost: 0.2, speed: 0.1 },
  { includeReasoning: true }
);

console.log(`Best model: ${result.selectedModel.name}`);
console.log(`Task type: ${result.taskAnalysis.taskType}`);
console.log(`AI reasoning: ${result.reasoning}`);
```

### Batch Processing

```javascript
const requests = [
  {
    id: 'email-task',
    prompt: "Write a professional follow-up email",
    priorities: { performance: 0.3, cost: 0.5, speed: 0.2 }
  },
  {
    id: 'code-review',
    prompt: "Review this React component for best practices",
    priorities: { performance: 0.8, cost: 0.1, speed: 0.1 }
  }
];

const results = await router.batchSelect(requests, {
  concurrency: 2,
  includeReasoning: true
});

results.forEach(result => {
  console.log(`Task ${result.requestId}: ${result.selectedModel.name}`);
});
```

### Domain-Specific Recommendations

```javascript
// Get cost-effective models for creative writing
const creativeModels = await router.getRecommendationsForDomain('creative', {
  budget: 'low',
  count: 3
});

// Get high-performance models for math problems
const mathModels = await router.getRecommendationsForDomain('math', {
  budget: 'high',
  count: 5
});
```

## 📊 LeaderboardProvider - Direct Data Access

For applications that need direct access to leaderboard data, use the `LeaderboardProvider`:

```javascript
const { LeaderboardProvider } = require('llm-router-core');

// Initialize with Vellum leaderboard (default)
const provider = new LeaderboardProvider();

// Or use a custom leaderboard endpoint
const customProvider = new LeaderboardProvider('https://your-leaderboard-api.com');

// Fetch latest model data
const models = await provider.getModels();

models.forEach(model => {
  console.log(`${model.name} (${model.provider})`);
  console.log(`Performance: ${model.performanceScore}/10`);
  console.log(`Cost Efficiency: ${model.costScore}/10`);
  console.log(`Speed: ${model.speedScore}/10`);
  console.log('---');
});
```

**Features:**
- 🎯 **Vellum Integration**: Defaults to Vellum.ai leaderboard data
- ⚡ **Smart Caching**: 5-minute cache to reduce API calls
- 🔄 **Fallback Support**: Mock data when live data unavailable
- 🛡️ **Type Safety**: Full TypeScript support
- 🔧 **Configurable**: Custom endpoints and cache timeout

## 🔑 Environment Setup

### API Keys (Optional but Recommended)

#### Gemini API Key - Enhanced AI Analysis
Get your API key from [Google AI Studio](https://makersuite.google.com/):

```bash
# .env file
GEMINI_API_KEY=your_gemini_api_key_here
```

#### Firecrawl API Key - Live Vellum Scraping  
Get your API key from [Firecrawl](https://firecrawl.dev/):

```bash
# .env file
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
```

```javascript
const router = new LLMRouter({
  geminiApiKey: process.env.GEMINI_API_KEY,     // Enhanced AI analysis
  firecrawlApiKey: process.env.FIRECRAWL_API_KEY // Live Vellum data
});
```

**Feature Matrix:**
- ✅ **No API Keys**: Keyword-based analysis + Curated mock data
- 🧠 **Gemini Only**: AI-powered analysis + Curated mock data  
- 🔥 **Firecrawl Only**: Keyword-based analysis + Live Vellum data
- 🚀 **Both Keys**: AI-powered analysis + Live Vellum data (Recommended)

## 📊 Model Data

The package includes curated data for 35+ models including:

**Top Providers:**
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3.5)
- Google (Gemini Pro)
- Meta (Llama 3.1)
- And many more...

**Benchmark Scores:**
- SWE-Bench (Software Engineering)
- MMLU (Multitask Language Understanding)
- AIME (Mathematics)
- GPQA (Science Questions)
- HumanEval (Code Generation)

## 🚀 Performance

- **Fast Selection**: ~50-200ms per model selection
- **Batch Processing**: Configurable concurrency for large workloads
- **Smart Caching**: 5-minute cache for leaderboard data
- **Lightweight**: Minimal dependencies, works in any Node.js environment

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/your-username/llm-router-core)
- [NPM Package](https://www.npmjs.com/package/llm-router-core)
- [Issue Tracker](https://github.com/your-username/llm-router-core/issues)
- [Google AI Studio](https://makersuite.google.com/) (for Gemini API key)

## 📈 Roadmap

- [ ] Support for custom model providers
- [ ] Real-time cost tracking
- [ ] Model performance monitoring
- [ ] Integration with popular AI frameworks
- [ ] Web dashboard for model analytics

---

**Made with ❤️ for the AI community**
