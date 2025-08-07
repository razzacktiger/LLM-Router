export interface BenchmarkScores {
  gpqaDiamond: number;
  aime2024: number;
  sweBench: number;
  bfcl: number;
  alderPolyglot: number;
}

export interface BenchmarkModel {
  id: string;
  name: string;
  provider: string;
  inputCostPer1M: number;
  outputCostPer1M: number;
  tokensPerSecond: number;
  timeToFirstToken: number;
  benchmarks: BenchmarkScores;
  contextLength: number;
  lastUpdated: string;
}

export interface LeaderboardData {
  models: BenchmarkModel[];
  lastScraped: string;
  source: string; // "vellum-live" | "vellum-mock"
}

export interface ScrapeApiResponse {
  success: boolean;
  data?: LeaderboardData;
  meta?: {
    modelCount: number;
    source: string;
    scrapedAt: string;
    isLiveData: boolean;
    cached?: boolean;
    backgroundRefresh?: boolean;
    triggeredManually?: boolean;
  };
  error?: string;
  message?: string;
}
