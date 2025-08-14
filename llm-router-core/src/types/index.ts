export interface LLMModel {
  name: string;
  provider: string;
  overallScore: number;
  performanceScore: number;
  costScore: number;
  speedScore: number;
  benchmarks: {
    sweScore?: number;
    mmluScore?: number;
    aimeScore?: number;
    mathScore?: number;
    gpqaScore?: number;
    humanEvalScore?: number;
  };
  pricing?: {
    inputCost?: number;
    outputCost?: number;
    currency?: string;
  };
  metadata?: {
    contextLength?: number;
    modelSize?: string;
    releaseDate?: string;
  };
}

export interface PriorityWeights {
  performance: number;  // 0-1
  cost: number;        // 0-1  
  speed: number;       // 0-1
}

export interface TaskAnalysis {
  taskType: 'CODING' | 'MATH' | 'CREATIVE' | 'RESEARCH' | 'BUSINESS' | 'REASONING';
  complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX';
  reasoning: string;
  recommendedModels: string[];
  suggestedPriorities: PriorityWeights;
}

export interface SelectionResult {
  selectedModel: LLMModel & { score: number };
  score: number;
  reasoning?: string;
  taskAnalysis: TaskAnalysis;
  alternatives: Array<LLMModel & { score: number }>;
  prioritiesUsed: PriorityWeights;
  metadata: {
    totalModelsConsidered: number;
    timestamp: string;
    version: string;
  };
}

export interface RouterConfig {
  geminiApiKey?: string;
  firecrawlApiKey?: string;
  leaderboardUrl?: string;
  version?: string;
  cacheTimeout?: number;
  enableLogging?: boolean;
}

export interface ModelScore {
  model: LLMModel;
  totalScore: number;
  breakdown: {
    costScore: number;
    performanceScore: number;
    speedScore: number;
    weightedCost: number;
    weightedPerformance: number;
    weightedSpeed: number;
  };
}

export interface PriorityItem {
  id: string;
  name: string;
  weight: number;
}
