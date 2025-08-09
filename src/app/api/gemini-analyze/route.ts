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

    const analysisPrompt = `You are an expert AI model selection consultant with comprehensive knowledge of ALL available LLM models in the market, their capabilities, performance characteristics, and specialized use cases.

    TASK: Analyze the user's prompt to understand the specific use case, then recommend the optimal LLM model based on their domain requirements and weighted priority preferences from the entire landscape of available models.

    USER PROMPT ANALYSIS:
    "${prompt}"

    PRIORITY WEIGHTING SYSTEM (Applied to final recommendation):
    ${priorities.map((p: any, i: number) => {
      const weight = priorities.length - i;
      return `${i + 1}. ${p.name} (Weight: ${weight}x) - ${p.description}`;
    }).join('\n')}

    AVAILABLE CANDIDATE MODELS:
    ${models.map((model: any) => {
      const cost = model.cost_efficiency || 'N/A';
      const performance = model.performance_score || 'N/A';
      const speed = model.speed_score || 'N/A';
      return `• ${model.name} by ${model.provider}\n  - Cost Efficiency: ${cost}/10\n  - Performance Quality: ${performance}/10\n  - Response Speed: ${speed}/10\n  - Specialization: ${model.description || 'General purpose'}`;
    }).join('\n\n')}

    COMPREHENSIVE MODEL SPECIALIZATION MATRIX BY USE CASE:

    SOFTWARE DEVELOPMENT & CODING:
    • Premier Tier: Claude 3.5 Sonnet, Claude 3 Opus (superior code architecture, debugging, complex algorithms)
    • Expert Tier: GPT-4o, Codestral, CodeLlama 70B, DeepSeek-Coder
    • Efficient Tier: Claude 3 Haiku, GPT-4o mini, StarCoder (speed-focused coding)

    RESEARCH & DEEP ANALYSIS:
    • Premier Tier: GPT-4o, GPT-4 Turbo, Claude 3 Opus (complex reasoning, multi-source analysis)
    • Expert Tier: Gemini Ultra, Perplexity Pro, Claude 3.5 Sonnet
    • Efficient Tier: Llama 2 70B, Mixtral 8x7B, Command R+

    CREATIVE WRITING & CONTENT:
    • Premier Tier: Claude 3 Opus, Claude 3.5 Sonnet (nuanced storytelling, brand voice)
    • Expert Tier: GPT-4o, GPT-4 Turbo, Command R+
    • Efficient Tier: Llama 2 70B, Mistral Large, Yi-34B

    MATHEMATICAL & SCIENTIFIC REASONING:
    • Premier Tier: GPT-4o, Claude 3 Opus, Gemini Ultra, WizardMath
    • Expert Tier: DeepSeek-Math, MetaMath, Claude 3.5 Sonnet
    • Efficient Tier: CodeLlama, Mixtral 8x7B, Llama 2 70B

    BUSINESS & PROFESSIONAL TASKS:
    • Premier Tier: GPT-4o, Claude 3.5 Sonnet (strategy, analysis, communication)
    • Expert Tier: GPT-4 Turbo, Command R+, Gemini Pro
    • Efficient Tier: Claude 3 Haiku, GPT-4o mini, Mistral Large

    MULTILINGUAL & TRANSLATION:
    • Premier Tier: GPT-4o, GPT-4 Turbo (100+ languages), Gemini Ultra
    • Expert Tier: Claude 3 Opus, PaLM 2, Command R+
    • Efficient Tier: Mixtral 8x7B, Yi-34B, Llama 2 70B

    PRIORITY-OPTIMIZED CATEGORIES:

    SPEED OPTIMIZED (Fast Response):
    • Ultra-Fast: Claude 3 Haiku, GPT-3.5 Turbo, Gemini Flash
    • Fast: Mistral 7B, Llama 2 13B, GPT-4o mini
    • Balanced: Claude 3.5 Sonnet, Command R

    COST OPTIMIZED (Budget-Friendly):
    • Budget: Llama 2 variants, Mistral 7B, CodeLlama (open-source)
    • Value: Claude 3 Haiku, GPT-3.5 Turbo, Gemini Flash
    • Premium Value: Claude 3.5 Sonnet, GPT-4o mini

    PERFORMANCE OPTIMIZED (Maximum Quality):
    • Flagship: GPT-4o, Claude 3 Opus, Gemini Ultra
    • High-Performance: Claude 3.5 Sonnet, GPT-4 Turbo
    • Specialized: Domain-specific models for targeted use cases

    DECISION ALGORITHM:
    1. IDENTIFY USE CASE: Extract primary task type from user prompt (coding, research, creative, etc.)
    2. MAP TO SPECIALIZATION: Find tier-1 models for identified use case
    3. APPLY PRIORITY WEIGHTS: Score each candidate model using weighted priorities
    4. CALCULATE OPTIMAL MATCH: Select model with highest weighted score for the specific use case
    5. VALIDATE AVAILABILITY: Ensure selected model exists in candidate list

    WEIGHTED SCORING FORMULA:
    Final Score = (Use Case Fit × 0.4) + (Priority 1 × Weight 1) + (Priority 2 × Weight 2) + (Priority 3 × Weight 3)

    OUTPUT: Return ONLY the exact model name that achieves the highest weighted score for the identified use case and user priorities.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: analysisPrompt,
    });
    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
