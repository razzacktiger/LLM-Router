import { NextResponse } from "next/server";
import { combinedScraper } from "@/lib/pipeline/scraper";
import { Logger } from "@/utils/logger";

const logger = new Logger("API:Scrape");

// Simple in-memory cache (persists per server process)
type CachedEntry = {
  data: {
    models: any[];
    lastScraped: string;
    source: string;
  };
  timestamp: number;
};

let CACHE: CachedEntry | null = null;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function isCacheFresh(entry: CachedEntry | null): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

async function refreshCacheInBackground(): Promise<void> {
  try {
    const fresh = await combinedScraper.scrapeAllSources();
    CACHE = { data: fresh, timestamp: Date.now() };
    logger.info("Background cache refresh succeeded", {
      modelCount: fresh.models.length,
      source: fresh.source,
    });
  } catch (error) {
    logger.warn("Background cache refresh failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function GET(request: Request) {
  try {
    logger.info("GET /api/scrape - Starting leaderboard scrape");

    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get("refresh") === "true";

    // Serve from cache if fresh and no force refresh
    if (!forceRefresh && isCacheFresh(CACHE)) {
      const cached = CACHE!.data;
      logger.info("GET /api/scrape - Returning cached result", {
        modelCount: cached.models.length,
        source: cached.source,
        lastScraped: cached.lastScraped,
      });

      // Transform data for npm package compatibility
      const npmCompatibleData = transformForNpmPackage(cached);

      return NextResponse.json({
        success: true,
        data: npmCompatibleData,
        meta: {
          modelCount: cached.models.length,
          source: cached.source,
          scrapedAt: cached.lastScraped,
          isLiveData: cached.source.includes("live"),
          cached: true,
        },
      });
    }

    // Get leaderboard data (and refresh cache)
    const leaderboardData = await combinedScraper.scrapeAllSources();
    CACHE = { data: leaderboardData, timestamp: Date.now() };

    logger.info("GET /api/scrape - Scrape completed successfully", {
      modelCount: leaderboardData.models.length,
      source: leaderboardData.source,
      lastScraped: leaderboardData.lastScraped,
    });

    // Transform data for npm package compatibility
    const npmCompatibleData = transformForNpmPackage(leaderboardData);

    return NextResponse.json({
      success: true,
      data: npmCompatibleData,
      meta: {
        modelCount: leaderboardData.models.length,
        source: leaderboardData.source,
        scrapedAt: leaderboardData.lastScraped,
        isLiveData: leaderboardData.source.includes("live"),
      },
    });
  } catch (error) {
    logger.error("GET /api/scrape - Scrape failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to scrape leaderboard data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Transform our model data to npm package compatible format
 */
function transformForNpmPackage(leaderboardData: any) {
  const transformedModels = leaderboardData.models.map((model: any) => ({
    // Preserve original fields for UI compatibility
    ...model,

    // Add npm package compatible fields
    overallScore: calculateOverallScore(model),
    performanceScore: parseFloat(model.performance_score) || 0,
    costScore: parseFloat(model.cost_efficiency) || 0,
    speedScore: parseFloat(model.speed_score) || 0,
    benchmarks: {
      // Keep original benchmarks
      ...model.benchmarks,
      // Add npm package compatible names
      sweScore: model.benchmarks?.sweBench || 0,
      mmluScore: model.benchmarks?.mmlu || 0,
      aimeScore: model.benchmarks?.aime2024 || 0,
      mathScore: model.benchmarks?.math500 || 0,
      gpqaScore: model.benchmarks?.gpqaDiamond || 0,
      humanEvalScore:
        model.benchmarks?.humaneval || model.benchmarks?.alderPolyglot || 0,
    },
    pricing: {
      inputCost: model.inputCostPer1M
        ? model.inputCostPer1M / 1000000
        : undefined, // Convert to per-token
      outputCost: model.outputCostPer1M
        ? model.outputCostPer1M / 1000000
        : undefined,
      currency: "USD",
    },
    metadata: {
      contextLength: model.contextLength || 0,
      modelSize: extractModelSize(model.name),
      releaseDate: model.lastUpdated?.substring(0, 7) || "2024-01", // Extract YYYY-MM
    },
  }));

  return {
    models: transformedModels,
    lastScraped: leaderboardData.lastScraped,
    source: leaderboardData.source,
  };
}

/**
 * Calculate overall score from individual scores
 */
function calculateOverallScore(model: any): number {
  const performance = parseFloat(model.performance_score) || 0;
  const cost = parseFloat(model.cost_efficiency) || 0;
  const speed = parseFloat(model.speed_score) || 0;

  // Weighted average: 50% performance, 30% cost, 20% speed
  return performance * 0.5 + cost * 0.3 + speed * 0.2;
}

/**
 * Extract model size from name
 */
function extractModelSize(name: string): string {
  if (name.includes("405B")) return "405B";
  if (name.includes("120b")) return "120B";
  if (name.includes("70b") || name.includes("70B")) return "70B";
  if (name.includes("27b")) return "27B";
  if (name.includes("20b")) return "20B";
  if (name.includes("8b") || name.includes("8B")) return "8B";
  if (name.includes("mini") || name.includes("nano")) return "Small";
  if (name.includes("4.1") || name.includes("4 ") || name.includes("5"))
    return "Large";
  return "Medium";
}

export async function POST(request: Request) {
  try {
    logger.info("POST /api/scrape - Manual scrape trigger");

    const body = await request.json();
    const { forceFirecrawl = false, background = false } = body;

    // Temporarily override Firecrawl for testing
    if (forceFirecrawl && !process.env.FIRECRAWL_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Firecrawl API key not configured",
          message: "Add FIRECRAWL_API_KEY to your environment variables",
        },
        { status: 400 }
      );
    }

    // Optional background refresh (returns immediately with cache if available)
    if (background) {
      if (isCacheFresh(CACHE)) {
        // kick off refresh without blocking
        void refreshCacheInBackground();
        const cached = CACHE!.data;
        return NextResponse.json({
          success: true,
          data: cached,
          meta: {
            modelCount: cached.models.length,
            source: cached.source,
            scrapedAt: cached.lastScraped,
            isLiveData: cached.source.includes("live"),
            triggeredManually: true,
            cached: true,
            backgroundRefresh: true,
          },
        });
      }
      // No cache yet; fall through to do a blocking scrape
    }

    const leaderboardData = await combinedScraper.scrapeAllSources();
    CACHE = { data: leaderboardData, timestamp: Date.now() };

    logger.info("POST /api/scrape - Manual scrape completed", {
      modelCount: leaderboardData.models.length,
      source: leaderboardData.source,
    });

    return NextResponse.json({
      success: true,
      data: leaderboardData,
      meta: {
        modelCount: leaderboardData.models.length,
        source: leaderboardData.source,
        scrapedAt: leaderboardData.lastScraped,
        isLiveData: leaderboardData.source.includes("live"),
        triggeredManually: true,
      },
    });
  } catch (error) {
    logger.error("POST /api/scrape - Manual scrape failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to scrape leaderboard data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
