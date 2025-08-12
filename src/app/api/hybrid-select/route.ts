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
    const taskAnalysis = await analyzeTaskWithGemini(prompt);
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
        explanation: `Combined AI task analysis (${taskAnalysis.taskType}) with deterministic scoring. Selected based on weighted priorities: Cost (${result.breakdown.weightedCost.toFixed(1)}) + Performance (${result.breakdown.weightedPerformance.toFixed(1)}) + Speed (${result.breakdown.weightedSpeed.toFixed(1)}) = ${result.totalScore.toFixed(2)}`,
        priorities: adjustedPriorities,
        taskInsights: taskAnalysis.insights,
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
 * Use Gemini to analyze the task and provide context
 */
async function analyzeTaskWithGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ No Gemini API key found, using basic task analysis");
    return basicTaskAnalysis(prompt);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const analysisPrompt = `Analyze this user prompt and provide task classification and insights:

PROMPT: "${prompt}"

Classify the task into ONE of these categories:
- CODING: Programming, debugging, algorithm implementation
- MATH: Mathematical calculations, problem solving
- RESEARCH: Information gathering, analysis, summarization  
- CREATIVE: Writing, brainstorming, content creation
- BUSINESS: Professional tasks, emails, reports
- FUNCTION_CALLING: API usage, tool integration, automation

Provide insights about:
- Complexity level (Simple/Medium/Complex)
- Key requirements (speed, accuracy, creativity, etc.)
- Specialized capabilities needed

Return ONLY a JSON object with this format:
{
  "taskType": "CODING",
  "complexity": "Medium", 
  "insights": ["Requires code generation", "Benefits from high SWE-Bench scores"],
  "priorityAdjustments": {
    "performance": 0.1,
    "speed": 0.0,
    "cost": -0.1
  }
}`;

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
        console.log("✅ Gemini task analysis successful");
        return analysis;
      }
    } catch (parseError) {
      console.warn("⚠️ Failed to parse Gemini response, using fallback");
    }

    return basicTaskAnalysis(prompt);
  } catch (error) {
    console.warn("⚠️ Gemini analysis failed, using basic analysis:", error);
    return basicTaskAnalysis(prompt);
  }
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
 * Adjust priorities based on task analysis
 */
function adjustPrioritiesBasedOnTask(priorities: any[], taskAnalysis: any) {
  console.log(
    "🧠 Original priorities:",
    priorities.map(p => `${p.name} (${p.weight}x)`).join(", ")
  );

  // Apply AI-suggested priority adjustments
  const adjustedPriorities = priorities.map(priority => {
    let newWeight = priority.weight;

    // Apply Gemini's priority adjustments
    if (taskAnalysis.priorityAdjustments) {
      const adjustment = taskAnalysis.priorityAdjustments[priority.id] || 0;
      newWeight = Math.max(0.1, priority.weight + adjustment); // Min weight of 0.1
    }

    // Apply task-specific bonuses based on AI classification
    switch (taskAnalysis.taskType) {
      case "CODING":
        if (priority.id === "performance") newWeight *= 1.2; // Boost performance for coding
        break;
      case "MATH":
        if (priority.id === "performance") newWeight *= 1.3; // Even higher boost for math
        break;
      case "CREATIVE":
        if (priority.id === "speed") newWeight *= 1.1; // Boost speed for creative tasks
        break;
      case "BUSINESS":
        if (priority.id === "cost") newWeight *= 1.2; // Boost cost-efficiency for business
        break;
    }

    return { ...priority, weight: newWeight };
  });

  console.log(
    "🎯 AI-adjusted priorities:",
    adjustedPriorities
      .map(p => `${p.name} (${p.weight.toFixed(1)}x)`)
      .join(", ")
  );
  console.log(`🧠 Task-specific bonus applied for: ${taskAnalysis.taskType}`);

  return adjustedPriorities;
}
