import { NextRequest, NextResponse } from "next/server";
import { modelSelector } from "@/lib/modelSelector";
import { Logger } from "@/utils/logger";

const logger = new Logger("API:DeterministicSelect");

export async function POST(request: NextRequest) {
  try {
    const { prompt, priorities, models } = await request.json();

    logger.info("Deterministic model selection", {
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

    // Convert priorities to the format expected by ModelSelector
    const priorityItems = priorities.map((p: any, index: number) => ({
      id: p.id,
      name: p.name,
      weight: priorities.length - index, // First priority gets highest weight
    }));

    console.log("🎯 Deterministic Selection Input:");
    console.log(`Prompt: "${prompt?.substring(0, 100)}..."`);
    console.log(
      `Priorities: ${priorityItems.map((p: any) => `${p.name} (weight: ${p.weight})`).join(", ")}`
    );
    console.log(`Models available: ${models.length}`);

    // Use deterministic model selection
    const result = modelSelector.selectOptimalModel(
      models,
      priorityItems,
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

    console.log(
      `🏆 Selected: ${result.model.name} (score: ${result.totalScore.toFixed(2)})`
    );

    return NextResponse.json({
      success: true,
      selectedModel: result.model,
      score: result.totalScore,
      breakdown: result.breakdown,
      reasoning: {
        method: "deterministic",
        explanation: `Selected based on weighted scoring: Cost (${result.breakdown.weightedCost.toFixed(1)}) + Performance (${result.breakdown.weightedPerformance.toFixed(1)}) + Speed (${result.breakdown.weightedSpeed.toFixed(1)}) = ${result.totalScore.toFixed(2)}`,
        priorities: priorityItems,
      },
    });
  } catch (error: any) {
    logger.error("Deterministic selection failed", {
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
