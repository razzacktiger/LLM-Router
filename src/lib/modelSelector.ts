import { BenchmarkModel } from "@/types/leaderboard";

export interface PriorityItem {
  id: string;
  name: string;
  weight: number; // 1-3 based on position
}

export interface ModelScore {
  model: BenchmarkModel;
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

/**
 * Deterministic model selection based on mathematical scoring
 */
export class ModelSelector {
  /**
   * Select the optimal model based on user priorities and model data
   */
  selectOptimalModel(
    models: BenchmarkModel[],
    priorities: PriorityItem[],
    prompt?: string
  ): ModelScore | null {
    if (!models || models.length === 0) {
      return null;
    }

    // Calculate scores for all models
    const scoredModels = models.map(model =>
      this.calculateModelScore(model, priorities, prompt)
    );

    // Sort by total score (highest first)
    scoredModels.sort((a, b) => b.totalScore - a.totalScore);

    console.log("🔢 Model Scores (deterministic):");
    scoredModels.slice(0, 5).forEach((score, index) => {
      console.log(
        `${index + 1}. ${score.model.name}: ${score.totalScore.toFixed(2)} (Cost: ${score.breakdown.weightedCost.toFixed(1)}, Perf: ${score.breakdown.weightedPerformance.toFixed(1)}, Speed: ${score.breakdown.weightedSpeed.toFixed(1)})`
      );
    });

    return scoredModels[0];
  }

  /**
   * Calculate weighted score for a single model
   */
  private calculateModelScore(
    model: BenchmarkModel,
    priorities: PriorityItem[],
    prompt?: string
  ): ModelScore {
    // Parse scores (handle string/number conversion)
    const costScore = this.parseScore(model.cost_efficiency);
    const performanceScore = this.parseScore(model.performance_score);
    const speedScore = this.parseScore(model.speed_score);

    // Apply task-specific bonuses (optional enhancement)
    const taskBonus = this.getTaskSpecificBonus(model, prompt);
    const adjustedPerformanceScore = Math.min(10, performanceScore + taskBonus);

    // Get priority weights
    const weights = this.getPriorityWeights(priorities);

    // Calculate weighted scores
    const weightedCost = costScore * weights.cost;
    const weightedPerformance = adjustedPerformanceScore * weights.performance;
    const weightedSpeed = speedScore * weights.speed;

    // Total score (normalized to 0-100 scale)
    const totalScore =
      ((weightedCost + weightedPerformance + weightedSpeed) /
        (weights.cost + weights.performance + weights.speed)) *
      10;

    return {
      model,
      totalScore,
      breakdown: {
        costScore,
        performanceScore: adjustedPerformanceScore,
        speedScore,
        weightedCost,
        weightedPerformance,
        weightedSpeed,
      },
    };
  }

  /**
   * Parse score from string or number
   */
  private parseScore(score: string | number): number {
    if (typeof score === "number") return score;
    if (typeof score === "string") {
      const parsed = parseFloat(score);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Convert priority order to weights
   */
  private getPriorityWeights(priorities: PriorityItem[]): {
    cost: number;
    performance: number;
    speed: number;
  } {
    const weights = { cost: 1, performance: 1, speed: 1 }; // default weights

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

    return weights;
  }

  /**
   * Apply task-specific performance bonuses
   */
  private getTaskSpecificBonus(model: BenchmarkModel, prompt?: string): number {
    if (!prompt) return 0;

    const promptLower = prompt.toLowerCase();
    let bonus = 0;

    // Coding tasks - boost models with high SWE-Bench scores
    if (this.isCodingTask(promptLower)) {
      const sweBenchScore = model.benchmarks?.sweBench || 0;
      if (sweBenchScore >= 85) bonus += 0.5;
      else if (sweBenchScore >= 75) bonus += 0.3;
    }

    // Math tasks - boost models with high AIME scores
    if (this.isMathTask(promptLower)) {
      const aimeScore = model.benchmarks?.aime2024 || 0;
      if (aimeScore >= 80) bonus += 0.5;
      else if (aimeScore >= 70) bonus += 0.3;
    }

    // Function calling tasks - boost models with high BFCL scores
    if (this.isFunctionCallingTask(promptLower)) {
      const bfclScore = model.benchmarks?.bfcl || 0;
      if (bfclScore >= 90) bonus += 0.5;
      else if (bfclScore >= 80) bonus += 0.3;
    }

    return bonus;
  }

  private isCodingTask(prompt: string): boolean {
    const codingKeywords = [
      "function",
      "code",
      "program",
      "algorithm",
      "debug",
      "implement",
      "python",
      "javascript",
      "typescript",
      "java",
      "c++",
      "sql",
      "api",
      "class",
      "method",
      "variable",
      "loop",
      "array",
      "object",
    ];
    return codingKeywords.some(keyword => prompt.includes(keyword));
  }

  private isMathTask(prompt: string): boolean {
    const mathKeywords = [
      "calculate",
      "equation",
      "solve",
      "formula",
      "mathematics",
      "algebra",
      "geometry",
      "statistics",
      "probability",
      "integral",
      "derivative",
      "matrix",
      "vector",
      "theorem",
      "proof",
    ];
    return mathKeywords.some(keyword => prompt.includes(keyword));
  }

  private isFunctionCallingTask(prompt: string): boolean {
    const functionKeywords = [
      "call",
      "api",
      "tool",
      "execute",
      "run",
      "invoke",
      "trigger",
      "webhook",
      "endpoint",
      "service",
      "integration",
      "automation",
    ];
    return functionKeywords.some(keyword => prompt.includes(keyword));
  }
}

// Export singleton instance
export const modelSelector = new ModelSelector();
