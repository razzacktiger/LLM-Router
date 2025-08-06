import { NextResponse } from "next/server";
import { Logger } from "@/utils/logger";

const logger = new Logger("API:Example");

// Example data
const EXAMPLE_DATA = [
  {
    id: 1,
    title: "Server-side Rendering",
    description:
      "Next.js automatically renders pages on the server for better performance.",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    title: "API Routes",
    description:
      "Create API endpoints using file-system routing in the app/api directory.",
    createdAt: "2024-01-02T00:00:00.000Z",
  },
  {
    id: 3,
    title: "Data Fetching",
    description:
      "Use React Server Components to fetch data directly on the server.",
    createdAt: "2024-01-03T00:00:00.000Z",
  },
];

export async function GET(request: Request) {
  try {
    logger.info("GET /api/example - Request started");

    // Log request details
    const url = new URL(request.url);
    logger.debug("Request details", {
      method: request.method,
      path: url.pathname,
      searchParams: Object.fromEntries(url.searchParams),
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    logger.info("GET /api/example - Request completed successfully", {
      itemCount: EXAMPLE_DATA.length,
    });

    return NextResponse.json(EXAMPLE_DATA);
  } catch (error) {
    logger.error("GET /api/example - Request failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
