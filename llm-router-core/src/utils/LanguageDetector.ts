/**
 * Utility functions for detecting programming languages and frameworks
 */

export interface LanguageDetectionResult {
  language?: string;
  framework?: string;
  domain: 'web' | 'mobile' | 'systems' | 'data-science' | 'game-dev' | 'enterprise' | 'general';
  confidence: number;
  characteristics: string[];
}

export class LanguageDetector {
  /**
   * Detect programming language and context from prompt
   */
  static detectLanguage(prompt: string): LanguageDetectionResult {
    const lowerPrompt = prompt.toLowerCase();
    let maxConfidence = 0;
    let bestMatch: LanguageDetectionResult = {
      domain: 'general',
      confidence: 0,
      characteristics: []
    };

    // Language patterns with associated domains and frameworks
    const languagePatterns = [
      // Web Development
      {
        language: 'JavaScript',
        patterns: ['javascript', 'js', 'node', 'react', 'vue', 'angular', 'express'],
        frameworks: ['react', 'vue', 'angular', 'express', 'next', 'nuxt', 'svelte'],
        domain: 'web' as const,
        characteristics: ['frontend', 'backend', 'fullstack', 'spa', 'ssr']
      },
      {
        language: 'TypeScript',
        patterns: ['typescript', 'ts', 'tsx'],
        frameworks: ['angular', 'react', 'vue', 'nest'],
        domain: 'web' as const,
        characteristics: ['type-safe', 'scalable', 'enterprise']
      },
      {
        language: 'Python',
        patterns: ['python', 'py', 'django', 'flask', 'fastapi', 'pandas', 'numpy'],
        frameworks: ['django', 'flask', 'fastapi', 'tensorflow', 'pytorch', 'pandas'],
        domain: 'data-science' as const,
        characteristics: ['data-science', 'ml', 'ai', 'web', 'automation']
      },

      // Mobile Development
      {
        language: 'Swift',
        patterns: ['swift', 'ios', 'swiftui', 'xcode', 'cocoa'],
        frameworks: ['swiftui', 'uikit', 'core-data'],
        domain: 'mobile' as const,
        characteristics: ['ios', 'native', 'performance']
      },
      {
        language: 'Kotlin',
        patterns: ['kotlin', 'android', 'jetpack compose'],
        frameworks: ['jetpack compose', 'android jetpack'],
        domain: 'mobile' as const,
        characteristics: ['android', 'native', 'interop']
      },
      {
        language: 'Dart',
        patterns: ['dart', 'flutter'],
        frameworks: ['flutter'],
        domain: 'mobile' as const,
        characteristics: ['cross-platform', 'ui', 'native-performance']
      },

      // Systems Programming
      {
        language: 'Rust',
        patterns: ['rust', 'cargo', 'tokio', 'actix'],
        frameworks: ['tokio', 'actix', 'warp', 'rocket'],
        domain: 'systems' as const,
        characteristics: ['memory-safe', 'performance', 'concurrency']
      },
      {
        language: 'Go',
        patterns: ['go', 'golang', 'gin', 'echo', 'goroutine'],
        frameworks: ['gin', 'echo', 'fiber', 'beego'],
        domain: 'systems' as const,
        characteristics: ['concurrent', 'microservices', 'cloud-native']
      },
      {
        language: 'C++',
        patterns: ['c++', 'cpp', 'stl', 'boost'],
        frameworks: ['boost', 'qt', 'opencv'],
        domain: 'systems' as const,
        characteristics: ['performance', 'low-level', 'memory-management']
      },

      // Enterprise/JVM
      {
        language: 'Java',
        patterns: ['java', 'spring', 'hibernate', 'maven', 'gradle'],
        frameworks: ['spring', 'hibernate', 'struts', 'jsf'],
        domain: 'enterprise' as const,
        characteristics: ['enterprise', 'scalable', 'jvm', 'cross-platform']
      },
      {
        language: 'Scala',
        patterns: ['scala', 'akka', 'play', 'spark'],
        frameworks: ['akka', 'play', 'spark'],
        domain: 'enterprise' as const,
        characteristics: ['functional', 'concurrent', 'big-data']
      },

      // Data Science
      {
        language: 'R',
        patterns: ['r programming', ' r ', 'ggplot', 'shiny', 'tidyverse'],
        frameworks: ['shiny', 'ggplot2', 'tidyverse'],
        domain: 'data-science' as const,
        characteristics: ['statistics', 'visualization', 'research']
      },
      {
        language: 'Julia',
        patterns: ['julia', 'julialang'],
        frameworks: ['plots.jl', 'flux.jl'],
        domain: 'data-science' as const,
        characteristics: ['scientific-computing', 'performance', 'numerical']
      },

      // Game Development
      {
        language: 'C#',
        patterns: ['c#', 'csharp', 'unity', '.net', 'asp.net'],
        frameworks: ['unity', '.net', 'asp.net', 'xamarin'],
        domain: 'game-dev' as const,
        characteristics: ['game-dev', 'enterprise', 'cross-platform']
      }
    ];

    // Check each language pattern
    for (const lang of languagePatterns) {
      let confidence = 0;
      const foundCharacteristics: string[] = [];

      // Check language patterns
      for (const pattern of lang.patterns) {
        if (lowerPrompt.includes(pattern)) {
          confidence += 0.3;
        }
      }

      // Check framework patterns
      for (const framework of lang.frameworks || []) {
        if (lowerPrompt.includes(framework)) {
          confidence += 0.2;
          foundCharacteristics.push(`framework:${framework}`);
        }
      }

      // Check characteristics
      for (const characteristic of lang.characteristics) {
        if (lowerPrompt.includes(characteristic.replace('-', ' '))) {
          confidence += 0.1;
          foundCharacteristics.push(characteristic);
        }
      }

      // Update best match if this is better
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        bestMatch = {
          language: lang.language,
          framework: lang.frameworks?.find(f => lowerPrompt.includes(f)),
          domain: lang.domain,
          confidence: Math.min(confidence, 1.0),
          characteristics: [...new Set(foundCharacteristics)]
        };
      }
    }

    return bestMatch;
  }

  /**
   * Get recommended model characteristics based on detected language
   */
  static getRecommendedCharacteristics(detection: LanguageDetectionResult) {
    const recommendations = {
      priorities: { performance: 0.4, cost: 0.3, speed: 0.3 },
      modelPreferences: [] as string[],
      reasoning: ''
    };

    switch (detection.domain) {
      case 'systems':
        recommendations.priorities = { performance: 0.7, cost: 0.15, speed: 0.15 };
        recommendations.modelPreferences = ['Claude', 'GPT-4'];
        recommendations.reasoning = 'Systems programming requires high-performance models with strong coding capabilities';
        break;

      case 'web':
        recommendations.priorities = { performance: 0.5, cost: 0.3, speed: 0.2 };
        recommendations.modelPreferences = ['GPT-4', 'Claude', 'Gemini'];
        recommendations.reasoning = 'Web development benefits from balanced performance and cost efficiency';
        break;

      case 'mobile':
        recommendations.priorities = { performance: 0.6, cost: 0.2, speed: 0.2 };
        recommendations.modelPreferences = ['GPT-4', 'Claude'];
        recommendations.reasoning = 'Mobile development requires strong platform-specific knowledge';
        break;

      case 'data-science':
        recommendations.priorities = { performance: 0.8, cost: 0.1, speed: 0.1 };
        recommendations.modelPreferences = ['GPT-4', 'Claude', 'Gemini'];
        recommendations.reasoning = 'Data science tasks need high-performance models with strong analytical capabilities';
        break;

      case 'enterprise':
        recommendations.priorities = { performance: 0.6, cost: 0.2, speed: 0.2 };
        recommendations.modelPreferences = ['GPT-4', 'Claude'];
        recommendations.reasoning = 'Enterprise applications require reliable, well-architected solutions';
        break;

      case 'game-dev':
        recommendations.priorities = { performance: 0.7, cost: 0.15, speed: 0.15 };
        recommendations.modelPreferences = ['GPT-4', 'Claude'];
        recommendations.reasoning = 'Game development requires specialized knowledge and optimization';
        break;

      default:
        recommendations.reasoning = 'General programming task - balanced approach recommended';
    }

    return recommendations;
  }
}
