# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **LLM Router** system that automatically directs user prompts to the best-value language model based on task type and performance needs. The architecture follows the OpenRouter/NotDiamond.ai approach for intelligent prompt routing with cost optimization.

**Core Functionality:**
- Prompt classification (summarization, code generation, Q&A, etc.)
- Cost-optimized model selection with <60ms routing decisions
- Web dashboard for testing prompts and viewing routing analytics
- Customizable routing rules prioritizing cost/latency/quality
- Performance evaluation and continuous optimization

## Development Commands

```bash
# Development
npm run dev          # Start with Turbopack
npm run build        # Production build
npm start           # Production server

# Code Quality  
npm run lint        # ESLint
npm run format      # Prettier formatting

# Components
npx shadcn@latest add [component-name]  # Add Shadcn UI components
```

## Architecture Overview

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, Shadcn UI, React Hook Form + Zod

**Key Architectural Patterns:**
- Server Components by default (minimize 'use client')
- Server Actions for data mutations and LLM interactions
- Provider abstraction pattern for multiple LLM APIs
- Streaming responses using Server-Sent Events
- Structured logging with custom Logger class

### Core System Components

**1. Benchmark Pipeline** (`lib/pipeline/`)
- `scraper.ts`: Daily Vellum leaderboard data extraction (data scrape )
- `validator.ts`: Benchmark data schema validation and cleaning (Use regex or cheaper llm model to format data into structured json)
- `scheduler.ts`: Cron-based daily update orchestration

**2. Enhanced Routing Engine** (`lib/routing/`)
- `classifier.ts`: Gemini 2.5 Flash-powered prompt classification:
    - take in user prompt and return JSON with:
        - taskType: reasoning|coding|math|general|tool-use
        - complexity: simple|medium|complex
        - estimatedTokens: number
        - qualityRequirement: low|medium|high
- `optimizer.ts`: Gemini 2.5 Flash benchmark analysis and optimization 
    - take in classified JSON data and benchmark JSON and return the best model considering:
        1. Task-specific performance scores
        2. Cost constraints
        3. Latency requirements
        4. Speed (tokens/second)
        5. Quality thresholds
- `router.ts`: Multi-objective decision engine with live benchmark data
- `fallback.ts`: Intelligent fallback strategies (use Gemini 2.0 Flash or cheaper model)

**3. Web Interface** (`app/dashboard/`)
- Real-time prompt testing with routing visualization
- Interactive routing rules configuration
- Cost analytics and optimization recommendations

**4. Provider Layer** (`lib/providers/`)
- Abstract base class for LLM provider normalization
- OpenAI, Anthropic, and other provider implementations
- Unified request/response format across providers

**5. Analytics System** (`lib/analytics/`)
- Structured logging of routing decisions and performance
- Real-time metrics dashboard for cost/latency tracking
- Evaluation framework using standard benchmarks (GSM8K, MT Bench)


## Code Conventions (from cursorRules.txt)

**JavaScript/TypeScript:**
- 2-space indentation, single quotes, no semicolons
- Functional patterns, avoid classes except for providers/loggers
- Files under 200 lines, extract to modules when needed
- Descriptive names with auxiliary verbs (isLoading, hasError)

**React Patterns:**
- Server Components first, 'use client' only for interactivity
- Server Actions for form submissions and data mutations
- Proper loading.js/error.js for App Router
- Controlled components with React Hook Form + Zod validation

**Next.js App Router:**
- Async Server Components for data fetching
- Route groups for organization without URL impact
- Metadata API for SEO optimization
- Streaming with Suspense boundaries

## Environment Setup

Environment validation in `src/config/env.ts` with new variables:
- Existing LLM provider keys
- `VELLUM_API_KEY`: For leaderboard access (if available)
- `BENCHMARK_UPDATE_CRON`: Schedule for benchmark updates (default: "0 6 * * *")
- `GEMINI_API_KEY`: For classification and optimization
- `DATABASE_URL`: For benchmark data storage


## Logging Infrastructure

Custom Logger class (`src/utils/logger.ts`) provides:
- Server/client context awareness
- Colored console output with timestamps
- Structured logging for routing decisions
- Log levels: info, error, warn, debug, action

## Planned Implementation Strategy

**Phase 1: Core Routing**
- Implement basic prompt classification
- Set up provider abstractions (OpenAI, Anthropic)
- Build routing engine with cost/performance optimization

**Phase 2: Web Interface**
- Dashboard for prompt testing
- Real-time routing visualization
- Basic analytics and metrics

**Phase 3: Advanced Features**
- Customizable routing rules engine
- A/B testing framework
- Performance evaluation suite

**Phase 4: NPM Package**
- Extract core routing logic
- Create standalone package with clean API
- Comprehensive documentation and examples

## Key Design Principles

**Performance Target:** <60ms routing decisions with 95% quality retention at 85% cost reduction

**Routing Algorithm:** Multi-objective optimization balancing:
- Cost per token (input/output pricing)
- Expected latency based on model benchmarks
- Quality scores from evaluation datasets
- Model capability matching (context length, specialized tasks)

**Provider Strategy:** OpenAI-compatible interface with automatic fallback on rate limits/errors