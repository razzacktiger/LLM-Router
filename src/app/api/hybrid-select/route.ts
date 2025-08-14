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

    const analysisPrompt = `You are an expert AI model selection assistant with access to comprehensive leaderboard data. CRITICAL: Always recommend models from DIFFERENT providers to give users diverse options.

USER PROMPT: "${prompt}"

AVAILABLE MODELS AND THEIR STRENGTHS:
${modelContext}

PROVIDER SPECIALIZATIONS:
- OpenAI: General excellence, reasoning (GPT-5, o3/o4 series)
- Anthropic: Coding, writing, safety (Claude 4.x series) 
- Google: Multimodal, speed, cost-efficiency (Gemini 2.5 Pro/Flash)
- Meta: Speed, cost-effectiveness (Llama 4 variants - 2600 tokens/sec)
- DeepSeek: Mathematical reasoning, ultra-low cost ($0.27-2.19/1M)
- X.AI: Creative reasoning, strong coding (Grok series)
- Amazon: Balanced performance (Nova Pro)

TASK-SPECIFIC ROUTING:
- CODING: Prioritize Claude 4 Sonnet (72.7% SWE-Bench), Grok 4 (75% SWE-Bench), DeepSeek-R1
- MATH: DeepSeek-R1 (79.8% AIME), OpenAI o4-mini (93.4% AIME), Llama 4 Behemoth (95% AIME)
- SPEED: Llama 4 Scout (2600 t/s), Llama 3.3 70b (2500 t/s), Gemini 2.0 Flash (257 t/s)
- COST: DeepSeek models ($0.27-2.19), Gemma 3 27b ($0.07), Llama variants ($0.11-0.7)
- REASONING: GPT-5 (89.4% GPQA), Grok 4 (87.5% GPQA), Gemini 2.5 Pro (86.4% GPQA)

MANDATORY REQUIREMENTS:
1. Your recommendedModels array MUST include models from 3 DIFFERENT providers
2. Always include: 1 specialized model, 1 cost-effective option, 1 speed-optimized choice
3. Prioritize provider diversity over single-provider dominance
4. For coding tasks: MUST include Claude or Grok (not just OpenAI)
5. For cost-sensitive tasks: MUST include DeepSeek or Llama options
6. For speed needs: MUST include Meta Llama variants

TASK CLASSIFICATION:
Classify the task into ONE of these categories:
- CODING: Programming, debugging, algorithm implementation, code review
- MATH: Mathematical calculations, problem solving, statistical analysis
- RESEARCH: Information gathering, data analysis, summarization, fact-checking
- CREATIVE: Writing, storytelling, brainstorming, content creation
- BUSINESS: Professional communications, reports, strategy, analysis
- FUNCTION_CALLING: API usage, tool integration, automation, structured data
- REASONING: Logic puzzles, complex analysis, multi-step problem solving

Return ONLY a valid JSON object with this exact format:
{
  "taskType": "CODING",
  "complexity": "Medium",
  "reasoning": "This task requires solid programming capabilities. Claude excels at coding, DeepSeek offers cost efficiency, and Llama provides speed - giving users diverse provider options.",
  "insights": [
    "Provider diversity ensures different strengths are available",
    "Task-specific specialization from leading providers",
    "Cost and speed alternatives from different ecosystems"
  ],
  "recommendedModels": [
    "Claude 4 Sonnet (Anthropic) - coding specialist with 72.7% SWE-Bench",
    "DeepSeek-R1 (DeepSeek) - cost-effective at $0.55/$2.19 per 1M tokens",
    "Llama 4 Scout (Meta) - ultra-fast at 2600 tokens/second"
  ],
  "priorityAdjustments": {
    "performance": 0.2,
    "speed": 0.1,
    "cost": 0.1
  },
  "benchmarkFocus": [
    "SWE-Bench for coding capability",
    "Cost efficiency for budget considerations",
    "Speed benchmarks for throughput needs"
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
 * Build context about available models from leaderboard data with provider diversity focus
 */
function buildModelContext(models: any[]): string {
  if (!models || models.length === 0) {
    return "No specific models available for analysis.";
  }

  // Group models by provider for diversity analysis
  const modelsByProvider = models.reduce((acc, model) => {
    const provider = model.provider || 'Unknown';
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(model);
    return acc;
  }, {} as Record<string, any[]>);

  // Build provider-specific summaries
  const providerSummaries = Object.entries(modelsByProvider).map(([provider, providerModels]) => {
    const models = providerModels as any[];
    const topModel = models.sort((a: any, b: any) => 
      (parseFloat(b.performance_score) || 0) - (parseFloat(a.performance_score) || 0)
    )[0];
    
    const costRange = `$${Math.min(...models.map((m: any) => m.inputCostPer1M || 0))}-${Math.max(...models.map((m: any) => m.outputCostPer1M || 0))}`;
    const maxSpeed = Math.max(...models.map((m: any) => m.tokensPerSecond || 0));
    
    // Get best benchmark for each provider
    const bestCoding = Math.max(...models.map((m: any) => m.benchmarks?.sweBench || 0));
    const bestMath = Math.max(...models.map((m: any) => m.benchmarks?.aime2024 || 0));
    const bestReasoning = Math.max(...models.map((m: any) => m.benchmarks?.gpqaDiamond || 0));
    
    return `• ${provider} (${models.length} models):
  Best: ${topModel.name} | Cost: ${costRange}/1M | Speed: ${maxSpeed} t/s
  Strengths: SWE-Bench ${bestCoding}%, AIME ${bestMath}%, GPQA ${bestReasoning}%`;
  }).join('\n');

  // Task-specific model recommendations by provider
  const codingLeaders = models
    .filter(m => m.benchmarks?.sweBench > 50)
    .sort((a, b) => (b.benchmarks?.sweBench || 0) - (a.benchmarks?.sweBench || 0))
    .slice(0, 5)
    .map(m => `${m.name} (${m.provider}): ${m.benchmarks.sweBench}%`);

  const speedLeaders = models
    .filter(m => m.tokensPerSecond > 100)
    .sort((a, b) => (b.tokensPerSecond || 0) - (a.tokensPerSecond || 0))
    .slice(0, 5)
    .map(m => `${m.name} (${m.provider}): ${m.tokensPerSecond} t/s`);

  const costLeaders = models
    .filter(m => m.inputCostPer1M < 1.0)
    .sort((a, b) => (a.inputCostPer1M || 999) - (b.inputCostPer1M || 999))
    .slice(0, 5)
    .map(m => `${m.name} (${m.provider}): $${m.inputCostPer1M}/$${m.outputCostPer1M}`);

  const mathLeaders = models
    .filter(m => m.benchmarks?.aime2024 > 50)
    .sort((a, b) => (b.benchmarks?.aime2024 || 0) - (a.benchmarks?.aime2024 || 0))
    .slice(0, 5)
    .map(m => `${m.name} (${m.provider}): ${m.benchmarks.aime2024}%`);

  const totalModels = models.length;
  const providers = Object.keys(modelsByProvider);
  
  return `PROVIDER DIVERSITY ANALYSIS (${totalModels} models from ${providers.length} providers):

${providerSummaries}

TASK-SPECIFIC LEADERS BY PROVIDER:

🔧 CODING CHAMPIONS (SWE-Bench scores):
${codingLeaders.join('\n')}

⚡ SPEED CHAMPIONS (Tokens/second):
${speedLeaders.join('\n')}

💰 COST CHAMPIONS (Per 1M tokens):
${costLeaders.join('\n')}

🧮 MATH CHAMPIONS (AIME scores):
${mathLeaders.join('\n')}

PROVIDER SPECIALIZATION GUIDE:
- OpenAI: Reasoning powerhouse (GPT-5, o3 series) - premium pricing
- Anthropic: Coding excellence (Claude 4.x) - strong safety focus  
- Google: Multimodal + speed (Gemini 2.5) - excellent cost/performance
- Meta: Ultra-fast inference (Llama 4) - open-source advantage
- DeepSeek: Math specialist - exceptional cost efficiency
- X.AI: Creative reasoning (Grok) - strong coding capabilities
- Amazon: Balanced performance (Nova) - enterprise focus

SELECTION STRATEGY:
✅ ALWAYS recommend models from 3+ different providers
✅ Match provider strengths to task requirements
✅ Include cost-effective alternatives from different ecosystems
✅ Consider speed requirements across provider options`;
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
