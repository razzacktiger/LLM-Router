import type { LLMModel, PriorityWeights, ModelScore, PriorityItem } from '../types';
import { LanguageDetector, LanguageDetectionResult } from '../utils/LanguageDetector';

/**
 * Deterministic model selection based on mathematical scoring with advanced language detection
 */
export class ModelSelector {
  /**
   * Select the optimal model based on user priorities and model data with smart language detection
   */
  selectOptimalModel(
    models: LLMModel[],
    priorities: PriorityWeights,
    prompt?: string
  ): LLMModel & { score: number; languageContext?: LanguageDetectionResult } {
    if (!models || models.length === 0) {
      throw new Error('No models provided for selection');
    }

    // Detect language and adjust priorities if prompt provided
    let languageContext: LanguageDetectionResult | undefined;
    let adjustedPriorities = priorities;

    if (prompt) {
      languageContext = LanguageDetector.detectLanguage(prompt);
      if (languageContext.confidence > 0.3) {
        const recommendations = LanguageDetector.getRecommendedCharacteristics(languageContext);
        adjustedPriorities = this.smartPriorityAdjustment(priorities, languageContext, recommendations);
      }
    }

    // Calculate scores for all models
    const scoredModels = models.map(model => {
      const score = this.calculateModelScore(model, adjustedPriorities, prompt);
      return { ...model, score, languageContext };
    });

    // Sort by total score (highest first)
    scoredModels.sort((a, b) => b.score - a.score);

    return scoredModels[0];
  }

  /**
   * Smart priority adjustment based on detected language and domain
   */
  private smartPriorityAdjustment(
    basePriorities: PriorityWeights, 
    languageContext: LanguageDetectionResult,
    recommendations: any
  ): PriorityWeights {
    // Start with base priorities
    let adjusted = { ...basePriorities };
    
    // Apply domain-specific adjustments
    const domainAdjustments = recommendations.priorities;
    
    // Blend original priorities with recommendations (70% recommendation, 30% original)
    adjusted = {
      performance: domainAdjustments.performance * 0.7 + basePriorities.performance * 0.3,
      cost: domainAdjustments.cost * 0.7 + basePriorities.cost * 0.3,
      speed: domainAdjustments.speed * 0.7 + basePriorities.speed * 0.3
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
   * Apply task-specific performance bonuses with enhanced language detection
   */
  private getTaskSpecificBonus(model: LLMModel, prompt?: string): number {
    if (!prompt) return 0;

    const promptLower = prompt.toLowerCase();
    let bonus = 0;

    // Use advanced language detection
    const languageContext = LanguageDetector.detectLanguage(prompt);
    
    if (languageContext.confidence > 0.2) {
      // Apply language-specific bonuses
      bonus += this.getAdvancedLanguageBonus(model, languageContext);
    }

    // Coding tasks - boost models with high SWE-Bench scores
    if (this.isCodingTask(promptLower)) {
      const sweBenchScore = model.benchmarks?.sweScore || 0;
      if (sweBenchScore >= 85) bonus += 0.5;
      else if (sweBenchScore >= 75) bonus += 0.3;

      // Additional legacy bonus for backward compatibility
      const languageBonus = this.getLanguageSpecificBonus(promptLower, model);
      bonus += languageBonus;
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

    return Math.min(bonus, 1.0); // Cap at 1.0 bonus
  }

  /**
   * Advanced language and domain-specific bonus system
   */
  private getAdvancedLanguageBonus(model: LLMModel, context: LanguageDetectionResult): number {
    let bonus = 0;

    // Domain-specific model preferences
    const domainModelPreferences = {
      'systems': { 'Claude': 0.3, 'GPT-4': 0.25, 'GPT-3.5': 0.1 },
      'web': { 'GPT-4': 0.2, 'Claude': 0.2, 'Gemini': 0.15, 'GPT-3.5': 0.15 },
      'mobile': { 'GPT-4': 0.25, 'Claude': 0.2, 'Gemini': 0.15 },
      'data-science': { 'GPT-4': 0.3, 'Claude': 0.25, 'Gemini': 0.2 },
      'enterprise': { 'GPT-4': 0.25, 'Claude': 0.2, 'GPT-3.5': 0.15 },
      'game-dev': { 'GPT-4': 0.25, 'Claude': 0.2 },
      'general': { 'GPT-4': 0.15, 'Claude': 0.15, 'Gemini': 0.1 }
    };

    const preferences = domainModelPreferences[context.domain] || domainModelPreferences['general'];
    
    // Check if model matches preferred models for this domain
    for (const [modelType, bonusValue] of Object.entries(preferences)) {
      if (model.name.includes(modelType)) {
        bonus += bonusValue * context.confidence;
        break;
      }
    }

    // Language-specific bonuses
    if (context.language) {
      const languageBonuses: Record<string, number> = {
        'Rust': 0.2, 'C++': 0.15, 'Go': 0.15,
        'Python': 0.1, 'JavaScript': 0.1, 'TypeScript': 0.1,
        'Swift': 0.2, 'Kotlin': 0.2, 'Dart': 0.15,
        'Java': 0.1, 'Scala': 0.15, 'C#': 0.1,
        'R': 0.15, 'Julia': 0.2
      };
      
      const langBonus = languageBonuses[context.language] || 0.05;
      bonus += langBonus * context.confidence;
    }

    // Framework-specific bonuses
    if (context.framework) {
      const frameworkBonuses: Record<string, number> = {
        'react': 0.1, 'vue': 0.1, 'angular': 0.1,
        'django': 0.1, 'flask': 0.1, 'fastapi': 0.1,
        'spring': 0.1, 'unity': 0.15, 'flutter': 0.15,
        'tensorflow': 0.15, 'pytorch': 0.15
      };
      
      const frameworkBonus = frameworkBonuses[context.framework] || 0.05;
      bonus += frameworkBonus * context.confidence;
    }

    return bonus;
  }

  /**
   * Get language-specific bonuses for programming tasks
   */
  private getLanguageSpecificBonus(prompt: string, model: LLMModel): number {
    let bonus = 0;

    // Systems programming languages (Rust, C++, C, Go)
    if (this.isSystemsLanguage(prompt)) {
      // Models that typically excel at systems programming
      if (model.name.includes('Claude') || model.name.includes('GPT-4')) {
        bonus += 0.2;
      }
    }

    // Web development languages (JavaScript, TypeScript, Python web)
    if (this.isWebDevelopment(prompt)) {
      // Models good at web development
      if (model.name.includes('GPT') || model.name.includes('Claude')) {
        bonus += 0.15;
      }
    }

    // Mobile development (Swift, Kotlin, React Native, Flutter)
    if (this.isMobileDevelopment(prompt)) {
      // Models with good mobile dev knowledge
      if (model.name.includes('GPT-4') || model.name.includes('Claude')) {
        bonus += 0.2;
      }
    }

    // Data science/ML languages (Python, R, Julia)
    if (this.isDataScienceLanguage(prompt)) {
      // Models good at data science
      if (model.name.includes('GPT-4') || model.name.includes('Claude') || model.name.includes('Gemini')) {
        bonus += 0.25;
      }
    }

    return bonus;
  }

  private isCodingTask(prompt: string): boolean {
    const codingKeywords = [
      // General coding terms
      "function", "code", "program", "algorithm", "debug", "implement",
      "api", "class", "method", "variable", "loop", "array", "object",
      "refactor", "optimize", "compile", "syntax", "framework", "library",
      
      // Programming languages
      "python", "javascript", "typescript", "java", "c++", "cpp", "rust",
      "go", "golang", "swift", "kotlin", "php", "ruby", "scala", "clojure",
      "haskell", "elixir", "dart", "julia", "r", "matlab", "perl", "lua",
      "assembly", "sql", "html", "css", "shell", "bash", "powershell",
      
      // Frameworks and technologies
      "react", "vue", "angular", "node", "express", "django", "flask",
      "spring", "laravel", "rails", "tensorflow", "pytorch", "pandas",
      "numpy", "docker", "kubernetes", "aws", "azure", "gcp"
    ];
    return codingKeywords.some(keyword => prompt.includes(keyword));
  }

  private isSystemsLanguage(prompt: string): boolean {
    const systemsKeywords = [
      "rust", "c++", "cpp", "c programming", "go", "golang", "zig",
      "assembly", "kernel", "operating system", "embedded", "performance",
      "memory management", "concurrency", "threading", "low level",
      "systems programming", "bare metal", "microcontroller"
    ];
    return systemsKeywords.some(keyword => prompt.includes(keyword));
  }

  private isWebDevelopment(prompt: string): boolean {
    const webKeywords = [
      "javascript", "typescript", "react", "vue", "angular", "html", "css",
      "node", "express", "next", "nuxt", "svelte", "web app", "website",
      "frontend", "backend", "fullstack", "rest api", "graphql", "websocket",
      "dom", "browser", "http", "https", "json", "ajax", "fetch"
    ];
    return webKeywords.some(keyword => prompt.includes(keyword));
  }

  private isMobileDevelopment(prompt: string): boolean {
    const mobileKeywords = [
      "swift", "kotlin", "ios", "android", "react native", "flutter",
      "dart", "xcode", "android studio", "mobile app", "smartphone",
      "tablet", "swiftui", "jetpack compose", "objective-c", "java android",
      "xamarin", "cordova", "phonegap", "ionic"
    ];
    return mobileKeywords.some(keyword => prompt.includes(keyword));
  }

  private isDataScienceLanguage(prompt: string): boolean {
    const dataKeywords = [
      "python", "r programming", "julia", "matlab", "pandas", "numpy",
      "scikit", "tensorflow", "pytorch", "keras", "data science",
      "machine learning", "deep learning", "neural network", "ai model",
      "statistics", "data analysis", "visualization", "jupyter", "notebook",
      "matplotlib", "seaborn", "plotly", "data mining", "big data"
    ];
    return dataKeywords.some(keyword => prompt.includes(keyword));
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
