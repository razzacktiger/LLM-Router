import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    const { prompt, priorities, models } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Gemini API key" },
        { status: 400 }
      );
    }
    const ai = new GoogleGenAI({ apiKey });

    const analysisPrompt = `You are an expert AI model selection consultant with comprehensive knowledge of ALL available LLM models in the market, their capabilities, performance characteristics, and specialized use cases.

    TASK: Analyze the user's prompt to understand the specific use case, then recommend the optimal LLM model based on their domain requirements and weighted priority preferences from the entire landscape of available models.

    USER PROMPT ANALYSIS:
    "${prompt}"

    PRIORITY WEIGHTING SYSTEM (Applied to final recommendation):
    ${priorities
      .map((p: any, i: number) => {
        const weight = priorities.length - i;
        return `${i + 1}. ${p.name} (Weight: ${weight}x) - ${p.description}`;
      })
      .join("\n")}

    AVAILABLE MODELS WITH REAL BENCHMARK DATA:
    ${models
      .map((model: any) => {
        const cost = model.cost_efficiency || "N/A";
        const performance = model.performance_score || "N/A";
        const speed = model.speed_score || "N/A";
        const inputCost = model.inputCostPer1M || "N/A";
        const outputCost = model.outputCostPer1M || "N/A";
        const tokensPerSec = model.tokensPerSecond || "N/A";
        const contextLength = model.contextLength || "N/A";

        // Extract key benchmarks
        const gpqa = model.benchmarks?.gpqaDiamond || "N/A";
        const aime = model.benchmarks?.aime2024 || "N/A";
        const sweBench = model.benchmarks?.sweBench || "N/A";
        const bfcl = model.benchmarks?.bfcl || "N/A";

        return `• ${model.name} (${model.provider})
  - Cost: $${inputCost}/$${outputCost} per 1M tokens (Score: ${cost}/10)
  - Performance: ${performance}/10 (GPQA: ${gpqa}, AIME: ${aime}, SWE: ${sweBench}, BFCL: ${bfcl})
  - Speed: ${tokensPerSec} tok/sec (Score: ${speed}/10)
  - Context: ${contextLength} tokens
  - Specialization: ${model.description || "General purpose"}`;
      })
      .join("\n\n")}

    BENCHMARK-DRIVEN SELECTION STRATEGY:

    CODING & SOFTWARE DEVELOPMENT:
    - PRIMARY: SWE-Bench scores (software engineering benchmark)
    - SECONDARY: BFCL scores (tool use/function calling)
    - Look for models with 80+ SWE-Bench for complex projects
    - Consider speed for iterative development workflows

    MATHEMATICAL & SCIENTIFIC REASONING:
    - PRIMARY: AIME scores (advanced mathematics) 
    - SECONDARY: GPQA Diamond (graduate-level science)
    - Look for models with 85+ AIME for complex calculations
    - Performance trumps cost for research applications

    RESEARCH & ANALYSIS:
    - PRIMARY: GPQA Diamond scores (reasoning depth)
    - SECONDARY: Context length for large documents
    - Look for models with 90+ GPQA for complex analysis
    - Balance performance with cost for bulk processing

    GENERAL PURPOSE & CONTENT:
    - BALANCED: Consider all benchmark scores equally
    - Factor in cost efficiency for high-volume use
    - Speed important for interactive applications

    QUANTITATIVE SCORING METHODOLOGY:
    1. EXTRACT USE CASE: Identify primary task type from user prompt
    2. CALCULATE BENCHMARK FIT: Match relevant benchmark scores to use case
    3. APPLY PRIORITY WEIGHTS: Score models using actual metrics
    4. WEIGHTED FORMULA: (Benchmark_Fit × 0.4) + (Cost_Weight × Cost_Score) + (Speed_Weight × Speed_Score) + (Performance_Weight × Performance_Score)

    COST OPTIMIZATION RULES:
    - Under $1 per 1M tokens = Excellent (Score 9-10)
    - $1-5 per 1M tokens = Good (Score 7-8)  
    - $5-15 per 1M tokens = Moderate (Score 5-6)
    - Above $15 per 1M tokens = Expensive (Score 3-4)

    SPEED OPTIMIZATION RULES:
    - Above 300 tok/sec = Excellent (Score 9-10)
    - 200-300 tok/sec = Good (Score 7-8)
    - 100-200 tok/sec = Moderate (Score 5-6)
    - Below 100 tok/sec = Slow (Score 3-4)

    DECISION ALGORITHM:
    1. IDENTIFY USE CASE: Extract primary task type from user prompt (coding, research, creative, etc.)
    2. MAP TO SPECIALIZATION: Find tier-1 models for identified use case
    3. APPLY PRIORITY WEIGHTS: Score each candidate model using weighted priorities
    4. CALCULATE OPTIMAL MATCH: Select model with highest weighted score for the specific use case
    5. VALIDATE AVAILABILITY: Ensure selected model exists in candidate list

    WEIGHTED SCORING FORMULA:
    Final Score = (Use Case Fit × 0.4) + (Priority 1 × Weight 1) + (Priority 2 × Weight 2) + (Priority 3 × Weight 3)

    DECISION ALGORITHM:
    1. IDENTIFY PRIMARY USE CASE from user prompt
    2. SELECT RELEVANT BENCHMARKS for that use case  
    3. SCORE each model using: Benchmark_Performance + (Priority_1 × Weight_1) + (Priority_2 × Weight_2) + (Priority_3 × Weight_3)
    4. VALIDATE model exists in candidate list
    5. RETURN highest-scoring model

    CRITICAL SELECTION RULES:
    - ONLY recommend models from the AVAILABLE MODELS list above
    - Use EXACT model names as provided (including parentheses, spaces, etc.)
    - Base decisions on ACTUAL benchmark scores and cost data
    - Apply quantitative weighting based on user priorities
    - Consider task-specific benchmark performance

    LATEST MODEL INSIGHTS (Aug 2025):
    - GPT-5 family: New SOTA performance, especially GPT-5 Mini for cost efficiency
    - Claude Opus 4.1: Strong reasoning, thinking mode available
    - All models have real benchmark data - use it for decisions

    OUTPUT: Return ONLY the exact model name from the candidate list.
    Valid examples: "GPT-5", "GPT-5 Mini", "Claude Opus 4.1 (Thinking)", "GPT-4 Turbo"`;

    console.log("🔍 DEBUG: Sending to Gemini...");
    console.log("Prompt length:", prompt.length);
    console.log(
      "Priorities:",
      priorities.map((p: any) => p.name)
    );
    console.log(
      "Available models:",
      models.map((m: any) => m.name).slice(0, 10)
    );
    console.log("📊 Models count:", models.length);
    if (models.length > 0) {
      console.log("🔍 First model sample:", JSON.stringify(models[0], null, 2));
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: analysisPrompt,
    });

    console.log("🤖 Gemini response:", response.text);
    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
