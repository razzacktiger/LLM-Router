# Firecrawl Implementation for LLM Router

## 🎯 Overview

This document outlines the **complete Firecrawl implementation** that replaces the mock data approach with real-time scraping of the Vellum LLM leaderboard.

## 🔄 What Changed

### Before (Mock Data Approach)

```typescript
// ❌ Old approach - always used mock data
async scrapeLeaderboard(): Promise<LeaderboardData> {
  const mockData = await this.getMockData()
  return { models: mockData.models, source: 'vellum' }
}
```

### After (Firecrawl Implementation)

```typescript
// ✅ New approach - real scraping with fallback
async scrapeLeaderboard(): Promise<LeaderboardData> {
  if (this.firecrawlApiKey) {
    try {
      return await this.scrapeWithFirecrawl() // Real data
    } catch (error) {
      return await this.getMockData() // Fallback
    }
  }
  return await this.getMockData() // No API key
}
```

## 🚀 Why Use Firecrawl?

### **1. No Browser Dependencies**

- ❌ **Puppeteer/Playwright**: Requires Chrome installation, heavy setup
- ✅ **Firecrawl**: Cloud-based, no local browser needed

### **2. AI-Powered Extraction**

- Uses AI to understand page structure and extract structured data
- Handles dynamic content and complex layouts automatically
- Smart schema-based extraction with natural language prompts

### **3. Production Ready**

- Built-in rate limiting and retry mechanisms
- Reliable and scalable infrastructure
- Handles JavaScript-heavy sites seamlessly

### **4. Intelligent Fallbacks**

- Falls back to mock data if API key missing
- Graceful error handling for network issues
- Multiple extraction strategies (structured + HTML parsing)

## 🧪 What You Can Test Right Now

### **Option 1: With Firecrawl API (Recommended)**

1. **Get API Key**: Sign up at [firecrawl.dev](https://firecrawl.dev)
2. **Add to Environment**:
   ```bash
   # Add to your .env.local file
   FIRECRAWL_API_KEY=your_api_key_here
   ```
3. **Test the API**:

   ```bash
   # GET request - basic scrape
   curl http://localhost:3000/api/scrape

   # POST request - force refresh
   curl -X POST http://localhost:3000/api/scrape \
     -H "Content-Type: application/json" \
     -d '{"forceFirecrawl": true}'
   ```

### **Option 2: Without API Key (Mock Data)**

1. **Start Development**:
   ```bash
   npm run dev
   ```
2. **Test Mock Data**:
   ```bash
   curl http://localhost:3000/api/scrape
   ```

Expected response with `source: "vellum-mock"` instead of `"vellum-live"`

## 📊 Real vs Mock Data

### **Live Data (with Firecrawl)**

- ✅ Up-to-date benchmark scores
- ✅ Current pricing information
- ✅ Latest model releases
- ✅ Real performance metrics
- ✅ Source: `"vellum-live"`

### **Mock Data (fallback)**

- ⚠️ Static, outdated information
- ⚠️ Limited model coverage
- ⚠️ No real-time updates
- ✅ Reliable for development
- ✅ Source: `"vellum-mock"`

## 🔧 Implementation Details

### **Structured Data Extraction**

```typescript
const schema = {
  type: "object",
  properties: {
    models: {
      type: "array",
      items: {
        properties: {
          name: { type: "string" },
          provider: { type: "string" },
          contextWindow: { type: "number" },
          inputCost: { type: "number" },
          outputCost: { type: "number" },
          benchmarks: {
            gpqa: { type: "number" },
            aime: { type: "number" },
            sweBench: { type: "number" },
          },
        },
      },
    },
  },
};
```

### **Smart Prompt Engineering**

```typescript
const prompt = `Extract LLM model data from this leaderboard page. 
Focus on the comprehensive table that shows models with their 
benchmark scores, pricing, and performance metrics.`;
```

### **Error Handling Strategy**

1. **Try Firecrawl extraction** (structured data)
2. **Fallback to HTML parsing** (if extraction fails)
3. **Use mock data** (if all else fails)
4. **Log everything** for debugging

## 🎮 Testing the Implementation

### **Basic Test**

```typescript
import { vellumScraper } from "@/lib/pipeline/scraper";

const data = await vellumScraper.scrapeLeaderboard();
console.log(`Found ${data.models.length} models`);
console.log(`Data source: ${data.source}`);
```

### **API Endpoint Test**

Visit: `http://localhost:3000/api/scrape`

Expected response:

```json
{
  "success": true,
  "data": {
    "models": [...],
    "lastScraped": "2025-01-07T...",
    "source": "vellum-live" // or "vellum-mock"
  },
  "meta": {
    "modelCount": 37,
    "isLiveData": true,
    "scrapedAt": "..."
  }
}
```

## 🔄 Migration Path

### **Immediate (No API Key)**

1. Code works exactly as before with mock data
2. No breaking changes to existing functionality
3. Enhanced logging and error handling

### **With API Key**

1. Add `FIRECRAWL_API_KEY` to environment
2. Restart development server
3. Get live data automatically

### **Production Deployment**

1. Add Firecrawl API key to production environment
2. Set up monitoring for scrape failures
3. Configure caching for rate limit management

## 🚨 Important Notes

### **Rate Limiting**

- Firecrawl has usage limits based on your plan
- The implementation includes fallbacks to prevent failures
- Consider caching results for production use

### **Data Freshness**

- Live data is scraped on each request
- Consider implementing caching for better performance
- Mock data serves as reliable fallback

### **Debugging**

- All operations are logged with the `VellumScraper` context
- Check logs to see which data source is being used
- API responses include metadata about data source

## 🎯 Next Steps

1. **Test with Firecrawl API key**
2. **Monitor scraping success rate**
3. **Implement caching layer** for production
4. **Add more data sources** (other leaderboards)
5. **Create dashboard** for monitoring scrape health

## 📝 Files Modified

- ✅ `src/lib/pipeline/scraper.ts` - Main implementation
- ✅ `src/config/env.ts` - Environment configuration
- ✅ `src/app/api/scrape/route.ts` - Testing API endpoint
- ✅ `.env.example` - Environment template

**Ready to test!** 🚀
