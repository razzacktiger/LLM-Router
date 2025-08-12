import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { modelSelector } from "@/lib/modelSelector";
import { Logger } from "@/utils/logger";

const logger = new Logger("API:HybridSelect");

export async function POST(request: NextRequest) {
  try {
    const { prompt, priorities, models } = await request.json();

    logger.info("Hybrid model selection", {
      promptLength: prompt?.length || 0,
      prioritiesCount: priorities?.length || 0,
      modelsCount: models?.length || 0,
    });

    // Validate input
    if (!models || models.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No models provided",
        },
        { status: 400 }
      );
    }

    if (!priorities || priorities.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No priorities provided",
        },
        { status: 400 }
      );
    }

    console.log("🤖 PHASE 1: Gemini Task Analysis");
    console.log("=================================");

    // PHASE 1: Use Gemini for task analysis and context understanding
    const taskAnalysis = await analyzeTaskWithGemini(prompt, models);
    console.log("📝 Task Analysis:", taskAnalysis);

    // PHASE 2: Use deterministic scoring for model selection
    console.log("\n🔢 PHASE 2: Deterministic Model Selection");
    console.log("=========================================");

    // Convert priorities to the format expected by ModelSelector
    const priorityItems = priorities.map((p: any, index: number) => ({
      id: p.id,
      name: p.name,
      weight: priorities.length - index,
    }));

    // Apply task-specific adjustments to priorities if needed
    const adjustedPriorities = adjustPrioritiesBasedOnTask(
      priorityItems,
      taskAnalysis
    );

    // Use deterministic model selection with task context
    const result = modelSelector.selectOptimalModel(
      models,
      adjustedPriorities,
      prompt
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: "No suitable model found",
        },
        { status: 404 }
      );
    }

    console.log(`\n🏆 FINAL SELECTION: ${result.model.name}`);
    console.log(`📊 Score: ${result.totalScore.toFixed(2)}/10`);
    console.log(`🧠 Task Context: ${taskAnalysis.taskType}`);

    return NextResponse.json({
      success: true,
      selectedModel: result.model,
      score: result.totalScore,
      breakdown: result.breakdown,
      taskAnalysis,
      reasoning: {
        method: "hybrid",
        explanation: `Enhanced AI analysis identified this as a ${taskAnalysis.taskType} task${taskAnalysis.complexity ? ` with ${taskAnalysis.complexity.toLowerCase()} complexity` : ''}. Selected ${result.model.name} based on weighted priorities: Cost (${result.breakdown.weightedCost.toFixed(1)}) + Performance (${result.breakdown.weightedPerformance.toFixed(1)}) + Speed (${result.breakdown.weightedSpeed.toFixed(1)}) = ${result.totalScore.toFixed(2)}`,
        priorities: adjustedPriorities,
        taskInsights: taskAnalysis.insights || [],
        aiReasoning: taskAnalysis.reasoning || "Basic task classification applied",
        recommendedModels: taskAnalysis.recommendedModels || [],
        benchmarkFocus: taskAnalysis.benchmarkFocus || [],
        taskType: taskAnalysis.taskType,
        complexity: taskAnalysis.complexity,
      },
    });
  } catch (error: any) {
    logger.error("Hybrid selection failed", {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Use Gemini to analyze the task and provide context with leaderboard data
 */
async function analyzeTaskWithGemini(prompt: string, models: any[] = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ No Gemini API key found, using basic task analysis");
    return basicTaskAnalysis(prompt);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Build model context from leaderboard data
    const modelContext = buildModelContext(models);

    const analysisPrompt = `You are an expert AI model selection assistant with access to comprehensive leaderboard data. Analyze this user prompt and recommend the best model selection strategy from ALL available models (not just the top performers).

USER PROMPT: "${prompt}"

AVAILABLE MODELS AND THEIR STRENGTHS:
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
- FUNCTION_CALLING: API usage, tool integration, automation, structured data
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
  "complexity": "Medium",
  "reasoning": "This task requires solid programming capabilities but doesn't need the absolute top-tier models. Mid-tier coding specialists would be cost-effective.",
  "insights": [
    "Task analysis insights",
    "Model selection rationale",
    "Performance expectations"
  ],
  "recommendedModels": [
    "Primary recommendation from specialized models",
    "Alternative from mid-tier for cost efficiency",
    "Budget option for simple cases"
  ],
  "priorityAdjustments": {
    "performance": 0.2,
    "speed": -0.1,
    "cost": -0.1
  },
  "benchmarkFocus": [
    "SWE-Bench for coding capability",
    "MMLU for general knowledge"
  ]
}

Adjust priority weights between -0.3 to +0.3 based on task requirements.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: analysisPrompt,
    });
    const text = response.text?.trim() || "";

    // Try to parse JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        console.log("✅ Enhanced Gemini analysis with leaderboard data");
        console.log("🎯 Task Type:", analysis.taskType);
        console.log("🧠 AI Reasoning:", analysis.reasoning);
        console.log("🏆 Recommended Models:", analysis.recommendedModels?.join(", "));
        return analysis;
      }
    } catch (parseError) {
      console.warn("⚠️ Failed to parse enhanced Gemini response, using fallback");
    }

    return basicTaskAnalysis(prompt);
  } catch (error) {
    console.warn("⚠️ Enhanced Gemini analysis failed, using basic analysis:", error);
    return basicTaskAnalysis(prompt);
  }
}

/**
 * Build context about available models from leaderboard data
 */
function buildModelContext(models: any[]): string {
  if (!models || models.length === 0) {
    return "No specific models available for analysis.";
  }

  // Group models by performance tier for better analysis
  const sortedModels = models.sort((a, b) => {
    const scoreA = a.performance_score || a.overall_score || 0;
    const scoreB = b.performance_score || b.overall_score || 0;
    return scoreB - scoreA;
  });

  // Top tier models (top 10)
  const topTierModels = sortedModels.slice(0, 10).map(model => {
    const scores = [];
    
    // Extract benchmark scores
    if (model.swe_bench_verified) scores.push(`SWE-Bench: ${model.swe_bench_verified}`);
    if (model.mmlu) scores.push(`MMLU: ${model.mmlu}`);
    if (model.aime_2024) scores.push(`AIME: ${model.aime_2024}`);
    if (model.math_500) scores.push(`Math-500: ${model.math_500}`);
    if (model.gpqa_diamond) scores.push(`GPQA: ${model.gpqa_diamond}`);
    if (model.humaneval) scores.push(`HumanEval: ${model.humaneval}`);
    
    // Performance indicators
    const performance = model.performance_score ? `Performance: ${model.performance_score}/10` : '';
    const cost = model.cost_efficiency ? `Cost: ${model.cost_efficiency}/10` : '';
    const speed = model.speed_score ? `Speed: ${model.speed_score}/10` : '';
    
    const benchmarkStr = scores.length > 0 ? scores.slice(0, 3).join(', ') : 'Limited benchmark data';
    const metricsStr = [performance, cost, speed].filter(Boolean).join(', ');
    
    return `• ${model.name} (${model.provider || 'Unknown'}): ${benchmarkStr}${metricsStr ? ` | ${metricsStr}` : ''}`;
  });

  // Mid-tier and budget models summary
  const midTierModels = sortedModels.slice(10, 25);
  const budgetModels = sortedModels.slice(25);

  // Categorize models by specialty
  const codingModels = models.filter(m => 
    (m.swe_bench_verified && m.swe_bench_verified > 20) || 
    (m.humaneval && m.humaneval > 70) ||
    m.name.toLowerCase().includes('code')
  );
  
  const mathModels = models.filter(m => 
    (m.aime_2024 && m.aime_2024 > 30) || 
    (m.math_500 && m.math_500 > 70)
  );
  
  const generalModels = models.filter(m => 
    (m.mmlu && m.mmlu > 80) || 
    (m.gpqa_diamond && m.gpqa_diamond > 40)
  );

  // Add summary statistics
  const totalModels = models.length;
  const providers = [...new Set(models.map(m => m.provider).filter(Boolean))];
  
  return `LEADERBOARD CONTEXT (${totalModels} models from ${providers.length} providers):

TOP TIER MODELS (Highest Performance):
${topTierModels.join('\n')}

SPECIALIZED MODEL RECOMMENDATIONS:
• Coding/Programming: ${codingModels.slice(0, 5).map(m => m.name).join(', ')}
• Mathematics: ${mathModels.slice(0, 5).map(m => m.name).join(', ')}
• General Knowledge: ${generalModels.slice(0, 5).map(m => m.name).join(', ')}

MID-TIER OPTIONS (${midTierModels.length} models): Good balance of performance and cost
BUDGET OPTIONS (${budgetModels.length} models): Cost-effective for simpler tasks

BENCHMARK KEY:
- SWE-Bench: Software engineering/coding tasks
- MMLU: Massive multitask language understanding  
- AIME: Advanced mathematics competition
- Math-500: Mathematical problem solving
- GPQA: Graduate-level science questions
- HumanEval: Python programming evaluation

Choose models based on which benchmarks align with the user's task requirements.`;
}

/**
 * Fallback task analysis without Gemini
 */
function basicTaskAnalysis(prompt: string) {
  const promptLower = prompt.toLowerCase();

  let taskType = "GENERAL";
  const insights = [];
  const priorityAdjustments = { performance: 0, speed: 0, cost: 0 };

  // Simple keyword-based classification
  if (
    promptLower.includes("function") ||
    promptLower.includes("code") ||
    promptLower.includes("program") ||
    promptLower.includes("debug")
  ) {
    taskType = "CODING";
    insights.push(
      "Code generation task",
      "Benefits from high SWE-Bench scores"
    );
    priorityAdjustments.performance = 0.1; // Boost performance for coding
  } else if (
    promptLower.includes("calculate") ||
    promptLower.includes("solve") ||
    promptLower.includes("math") ||
    promptLower.includes("equation")
  ) {
    taskType = "MATH";
    insights.push("Mathematical task", "Benefits from high AIME scores");
    priorityAdjustments.performance = 0.1;
  } else if (
    promptLower.includes("write") ||
    promptLower.includes("create") ||
    promptLower.includes("generate") ||
    promptLower.includes("story")
  ) {
    taskType = "CREATIVE";
    insights.push("Creative task", "May benefit from longer context");
    priorityAdjustments.speed = 0.1; // Boost speed for creative tasks
  }

  return {
    taskType,
    complexity: "Medium",
    insights,
    priorityAdjustments,
  };
}

/**
 * Adjust priorities based on enhanced AI task analysis
 */
function adjustPrioritiesBasedOnTask(priorities: any[], taskAnalysis: any) {
  console.log(
    "🧠 Original priorities:",
    priorities.map(p => `${p.name} (${p.weight}x)`).join(", ")
  );

  // Apply AI-suggested priority adjustments
  const adjustedPriorities = priorities.map(priority => {
    let newWeight = priority.weight;

    // Apply Gemini's smart priority adjustments based on task analysis
    if (taskAnalysis.priorityAdjustments) {
      const adjustment = taskAnalysis.priorityAdjustments[priority.id] || 0;
      newWeight = Math.max(0.1, priority.weight + adjustment); // Min weight of 0.1
    }

    // Apply enhanced task-specific bonuses based on AI classification
    switch (taskAnalysis.taskType) {
      case "CODING":
        if (priority.id === "performance") newWeight *= 1.3; // Strong boost for coding accuracy
        if (priority.id === "cost") newWeight *= 0.9; // Slightly reduce cost priority
        break;
      case "MATH":
        if (priority.id === "performance") newWeight *= 1.4; // Highest boost for mathematical accuracy
        if (priority.id === "speed") newWeight *= 0.8; // Reduce speed priority for complex math
        break;
      case "CREATIVE":
        if (priority.id === "speed") newWeight *= 1.2; // Boost speed for creative tasks
        if (priority.id === "performance") newWeight *= 1.1; // Moderate performance boost
        break;
      case "BUSINESS":
        if (priority.id === "cost") newWeight *= 1.3; // Strong boost for cost-efficiency
        if (priority.id === "speed") newWeight *= 1.1; // Moderate speed boost
        break;
      case "RESEARCH":
        if (priority.id === "performance") newWeight *= 1.2; // Boost for accuracy in research
        if (priority.id === "cost") newWeight *= 1.1; // Moderate cost consideration
        break;
      case "FUNCTION_CALLING":
        if (priority.id === "performance") newWeight *= 1.2; // Boost for tool use accuracy
        if (priority.id === "speed") newWeight *= 1.1; // Boost for responsiveness
        break;
      case "REASONING":
        if (priority.id === "performance") newWeight *= 1.3; // High boost for reasoning accuracy
        if (priority.id === "speed") newWeight *= 0.9; // Slightly reduce speed for complex reasoning
        break;
    }

    return { ...priority, weight: newWeight };
  });

  console.log(
    "🎯 AI-enhanced priorities:",
    adjustedPriorities
      .map(p => `${p.name} (${p.weight.toFixed(1)}x)`)
      .join(", ")
  );
  console.log(`🧠 Task-specific optimization for: ${taskAnalysis.taskType}`);
  if (taskAnalysis.reasoning) {
    console.log(`💡 AI Reasoning: ${taskAnalysis.reasoning}`);
  }
  if (taskAnalysis.recommendedModels?.length > 0) {
    console.log(`🏆 AI Recommended Models: ${taskAnalysis.recommendedModels.join(", ")}`);
  }

  return adjustedPriorities;
}
