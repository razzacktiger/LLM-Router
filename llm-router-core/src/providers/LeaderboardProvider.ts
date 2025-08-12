import axios from 'axios';
import type { LLMModel } from '../types';

export class LeaderboardProvider {
  private baseUrl: string;
  private cache: { models?: LLMModel[]; timestamp?: number } = {};
  private cacheTimeout: number;

  constructor(baseUrl: string = '', cacheTimeout: number = 300000) {
    // Default to empty string - will be handled in getModels
    this.baseUrl = baseUrl;
    this.cacheTimeout = cacheTimeout; // 5 minutes default
  }

  /**
   * Fetch all available models from leaderboard
   */
  async getModels(): Promise<LLMModel[]> {
    // Check cache first
    if (this.cache.models && this.cache.timestamp && 
        Date.now() - this.cache.timestamp < this.cacheTimeout) {
      return this.cache.models;
    }

    try {
      // If no custom URL provided, return mock data for development
      if (!this.baseUrl) {
        const mockModels = this.getMockModels();
        this.cache = {
          models: mockModels,
          timestamp: Date.now()
        };
        return mockModels;
      }

      // Fetch from actual leaderboard API
      const response = await axios.get(`${this.baseUrl}/api/scrape`, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LLM-Router-Core/1.0.0'
        }
      });
      
      const models = this.transformLeaderboardData(response.data);
      
      // Update cache
      this.cache = {
        models,
        timestamp: Date.now()
      };
      
      return models;
    } catch (error) {
      if (this.cache.models) {
        console.warn('Using cached models due to fetch error');
        return this.cache.models;
      }
      
      console.warn('Failed to fetch leaderboard data, using mock data');
      const mockModels = this.getMockModels();
      return mockModels;
    }
  }

  /**
   * Transform leaderboard data to our model format
   */
  private transformLeaderboardData(data: any): LLMModel[] {
    if (!data?.data?.models && !data?.models) {
      throw new Error('Invalid leaderboard data format');
    }
    
    const models = data?.data?.models || data?.models || [];
    
    return models.map((model: any) => ({
      name: model.name || 'Unknown Model',
      provider: model.provider || 'Unknown Provider',
      overallScore: this.parseScore(model.overallScore || model.overall_score),
      performanceScore: this.parseScore(model.performanceScore || model.performance_score),
      costScore: this.parseScore(model.costScore || model.cost_efficiency),
      speedScore: this.parseScore(model.speedScore || model.speed_score),
      benchmarks: {
        sweScore: this.parseScore(model.swe_bench_verified || model.benchmarks?.sweScore),
        mmluScore: this.parseScore(model.mmlu || model.benchmarks?.mmluScore),
        aimeScore: this.parseScore(model.aime_2024 || model.benchmarks?.aimeScore),
        mathScore: this.parseScore(model.math_500 || model.benchmarks?.mathScore),
        gpqaScore: this.parseScore(model.gpqa_diamond || model.benchmarks?.gpqaScore),
        humanEvalScore: this.parseScore(model.humaneval || model.benchmarks?.humanEvalScore),
      },
      pricing: model.pricing || {
        inputCost: undefined,
        outputCost: undefined,
        currency: 'USD'
      },
      metadata: {
        contextLength: model.context_length || model.metadata?.contextLength,
        modelSize: model.model_size || model.metadata?.modelSize,
        releaseDate: model.release_date || model.metadata?.releaseDate
      }
    })).filter((model: LLMModel) => model.name !== 'Unknown Model'); // Filter out invalid entries
  }

  private parseScore(score: any): number {
    if (typeof score === 'number') return Math.max(0, Math.min(10, score));
    if (typeof score === 'string') {
      const parsed = parseFloat(score);
      return isNaN(parsed) ? 0 : Math.max(0, Math.min(10, parsed));
    }
    return 0;
  }

  /**
   * Get mock models for development/testing
   */
  private getMockModels(): LLMModel[] {
    return [
      {
        name: 'GPT-4 Turbo',
        provider: 'OpenAI',
        overallScore: 9.2,
        performanceScore: 9.5,
        costScore: 7.0,
        speedScore: 8.5,
        benchmarks: {
          sweScore: 87,
          mmluScore: 92,
          aimeScore: 74,
          mathScore: 89,
          gpqaScore: 78,
          humanEvalScore: 91
        },
        pricing: { inputCost: 0.01, outputCost: 0.03, currency: 'USD' },
        metadata: { contextLength: 128000, modelSize: 'Large', releaseDate: '2024-04' }
      },
      {
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        overallScore: 9.1,
        performanceScore: 9.3,
        costScore: 7.5,
        speedScore: 8.8,
        benchmarks: {
          sweScore: 89,
          mmluScore: 90,
          aimeScore: 71,
          mathScore: 87,
          gpqaScore: 82,
          humanEvalScore: 88
        },
        pricing: { inputCost: 0.003, outputCost: 0.015, currency: 'USD' },
        metadata: { contextLength: 200000, modelSize: 'Large', releaseDate: '2024-06' }
      },
      {
        name: 'Gemini 1.5 Pro',
        provider: 'Google',
        overallScore: 8.8,
        performanceScore: 9.0,
        costScore: 8.0,
        speedScore: 8.5,
        benchmarks: {
          sweScore: 83,
          mmluScore: 88,
          aimeScore: 68,
          mathScore: 85,
          gpqaScore: 75,
          humanEvalScore: 86
        },
        pricing: { inputCost: 0.0035, outputCost: 0.0105, currency: 'USD' },
        metadata: { contextLength: 2000000, modelSize: 'Large', releaseDate: '2024-05' }
      },
      {
        name: 'Llama 3.1 405B',
        provider: 'Meta',
        overallScore: 8.5,
        performanceScore: 8.8,
        costScore: 6.5,
        speedScore: 7.5,
        benchmarks: {
          sweScore: 79,
          mmluScore: 85,
          aimeScore: 64,
          mathScore: 82,
          gpqaScore: 71,
          humanEvalScore: 84
        },
        pricing: { inputCost: 0.0016, outputCost: 0.0048, currency: 'USD' },
        metadata: { contextLength: 131072, modelSize: '405B', releaseDate: '2024-07' }
      },
      {
        name: 'GPT-3.5 Turbo',
        provider: 'OpenAI',
        overallScore: 7.8,
        performanceScore: 8.0,
        costScore: 9.5,
        speedScore: 9.2,
        benchmarks: {
          sweScore: 65,
          mmluScore: 78,
          aimeScore: 42,
          mathScore: 71,
          gpqaScore: 58,
          humanEvalScore: 76
        },
        pricing: { inputCost: 0.0005, outputCost: 0.0015, currency: 'USD' },
        metadata: { contextLength: 16384, modelSize: 'Medium', releaseDate: '2023-11' }
      }
    ];
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * Force refresh data from source
   */
  async refreshModels(): Promise<LLMModel[]> {
    this.clearCache();
    return this.getModels();
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { hasCachedData: boolean; cacheAge?: number; modelCount?: number } {
    if (!this.cache.models || !this.cache.timestamp) {
      return { hasCachedData: false };
    }

    return {
      hasCachedData: true,
      cacheAge: Date.now() - this.cache.timestamp,
      modelCount: this.cache.models.length
    };
  }
}
