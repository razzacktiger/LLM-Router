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
      return NextResponse.json({
        success: true,
        data: cached,
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

    return NextResponse.json({
      success: true,
      data: leaderboardData,
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
