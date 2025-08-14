import { GeminiProvider } from '../providers/GeminiProvider';
import { LeaderboardProvider } from '../providers/LeaderboardProvider';
import { ModelSelector } from './ModelSelector';
import type { 
  LLMModel, 
  SelectionResult, 
  PriorityWeights, 
  RouterConfig 
} from '../types';

export class LLMRouter {
  private geminiProvider: GeminiProvider;
  private leaderboardProvider: LeaderboardProvider;
  private modelSelector: ModelSelector;
  private config: RouterConfig;

  constructor(config: RouterConfig) {
    this.config = config;
    this.geminiProvider = new GeminiProvider(config.geminiApiKey);
    this.leaderboardProvider = new LeaderboardProvider(
      config.leaderboardUrl, 
      config.cacheTimeout,
      config.firecrawlApiKey
    );
    this.modelSelector = new ModelSelector();
  }

  /**
   * Select the best model for a given prompt and priorities
   */
  async selectModel(
    prompt: string, 
    priorities: PriorityWeights,
    options?: {
      includeReasoning?: boolean;
      maxModels?: number;
      filterProviders?: string[];
    }
  ): Promise<SelectionResult> {
    try {
      // 1. Validate inputs
      this.validatePriorities(priorities);
      
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('Prompt cannot be empty');
      }
      
      // 2. Fetch available models
      const models = await this.leaderboardProvider.getModels();
      
      if (models.length === 0) {
        throw new Error('No models available for selection');
      }
      
      // 3. Filter models if needed
      let filteredModels = models;
      if (options?.filterProviders && options.filterProviders.length > 0) {
        filteredModels = models.filter(m => 
          options.filterProviders!.includes(m.provider)
        );
        
        if (filteredModels.length === 0) {
          throw new Error('No models found matching the specified providers');
        }
      }
      
      if (options?.maxModels && options.maxModels > 0) {
        filteredModels = filteredModels.slice(0, options.maxModels);
      }

      // 4. AI analysis with Gemini
      const aiAnalysis = await this.geminiProvider.analyzeTask(
        prompt, 
        filteredModels, 
        priorities
      );

      // 5. Apply AI-suggested priority adjustments
      const adjustedPriorities = this.modelSelector.adjustPriorities(
        priorities, 
        aiAnalysis.taskType
      );

      // 6. Deterministic model selection
      const selectedModel = this.modelSelector.selectOptimalModel(
        filteredModels, 
        adjustedPriorities,
        prompt
      );

      // 7. Get alternatives
      const alternatives = this.modelSelector.getTopAlternatives(
        filteredModels, 
        adjustedPriorities, 
        3,
        prompt
      );

      // 8. Build comprehensive result
      return {
        selectedModel,
        score: selectedModel.score,
        reasoning: options?.includeReasoning ? aiAnalysis.reasoning : undefined,
        taskAnalysis: aiAnalysis,
        alternatives,
        prioritiesUsed: adjustedPriorities,
        metadata: {
          totalModelsConsidered: filteredModels.length,
          timestamp: new Date().toISOString(),
          version: this.config.version || '1.0.0'
        }
      };

    } catch (error) {
      throw new Error(`Model selection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Batch analyze multiple prompts
   */
  async batchSelect(
    requests: Array<{
      prompt: string;
      priorities: PriorityWeights;
      id?: string;
    }>,
    options?: {
      concurrency?: number;
      includeReasoning?: boolean;
    }
  ): Promise<Array<SelectionResult & { requestId?: string }>> {
    if (!requests || requests.length === 0) {
      throw new Error('No requests provided for batch selection');
    }

    const concurrency = Math.max(1, Math.min(options?.concurrency || 3, 10)); // Limit concurrency
    const results: Array<SelectionResult & { requestId?: string }> = [];

    // Process in batches to avoid rate limits and memory issues
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (request, index) => {
        try {
          const result = await this.selectModel(
            request.prompt, 
            request.priorities,
            { includeReasoning: options?.includeReasoning }
          );
          return { ...result, requestId: request.id || `batch-${i + index}` };
        } catch (error) {
          // Continue processing other requests even if one fails
          console.error(`Batch request ${request.id || i + index} failed:`, error);
          throw error;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process results and handle failures
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Batch item ${i + index} failed:`, result.reason);
        }
      });
    }

    return results;
  }

  /**
   * Get model recommendations for a specific domain
   */
  async getRecommendationsForDomain(
    domain: 'coding' | 'math' | 'creative' | 'research' | 'business',
    options?: { budget?: 'low' | 'medium' | 'high'; count?: number }
  ): Promise<LLMModel[]> {
    const models = await this.leaderboardProvider.getModels();
    
    const domainPriorities: Record<string, PriorityWeights> = {
      coding: { performance: 0.6, cost: 0.2, speed: 0.2 },
      math: { performance: 0.7, cost: 0.1, speed: 0.2 },
      creative: { performance: 0.4, cost: 0.3, speed: 0.3 },
      research: { performance: 0.5, cost: 0.3, speed: 0.2 },
      business: { performance: 0.3, cost: 0.5, speed: 0.2 }
    };

    return this.modelSelector.getTopModelsForPriorities(
      models, 
      domainPriorities[domain],
      { 
        budget: options?.budget,
        count: options?.count || 10
      }
    );
  }

  /**
   * Get detailed information about available models
   */
  async getAvailableModels(options?: {
    provider?: string;
    minPerformance?: number;
    maxCost?: number;
  }): Promise<LLMModel[]> {
    const models = await this.leaderboardProvider.getModels();
    
    let filtered = models;
    
    if (options?.provider) {
      filtered = filtered.filter(m => 
        m.provider.toLowerCase().includes(options.provider!.toLowerCase())
      );
    }
    
    if (options?.minPerformance !== undefined) {
      filtered = filtered.filter(m => m.performanceScore >= options.minPerformance!);
    }
    
    if (options?.maxCost !== undefined) {
      filtered = filtered.filter(m => m.costScore >= options.maxCost!);
    }
    
    return filtered.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Get leaderboard provider status
   */
  getLeaderboardStatus() {
    return this.leaderboardProvider.getCacheStatus();
  }

  /**
   * Force refresh leaderboard data
   */
  async refreshLeaderboard(): Promise<LLMModel[]> {
    return this.leaderboardProvider.refreshModels();
  }

  /**
   * Validate priority weights
   */
  private validatePriorities(priorities: PriorityWeights): void {
    if (!priorities) {
      throw new Error('Priorities are required');
    }
    
    const { performance, cost, speed } = priorities;
    
    if (typeof performance !== 'number' || typeof cost !== 'number' || typeof speed !== 'number') {
      throw new Error('All priority values must be numbers');
    }
    
    if (performance < 0 || cost < 0 || speed < 0) {
      throw new Error('Priority values must be non-negative');
    }
    
    const sum = performance + cost + speed;
    if (Math.abs(sum - 1.0) > 0.001) {
      throw new Error(`Priority weights must sum to 1.0 (current sum: ${sum.toFixed(3)})`);
    }
  }
}
