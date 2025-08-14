import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMModel, PriorityWeights, TaskAnalysis } from '../types';

export class GeminiProvider {
  private genAI?: GoogleGenerativeAI;
  private model?: any;
  private hasApiKey: boolean;

  constructor(apiKey?: string) {
    this.hasApiKey = Boolean(apiKey);
    
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    }
  }

  /**
   * Analyze task and get AI recommendations
   */
  async analyzeTask(
    prompt: string, 
    availableModels: LLMModel[], 
    userPriorities: PriorityWeights
  ): Promise<TaskAnalysis> {
    // If no API key, use fallback analysis immediately
    if (!this.hasApiKey || !this.model) {
      console.warn('No Gemini API key provided, using keyword-based analysis');
      return this.keywordBasedAnalysis(prompt);
    }

    try {
      const modelContext = this.buildModelContext(availableModels);
      const analysisPrompt = this.buildAnalysisPrompt(prompt, modelContext, userPriorities);
      
      const result = await this.model.generateContent(analysisPrompt);
      const response = result.response.text();
      
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.warn('Gemini analysis failed, using fallback:', error instanceof Error ? error.message : String(error));
      // Fallback to keyword-based analysis
      return this.keywordBasedAnalysis(prompt);
    }
  }

  private buildModelContext(models: LLMModel[]): string {
    if (!models || models.length === 0) {
      return "No specific models available for analysis.";
    }

    // Sort models by overall score
    const sortedModels = models.sort((a, b) => b.overallScore - a.overallScore);

    // Group into tiers
    const topTier = sortedModels.slice(0, 10);
    const midTier = sortedModels.slice(10, 25);
    const budgetTier = sortedModels.slice(25);

    // Categorize by specialty
    const codingModels = models.filter(m => 
      (m.benchmarks.sweScore && m.benchmarks.sweScore > 20) || 
      (m.benchmarks.humanEvalScore && m.benchmarks.humanEvalScore > 70) ||
      m.name.toLowerCase().includes('code')
    );
    
    const mathModels = models.filter(m => 
      (m.benchmarks.aimeScore && m.benchmarks.aimeScore > 30) || 
      (m.benchmarks.mathScore && m.benchmarks.mathScore > 70)
    );
    
    const generalModels = models.filter(m => 
      (m.benchmarks.mmluScore && m.benchmarks.mmluScore > 80) || 
      (m.benchmarks.gpqaScore && m.benchmarks.gpqaScore > 40)
    );

    return `LEADERBOARD CONTEXT (${models.length} models available):

TOP TIER MODELS (Highest Performance):
${topTier.slice(0, 5).map(m => `• ${m.name} (${m.provider}): Performance=${m.performanceScore}/10, Cost=${m.costScore}/10, Speed=${m.speedScore}/10`).join('\n')}

SPECIALIZED MODEL RECOMMENDATIONS:
• Coding/Programming: ${codingModels.slice(0, 5).map(m => m.name).join(', ')}
• Mathematics: ${mathModels.slice(0, 5).map(m => m.name).join(', ')}
• General Knowledge: ${generalModels.slice(0, 5).map(m => m.name).join(', ')}

MID-TIER OPTIONS (${midTier.length} models): Good balance of performance and cost
BUDGET OPTIONS (${budgetTier.length} models): Cost-effective for simpler tasks

BENCHMARK KEY:
- SWE-Bench: Software engineering/coding tasks
- MMLU: Massive multitask language understanding  
- AIME: Advanced mathematics competition
- Math-500: Mathematical problem solving
- GPQA: Graduate-level science questions
- HumanEval: Python programming evaluation`;
  }

  private buildAnalysisPrompt(prompt: string, modelContext: string, priorities: PriorityWeights): string {
    return `You are an expert AI model selection assistant with access to comprehensive leaderboard data. Analyze this user prompt and recommend the best model selection strategy from ALL available models.

USER PROMPT: "${prompt}"

USER PRIORITIES:
- Performance: ${priorities.performance.toFixed(1)} (${(priorities.performance * 100).toFixed(0)}%)
- Cost: ${priorities.cost.toFixed(1)} (${(priorities.cost * 100).toFixed(0)}%)
- Speed: ${priorities.speed.toFixed(1)} (${(priorities.speed * 100).toFixed(0)}%)

${modelContext}

SELECTION STRATEGY:
Consider ALL tiers of models available:
- TOP TIER: Use for complex, high-stakes tasks requiring maximum performance
- MID TIER: Use for balanced performance/cost ratio, most common tasks
- BUDGET: Use for simple tasks, rapid prototyping, or cost-sensitive scenarios

TASK CLASSIFICATION:
Classify the task into ONE of these categories and explain why:
- CODING: Programming, debugging, algorithm implementation, code review
- MATH: Mathematical calculations, problem solving, statistical analysis
- RESEARCH: Information gathering, data analysis, summarization, fact-checking
- CREATIVE: Writing, storytelling, brainstorming, content creation
- BUSINESS: Professional communications, reports, strategy, analysis
- REASONING: Logic puzzles, complex analysis, multi-step problem solving

ANALYSIS REQUIREMENTS:
1. Consider ALL available models across different tiers
2. Match models to task complexity (don't always recommend top tier)
3. Consider specialized models for specific domains (coding, math, etc.)
4. Balance performance, speed, and cost based on task requirements
5. Provide alternatives across different budget levels

Return ONLY a valid JSON object with this exact format:
{
  "taskType": "CODING",
  "complexity": "MEDIUM",
  "reasoning": "This task requires solid programming capabilities but doesn't need the absolute top-tier models. Mid-tier coding specialists would be cost-effective.",
  "recommendedModels": [
    "Primary recommendation from specialized models",
    "Alternative from mid-tier for cost efficiency",
    "Budget option for simple cases"
  ],
  "suggestedPriorities": {
    "performance": 0.6,
    "cost": 0.2,
    "speed": 0.2
  }
}`;
  }

  private parseAnalysisResponse(response: string): TaskAnalysis {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate required fields
        if (parsed.taskType && parsed.complexity && parsed.reasoning) {
          return {
            taskType: parsed.taskType,
            complexity: parsed.complexity,
            reasoning: parsed.reasoning,
            recommendedModels: parsed.recommendedModels || [],
            suggestedPriorities: parsed.suggestedPriorities || { performance: 0.4, cost: 0.3, speed: 0.3 }
          };
        }
      }
    } catch (error) {
      console.warn('Failed to parse Gemini response:', error instanceof Error ? error.message : String(error));
    }
    
    // Fallback analysis
    return this.keywordBasedAnalysis(response);
  }

  private keywordBasedAnalysis(prompt: string): TaskAnalysis {
    const lowerPrompt = prompt.toLowerCase();
    
    // Coding detection
    if (lowerPrompt.includes('code') || lowerPrompt.includes('function') || 
        lowerPrompt.includes('algorithm') || lowerPrompt.includes('program') ||
        lowerPrompt.includes('debug') || lowerPrompt.includes('implement')) {
      return {
        taskType: 'CODING',
        complexity: 'MEDIUM',
        reasoning: 'Detected coding-related keywords in the prompt',
        recommendedModels: [],
        suggestedPriorities: { performance: 0.6, cost: 0.2, speed: 0.2 }
      };
    }
    
    // Math detection
    if (lowerPrompt.includes('calculate') || lowerPrompt.includes('math') ||
        lowerPrompt.includes('equation') || lowerPrompt.includes('solve') ||
        lowerPrompt.includes('formula') || lowerPrompt.includes('statistics')) {
      return {
        taskType: 'MATH',
        complexity: 'MEDIUM',
        reasoning: 'Detected mathematical keywords in the prompt',
        recommendedModels: [],
        suggestedPriorities: { performance: 0.7, cost: 0.2, speed: 0.1 }
      };
    }
    
    // Creative detection
    if (lowerPrompt.includes('write') || lowerPrompt.includes('story') ||
        lowerPrompt.includes('creative') || lowerPrompt.includes('brainstorm') ||
        lowerPrompt.includes('content') || lowerPrompt.includes('blog')) {
      return {
        taskType: 'CREATIVE',
        complexity: 'MEDIUM',
        reasoning: 'Detected creative writing keywords in the prompt',
        recommendedModels: [],
        suggestedPriorities: { performance: 0.3, cost: 0.4, speed: 0.3 }
      };
    }
    
    // Business detection
    if (lowerPrompt.includes('business') || lowerPrompt.includes('report') ||
        lowerPrompt.includes('strategy') || lowerPrompt.includes('email') ||
        lowerPrompt.includes('professional') || lowerPrompt.includes('meeting')) {
      return {
        taskType: 'BUSINESS',
        complexity: 'MEDIUM',
        reasoning: 'Detected business-related keywords in the prompt',
        recommendedModels: [],
        suggestedPriorities: { performance: 0.3, cost: 0.5, speed: 0.2 }
      };
    }
    
    // Default to research
    return {
      taskType: 'RESEARCH',
      complexity: 'MEDIUM', 
      reasoning: 'General task analysis - defaulting to research classification',
      recommendedModels: [],
      suggestedPriorities: { performance: 0.4, cost: 0.3, speed: 0.3 }
    };
  }
}
