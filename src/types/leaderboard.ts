export interface BenchmarkScores {
  gpqaDiamond: number;
  aime2024: number;
  sweBench: number;
  bfcl: number;
  alderPolyglot: number;
}

export interface BenchmarkModel {
  description: string;
  cost_efficiency: string;
  performance_score: string;
  speed_score: string;
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

export type DataSource = "vellum-live" | "vellum-mock";

export interface LeaderboardData {
  models: BenchmarkModel[];
  lastScraped: string; // ISO-8601
  source: DataSource;
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
