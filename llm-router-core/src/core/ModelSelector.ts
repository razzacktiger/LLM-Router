import type { LLMModel, PriorityWeights, ModelScore, PriorityItem } from '../types';

/**
 * Deterministic model selection based on mathematical scoring
 */
export class ModelSelector {
  /**
   * Select the optimal model based on user priorities and model data
   */
  selectOptimalModel(
    models: LLMModel[],
    priorities: PriorityWeights,
    prompt?: string
  ): LLMModel & { score: number } {
    if (!models || models.length === 0) {
      throw new Error('No models provided for selection');
    }

    // Calculate scores for all models
    const scoredModels = models.map(model => {
      const score = this.calculateModelScore(model, priorities, prompt);
      return { ...model, score };
    });

    // Sort by total score (highest first)
    scoredModels.sort((a, b) => b.score - a.score);

    return scoredModels[0];
  }

  /**
   * Calculate weighted score for a single model
   */
  calculateModelScore(
    model: LLMModel,
    priorities: PriorityWeights,
    prompt?: string
  ): number {
    // Apply task-specific bonuses
    const taskBonus = this.getTaskSpecificBonus(model, prompt);
    const adjustedPerformanceScore = Math.min(10, model.performanceScore + taskBonus);

    // Calculate weighted scores
    const weightedCost = model.costScore * priorities.cost;
    const weightedPerformance = adjustedPerformanceScore * priorities.performance;
    const weightedSpeed = model.speedScore * priorities.speed;

    // Total score (normalized to 0-10 scale)
    return weightedCost + weightedPerformance + weightedSpeed;
  }

  /**
   * Adjust priorities based on task type
   */
  adjustPriorities(
    basePriorities: PriorityWeights, 
    taskType: string
  ): PriorityWeights {
    const adjustments: Record<string, Partial<PriorityWeights>> = {
      'CODING': { performance: 1.4, speed: 0.9 },
      'MATH': { performance: 1.5, cost: 0.8 },
      'CREATIVE': { speed: 1.3, cost: 1.2 },
      'BUSINESS': { cost: 1.3, speed: 1.1 },
      'RESEARCH': { performance: 1.2, cost: 1.1 },
      'REASONING': { performance: 1.4, speed: 0.9 }
    };

    const adjustment = adjustments[taskType] || {};
    
    let adjusted = {
      performance: basePriorities.performance * (adjustment.performance || 1),
      cost: basePriorities.cost * (adjustment.cost || 1),
      speed: basePriorities.speed * (adjustment.speed || 1)
    };

    // Normalize to sum to 1
    const total = adjusted.performance + adjusted.cost + adjusted.speed;
    return {
      performance: adjusted.performance / total,
      cost: adjusted.cost / total,
      speed: adjusted.speed / total
    };
  }

  /**
   * Get top alternatives
   */
  getTopAlternatives(
    models: LLMModel[], 
    priorities: PriorityWeights,
    count: number = 3,
    prompt?: string
  ): Array<LLMModel & { score: number }> {
    const scoredModels = models.map(model => ({
      ...model,
      score: this.calculateModelScore(model, priorities, prompt)
    }));

    return scoredModels
      .sort((a, b) => b.score - a.score)
      .slice(1, count + 1); // Skip the first one (that's the selected model)
  }

  /**
   * Get top models for specific priorities with budget filtering
   */
  getTopModelsForPriorities(
    models: LLMModel[],
    priorities: PriorityWeights,
    options?: { budget?: 'low' | 'medium' | 'high'; count?: number }
  ): LLMModel[] {
    let filteredModels = models;

    // Filter by budget if specified
    if (options?.budget) {
      const budgetThresholds = {
        low: 7,    // costScore >= 7
        medium: 5, // costScore >= 5
        high: 0    // no filter
      };
      
      const threshold = budgetThresholds[options.budget];
      filteredModels = models.filter(m => m.costScore >= threshold);
    }

    // Score and sort
    const scoredModels = filteredModels.map(model => ({
      ...model,
      score: this.calculateModelScore(model, priorities)
    }));

    return scoredModels
      .sort((a, b) => b.score - a.score)
      .slice(0, options?.count || 10);
  }

  /**
   * Convert priority items to priority weights (for backward compatibility)
   */
  convertPriorityItemsToWeights(priorities: PriorityItem[]): PriorityWeights {
    const weights = { cost: 1, performance: 1, speed: 1 };

    priorities.forEach((priority, index) => {
      const weight = priorities.length - index; // First = 3, Second = 2, Third = 1

      switch (priority.id) {
        case "cost":
          weights.cost = weight;
          break;
        case "performance":
          weights.performance = weight;
          break;
        case "speed":
          weights.speed = weight;
          break;
      }
    });

    // Normalize to sum to 1
    const total = weights.cost + weights.performance + weights.speed;
    return {
      cost: weights.cost / total,
      performance: weights.performance / total,
      speed: weights.speed / total
    };
  }

  /**
   * Apply task-specific performance bonuses
   */
  private getTaskSpecificBonus(model: LLMModel, prompt?: string): number {
    if (!prompt) return 0;

    const promptLower = prompt.toLowerCase();
    let bonus = 0;

    // Coding tasks - boost models with high SWE-Bench scores
    if (this.isCodingTask(promptLower)) {
      const sweBenchScore = model.benchmarks?.sweScore || 0;
      if (sweBenchScore >= 85) bonus += 0.5;
      else if (sweBenchScore >= 75) bonus += 0.3;
    }

    // Math tasks - boost models with high AIME scores
    if (this.isMathTask(promptLower)) {
      const aimeScore = model.benchmarks?.aimeScore || 0;
      if (aimeScore >= 80) bonus += 0.5;
      else if (aimeScore >= 70) bonus += 0.3;
    }

    // Function calling tasks - boost models with high HumanEval scores
    if (this.isFunctionCallingTask(promptLower)) {
      const humanEvalScore = model.benchmarks?.humanEvalScore || 0;
      if (humanEvalScore >= 90) bonus += 0.5;
      else if (humanEvalScore >= 80) bonus += 0.3;
    }

    return bonus;
  }

  private isCodingTask(prompt: string): boolean {
    const codingKeywords = [
      "function", "code", "program", "algorithm", "debug", "implement",
      "python", "javascript", "typescript", "java", "c++", "sql",
      "api", "class", "method", "variable", "loop", "array", "object"
    ];
    return codingKeywords.some(keyword => prompt.includes(keyword));
  }

  private isMathTask(prompt: string): boolean {
    const mathKeywords = [
      "calculate", "equation", "solve", "formula", "mathematics",
      "algebra", "geometry", "statistics", "probability", "integral",
      "derivative", "matrix", "vector", "theorem", "proof"
    ];
    return mathKeywords.some(keyword => prompt.includes(keyword));
  }

  private isFunctionCallingTask(prompt: string): boolean {
    const functionKeywords = [
      "call", "api", "tool", "execute", "run", "invoke", "trigger",
      "webhook", "endpoint", "service", "integration", "automation"
    ];
    return functionKeywords.some(keyword => prompt.includes(keyword));
  }
}
