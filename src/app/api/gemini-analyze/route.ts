import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    const { prompt, priorities, models } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing Gemini API key" }, { status: 400 });
    }
    const ai = new GoogleGenAI({ apiKey });

    const analysisPrompt = `You are an expert AI model selection consultant with deep knowledge of LLM capabilities and performance characteristics. Based on the user's prompt and stated priorities, recommend the optimal model from the available options using comprehensive leaderboard data and performance metrics.

    USER PROMPT:
    "${prompt}"

    USER PRIORITIES (ranked by importance):
    ${priorities.map((p: any, i: number) => `${i + 1}. ${p.name}: ${p.description}`).join('\n')}

    AVAILABLE MODELS:
    ${models.map((model: any) => {
      const metrics = [];
      if (model.cost_efficiency) metrics.push(`Cost Efficiency: ${model.cost_efficiency}/10`);
      if (model.performance_score) metrics.push(`Performance: ${model.performance_score}/10`);
      if (model.speed_score) metrics.push(`Speed: ${model.speed_score}/10`);
      
      return `• ${model.name} (${model.provider})
    ${metrics.length > 0 ? '- ' + metrics.join(', ') : ''}
    ${model.description ? '- ' + model.description : ''}`;
    }).join('\n\n')}

    ANALYSIS FRAMEWORK:
    1. TASK ANALYSIS: Parse the user's prompt to identify:
       - Task type (reasoning, creative writing, coding, analysis, etc.)
       - Complexity level (simple, moderate, complex, expert-level)
       - Output requirements (length, format, style, accuracy needs)
       - Specific constraints (latency, cost, quality thresholds)

    2. PRIORITY WEIGHTING: Evaluate each model against the user's priority ranking:
       - Calculate weighted scores based on priority importance
       - Consider how well each model aligns with top priorities
       - Identify potential conflicts between competing priorities

    3. MODEL ASSESSMENT: Consider task-specific model strengths:
       - Domain expertise and specialization areas
       - Known performance patterns for similar tasks
       - Reliability and consistency metrics
       - Current leaderboard standings for relevant benchmarks

    4. TRADE-OFF EVALUATION: Balance competing factors:
       - Performance vs cost efficiency
       - Speed vs quality
       - Specialized capabilities vs general performance
       - Risk tolerance based on task criticality

    Based on this comprehensive analysis, provide your recommendation as the exact model name only (no additional text or explanation).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: analysisPrompt,
    });
    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
