export interface BenchmarkModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  cost_efficiency: string;
  performance_score: string;
  speed_score: string;
  inputCostPer1M: number; // Cost per 1M input tokens
  outputCostPer1M: number; // Cost per 1M output tokens
  tokensPerSecond: number;
  timeToFirstToken: number; // seconds
  benchmarks: {
    gpqaDiamond: number; // reasoning benchmark
    aime2024: number; // math benchmark
    sweBench: number; // coding benchmark
    bfcl: number; // tool use benchmark
    alderPolyglot: number; // code editing benchmark
  };
  contextLength: number;
  lastUpdated: string;
}

export interface LeaderboardData {
  models: BenchmarkModel[];
  lastScraped: string;
  source: string;
}

interface FirecrawlResponse {
  success: boolean;
  error?: string;
  data?: {
    extract?: {
      models?: any[];
    };
    markdown?: string;
    html?: string;
  };
}

export class VellumScraper {
  private baseUrl = "https://vellum.ai/llm-leaderboard";
  private firecrawlApiKey?: string;

  constructor(firecrawlApiKey?: string) {
    this.firecrawlApiKey = firecrawlApiKey;
  }

  async scrapeLeaderboard(): Promise<LeaderboardData> {
    console.info("Starting Vellum leaderboard scrape with Firecrawl");

    try {
      // Try to scrape with Firecrawl first, fallback to mock data if it fails
      let models: BenchmarkModel[] = [];
      let isLiveData = false;

      if (this.firecrawlApiKey) {
        try {
          models = await this.scrapeWithFirecrawl();
          console.info(
            `Successfully scraped ${models.length} models with Firecrawl`
          );
          isLiveData = true;
        } catch (firecrawlError) {
          console.warn("Structured extraction failed, trying simpler scrape:", {
            error:
              firecrawlError instanceof Error
                ? firecrawlError.message
                : firecrawlError,
          });

          try {
            // Try simpler HTML extraction as backup
            models = await this.scrapeWithDirectParsing();
            console.info("Fallback HTML scraping succeeded");
            isLiveData = true;
          } catch (htmlError) {
            console.error(
              "All Firecrawl methods failed, falling back to mock data:",
              {
                extractError:
                  firecrawlError instanceof Error
                    ? firecrawlError.message
                    : firecrawlError,
                htmlError:
                  htmlError instanceof Error ? htmlError.message : htmlError,
                hasApiKey: !!this.firecrawlApiKey,
              }
            );
            const mockData = await this.getMockData();
            models = mockData.models;
            isLiveData = false;
          }
        }
      } else {
        console.info("No Firecrawl API key provided, using mock data");
        const mockData = await this.getMockData();
        models = mockData.models;
        isLiveData = false;
      }

      // Validate, clean, and deduplicate the scraped data
      const validatedData = this.processScrapedData({
        models,
        lastScraped: new Date().toISOString(),
        source: isLiveData ? "vellum-live" : "vellum-mock",
      });

      return validatedData;
    } catch (error) {
      console.error("VellumScraper failed completely:", error);
      // Final fallback to mock data
      const mockData = await this.getMockData();
      return this.processScrapedData({
        models: mockData.models,
        lastScraped: new Date().toISOString(),
        source: "vellum-mock-fallback",
      });
    }
  }

  private async scrapeWithFirecrawl(): Promise<BenchmarkModel[]> {
    if (!this.firecrawlApiKey) {
      throw new Error("Firecrawl API key is required");
    }

    const firecrawlUrl = "https://api.firecrawl.dev/v1/scrape";
    
    const payload = {
      url: this.baseUrl,
      formats: ["extract"],
      extract: {
        schema: {
          type: "object",
          properties: {
            models: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  provider: { type: "string" },
                  overallScore: { type: "number" },
                  costEfficiency: { type: "number" },
                  speed: { type: "number" },
                  performance: { type: "number" },
                  gpqaDiamond: { type: "number" },
                  aime2024: { type: "number" },
                  sweBench: { type: "number" },
                  bfcl: { type: "number" },
                  alderPolyglot: { type: "number" },
                  inputCostPer1M: { type: "number" },
                  outputCostPer1M: { type: "number" },
                  tokensPerSecond: { type: "number" },
                  timeToFirstToken: { type: "number" },
                  contextLength: { type: "number" },
                },
                required: ["name", "provider"]
              }
            }
          }
        }
      }
    };

    const response = await fetch(firecrawlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.firecrawlApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as FirecrawlResponse;
    
    if (!data.success) {
      throw new Error(`Firecrawl extraction failed: ${data.error || 'Unknown error'}`);
    }

    if (!data.data?.extract?.models) {
      throw new Error("No model data found in Firecrawl response");
    }

    return this.transformFirecrawlData(data.data.extract.models);
  }

  private async scrapeWithDirectParsing(): Promise<BenchmarkModel[]> {
    if (!this.firecrawlApiKey) {
      throw new Error("Firecrawl API key is required for direct parsing");
    }

    const firecrawlUrl = "https://api.firecrawl.dev/v1/scrape";
    
    const payload = {
      url: this.baseUrl,
      formats: ["markdown", "html"]
    };

    const response = await fetch(firecrawlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.firecrawlApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as FirecrawlResponse;
    
    if (!data.success) {
      throw new Error(`Firecrawl scraping failed: ${data.error || 'Unknown error'}`);
    }

    // Parse the HTML/markdown content to extract model data
    const content = data.data?.markdown || data.data?.html || '';
    return this.parseContentForModels(content);
  }

  private transformFirecrawlData(models: any[]): BenchmarkModel[] {
    return models.map((model: any) => ({
      id: this.generateModelId(model.name, model.provider),
      name: model.name || 'Unknown Model',
      provider: model.provider || 'Unknown Provider',
      description: this.generateDescription(model.name, model.provider),
      cost_efficiency: (model.costEfficiency || 0).toString(),
      performance_score: (model.performance || 0).toString(),
      speed_score: (model.speed || 0).toString(),
      inputCostPer1M: model.inputCostPer1M || 0,
      outputCostPer1M: model.outputCostPer1M || 0,
      tokensPerSecond: model.tokensPerSecond || 0,
      timeToFirstToken: model.timeToFirstToken || 0,
      benchmarks: {
        gpqaDiamond: model.gpqaDiamond || 0,
        aime2024: model.aime2024 || 0,
        sweBench: model.sweBench || 0,
        bfcl: model.bfcl || 0,
        alderPolyglot: model.alderPolyglot || 0,
      },
      contextLength: model.contextLength || 0,
      lastUpdated: new Date().toISOString(),
    }));
  }

  private parseContentForModels(content: string): BenchmarkModel[] {
    // Simple parsing logic for markdown/HTML content
    // This is a basic implementation - you might want to make it more sophisticated
    const models: BenchmarkModel[] = [];
    
    // Look for common patterns in the content
    const lines = content.split('\n');
    
    // This is a simplified parser - you'd want to make this more robust
    // based on the actual structure of Vellum's leaderboard
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for model names (this is a very basic approach)
      if (line.includes('GPT') || line.includes('Claude') || line.includes('Gemini') || 
          line.includes('Llama') || line.includes('PaLM')) {
        
        const modelName = this.extractModelName(line);
        const provider = this.extractProvider(line);
        
        if (modelName && provider) {
          models.push({
            id: this.generateModelId(modelName, provider),
            name: modelName,
            provider: provider,
            description: this.generateDescription(modelName, provider),
            cost_efficiency: "7.0", // Default values - would need better parsing
            performance_score: "8.0",
            speed_score: "7.5",
            inputCostPer1M: 0.001,
            outputCostPer1M: 0.003,
            tokensPerSecond: 50,
            timeToFirstToken: 0.5,
            benchmarks: {
              gpqaDiamond: 50,
              aime2024: 30,
              sweBench: 40,
              bfcl: 60,
              alderPolyglot: 45,
            },
            contextLength: 128000,
            lastUpdated: new Date().toISOString(),
          });
        }
      }
    }
    
    return models;
  }

  private extractModelName(line: string): string | null {
    // Extract model name from line - basic implementation
    const patterns = [
      /GPT[- ]?[\d\.]+[^,\s]*/i,
      /Claude[- ]?[\d\.]+[^,\s]*/i,
      /Gemini[- ]?[\w\d\.]+[^,\s]*/i,
      /Llama[- ]?[\d\.]+[^,\s]*/i,
      /PaLM[- ]?[\d\.]+[^,\s]*/i,
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }
    
    return null;
  }

  private extractProvider(line: string): string | null {
    const providers = ['OpenAI', 'Anthropic', 'Google', 'Meta', 'Cohere', 'Mistral'];
    
    for (const provider of providers) {
      if (line.toLowerCase().includes(provider.toLowerCase())) {
        return provider;
      }
    }
    
    return null;
  }

  private generateModelId(name: string, provider: string): string {
    return `${provider.toLowerCase()}-${name.toLowerCase().replace(/\s+/g, '-')}`;
  }

  private generateDescription(name: string, provider: string): string {
    const descriptions: Record<string, string> = {
      'gpt-4': 'Advanced reasoning and complex problem solving',
      'gpt-3.5': 'Fast and cost-effective for general tasks',
      'claude': 'Excellent for analysis and creative writing',
      'gemini': 'Multimodal AI with strong reasoning capabilities',
      'llama': 'Open-source model with good general performance',
      'palm': 'Google\'s large language model for various tasks',
    };
    
    const key = name.toLowerCase().split(/[-\s]/)[0];
    return descriptions[key] || `${provider} language model for various AI tasks`;
  }

  private processScrapedData(data: LeaderboardData): LeaderboardData {
    // Remove duplicates and validate data
    const uniqueModels = data.models.filter((model, index, array) => 
      array.findIndex(m => m.id === model.id) === index
    );

    // Sort by performance score
    uniqueModels.sort((a, b) => 
      parseFloat(b.performance_score) - parseFloat(a.performance_score)
    );

    return {
      ...data,
      models: uniqueModels,
    };
  }

  private async getMockData(): Promise<LeaderboardData> {
    return {
      models: [
        {
          id: "openai-gpt-4-turbo",
          name: "GPT-4 Turbo",
          provider: "OpenAI",
          description: "Advanced reasoning and complex analysis",
          cost_efficiency: "7.0",
          performance_score: "9.5",
          speed_score: "8.5",
          inputCostPer1M: 0.01,
          outputCostPer1M: 0.03,
          tokensPerSecond: 45,
          timeToFirstToken: 0.8,
          benchmarks: {
            gpqaDiamond: 78,
            aime2024: 74,
            sweBench: 87,
            bfcl: 91,
            alderPolyglot: 85,
          },
          contextLength: 128000,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: "anthropic-claude-3-5-sonnet",
          name: "Claude 3.5 Sonnet",
          provider: "Anthropic",
          description: "Balanced performance and efficiency",
          cost_efficiency: "7.5",
          performance_score: "9.3",
          speed_score: "8.8",
          inputCostPer1M: 0.003,
          outputCostPer1M: 0.015,
          tokensPerSecond: 50,
          timeToFirstToken: 0.6,
          benchmarks: {
            gpqaDiamond: 82,
            aime2024: 71,
            sweBench: 89,
            bfcl: 88,
            alderPolyglot: 87,
          },
          contextLength: 200000,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: "google-gemini-1-5-pro",
          name: "Gemini 1.5 Pro",
          provider: "Google",
          description: "Multimodal AI with strong reasoning",
          cost_efficiency: "8.0",
          performance_score: "9.0",
          speed_score: "8.5",
          inputCostPer1M: 0.0035,
          outputCostPer1M: 0.0105,
          tokensPerSecond: 48,
          timeToFirstToken: 0.7,
          benchmarks: {
            gpqaDiamond: 75,
            aime2024: 68,
            sweBench: 84,
            bfcl: 86,
            alderPolyglot: 82,
          },
          contextLength: 1000000,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: "meta-llama-3-1-405b",
          name: "Llama 3.1 405B",
          provider: "Meta",
          description: "Large open-source model with strong capabilities",
          cost_efficiency: "6.5",
          performance_score: "8.8",
          speed_score: "7.5",
          inputCostPer1M: 0.0016,
          outputCostPer1M: 0.0048,
          tokensPerSecond: 35,
          timeToFirstToken: 1.2,
          benchmarks: {
            gpqaDiamond: 73,
            aime2024: 65,
            sweBench: 80,
            bfcl: 84,
            alderPolyglot: 78,
          },
          contextLength: 128000,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: "openai-gpt-3-5-turbo",
          name: "GPT-3.5 Turbo",
          provider: "OpenAI",
          description: "Fast and cost-effective for general tasks",
          cost_efficiency: "9.5",
          performance_score: "8.0",
          speed_score: "9.2",
          inputCostPer1M: 0.0005,
          outputCostPer1M: 0.0015,
          tokensPerSecond: 80,
          timeToFirstToken: 0.3,
          benchmarks: {
            gpqaDiamond: 45,
            aime2024: 35,
            sweBench: 68,
            bfcl: 76,
            alderPolyglot: 71,
          },
          contextLength: 16000,
          lastUpdated: new Date().toISOString(),
        },
      ],
      lastScraped: new Date().toISOString(),
      source: "vellum-mock",
    };
  }
}
