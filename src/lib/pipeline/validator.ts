import { z } from "zod";
import { Logger } from "@/utils/logger";

const logger = new Logger("BenchmarkValidator");
import type { BenchmarkModel, LeaderboardData } from "./scraper";

// Zod schema for benchmark model validation
export const BenchmarkModelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: z.string().min(1),
  inputCostPer1M: z.number().min(0),
  outputCostPer1M: z.number().min(0),
  tokensPerSecond: z.number().min(0), // Allow 0 for models where speed isn't available
  timeToFirstToken: z.number().min(0),
  benchmarks: z.object({
    gpqaDiamond: z.number().min(0).max(100),
    aime2024: z.number().min(0).max(100),
    sweBench: z.number().min(0).max(100),
    bfcl: z.number().min(0).max(100),
    alderPolyglot: z.number().min(0).max(100),
  }),
  contextLength: z.number().min(0), // Allow 0 for models where context length isn't available
  lastUpdated: z.string().datetime(),
});

export const LeaderboardDataSchema = z.object({
  models: z.array(BenchmarkModelSchema),
  lastScraped: z.string().datetime(),
  source: z.string().min(1),
});

export class BenchmarkValidator {
  /**
   * Validates and cleans scraped benchmark data
   */
  validateLeaderboardData(rawData: unknown): LeaderboardData {
    logger.info("Validating leaderboard data");

    try {
      const validated = LeaderboardDataSchema.parse(rawData);
      logger.info(`Validated ${validated.models.length} models successfully`);
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error("Validation failed:", error.errors);
        throw new Error(
          `Data validation failed: ${error.errors.map(e => e.message).join(", ")}`
        );
      }
      throw error;
    }
  }

  /**
   * Validates individual model data
   */
  validateModel(rawModel: unknown): BenchmarkModel {
    try {
      return BenchmarkModelSchema.parse(rawModel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(`Model validation failed:`, error.errors);
        throw new Error(
          `Model validation failed: ${error.errors.map(e => e.message).join(", ")}`
        );
      }
      throw error;
    }
  }

  /**
   * Cleans and normalizes model data
   */
  cleanModelData(models: BenchmarkModel[]): BenchmarkModel[] {
    logger.info("Cleaning model data");

    return models.map(model => ({
      ...model,
      // Normalize provider names
      provider: this.normalizeProvider(model.provider),
      // Round numeric values to reasonable precision
      inputCostPer1M: Math.round(model.inputCostPer1M * 100) / 100,
      outputCostPer1M: Math.round(model.outputCostPer1M * 100) / 100,
      tokensPerSecond: Math.round(model.tokensPerSecond),
      timeToFirstToken: Math.round(model.timeToFirstToken * 10) / 10,
      benchmarks: {
        gpqaDiamond: Math.round(model.benchmarks.gpqaDiamond * 10) / 10,
        aime2024: Math.round(model.benchmarks.aime2024 * 10) / 10,
        sweBench: Math.round(model.benchmarks.sweBench * 10) / 10,
        bfcl: Math.round(model.benchmarks.bfcl * 10) / 10,
        alderPolyglot: Math.round(model.benchmarks.alderPolyglot * 10) / 10,
      },
    }));
  }

  /**
   * Removes duplicate models and keeps the most recent
   */
  deduplicateModels(models: BenchmarkModel[]): BenchmarkModel[] {
    logger.info("Deduplicating models");

    const modelMap = new Map<string, BenchmarkModel>();

    models.forEach(model => {
      const existing = modelMap.get(model.id);
      if (
        !existing ||
        new Date(model.lastUpdated) > new Date(existing.lastUpdated)
      ) {
        modelMap.set(model.id, model);
      }
    });

    const deduplicated = Array.from(modelMap.values());
    logger.info(
      `Deduplicated ${models.length} models to ${deduplicated.length}`
    );

    return deduplicated;
  }

  /**
   * Filters out models with incomplete benchmark data
   */
  filterValidModels(models: BenchmarkModel[]): BenchmarkModel[] {
    logger.info("Filtering models with complete data");

    const valid = models.filter(model => {
      // Debug logging for rejected models
      const debugInfo = {
        name: model.name,
        hasName: !!model.name,
        hasProvider: !!model.provider,
        hasId: !!model.id,
        benchmarkScores: Object.values(model.benchmarks).filter(s => s > 0)
          .length,
        hasPerformanceData:
          model.tokensPerSecond > 0 ||
          model.inputCostPer1M > 0 ||
          model.outputCostPer1M > 0 ||
          model.contextLength > 0,
      };
      // Must have basic required fields
      if (!model.name || !model.provider || !model.id) {
        return false;
      }

      // Must have at least one meaningful benchmark OR valid performance metrics
      const benchmarks = Object.values(model.benchmarks);
      const hasSomeBenchmarks = benchmarks.some(
        score => score > 0 && score <= 100
      );

      // Alternative: model has pricing/performance data even without benchmarks
      const hasPerformanceData =
        model.tokensPerSecond > 0 ||
        model.inputCostPer1M > 0 ||
        model.outputCostPer1M > 0 ||
        model.contextLength > 0;

      // Basic metric validation (allow 0 values for missing data)
      const hasValidMetrics =
        model.inputCostPer1M >= 0 &&
        model.outputCostPer1M >= 0 &&
        model.tokensPerSecond >= 0 &&
        model.timeToFirstToken >= 0 &&
        model.contextLength >= 0;

      const isValid =
        (hasSomeBenchmarks || hasPerformanceData) && hasValidMetrics;

      // Log rejected models for debugging
      if (!isValid) {
        logger.warn(`Filtered out model: ${model.name}`, debugInfo);
      }

      return isValid;
    });

    logger.info(
      `Filtered ${models.length} models to ${valid.length} valid models`
    );
    return valid;
  }

  /**
   * Fill in missing data fields with reasonable defaults
   */
  fillMissingData(models: BenchmarkModel[]): BenchmarkModel[] {
    logger.info("Filling missing data fields");

    return models.map(model => ({
      ...model,
      // Fill in missing IDs
      id: model.id || this.generateModelId(model.name),

      // Fill in missing metrics with defaults
      tokensPerSecond: model.tokensPerSecond || 0,
      timeToFirstToken: model.timeToFirstToken || 0,
      contextLength: model.contextLength || 0,
      inputCostPer1M: model.inputCostPer1M || 0,
      outputCostPer1M: model.outputCostPer1M || 0,

      // Fill in missing benchmark scores
      benchmarks: {
        gpqaDiamond: model.benchmarks.gpqaDiamond || 0,
        aime2024: model.benchmarks.aime2024 || 0,
        sweBench: model.benchmarks.sweBench || 0,
        bfcl: model.benchmarks.bfcl || 0,
        alderPolyglot: model.benchmarks.alderPolyglot || 0,
      },

      // Ensure lastUpdated exists
      lastUpdated: model.lastUpdated || new Date().toISOString(),
    }));
  }

  private generateModelId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private normalizeProvider(provider: string): string {
    const normalized = provider.toLowerCase().trim();

    // Normalize common provider name variations
    if (normalized.includes("openai")) return "OpenAI";
    if (normalized.includes("anthropic")) return "Anthropic";
    if (normalized.includes("google") || normalized.includes("gemini"))
      return "Google";
    if (normalized.includes("meta") || normalized.includes("llama"))
      return "Meta";
    if (normalized.includes("mistral")) return "Mistral";
    if (normalized.includes("cohere")) return "Cohere";
    if (normalized.includes("deepseek")) return "DeepSeek";
    if (normalized.includes("xai") || normalized.includes("grok")) return "xAI";

    // Return title case for unknown providers
    return provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase();
  }
}

export const benchmarkValidator = new BenchmarkValidator();
