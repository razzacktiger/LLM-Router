#!/usr/bin/env node

/**
 * Live Vellum Scraping Example with Firecrawl
 * 
 * This example demonstrates how to use the LLMRouter with live
 * Vellum leaderboard data using the Firecrawl API.
 */

const { LLMRouter } = require('../dist/index.js');

async function demonstrateLiveVellumScraping() {
  console.log('🔥 Live Vellum Scraping with Firecrawl Demo\n');

  // Check for required API keys
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

  if (!geminiApiKey && !firecrawlApiKey) {
    console.log('⚠️  No API keys found. This example will use fallback analysis and mock data.');
    console.log('💡 To get full functionality, set your API keys:');
    console.log('   export GEMINI_API_KEY=your_gemini_api_key_here');
    console.log('   export FIRECRAWL_API_KEY=your_firecrawl_api_key_here\n');
  } else {
    console.log('✅ API Keys detected:');
    console.log(`   Gemini: ${geminiApiKey ? '✓' : '✗'}`);
    console.log(`   Firecrawl: ${firecrawlApiKey ? '✓' : '✗'}\n`);
  }

  try {
    // Initialize router with both API keys
    console.log('🚀 Initializing LLM Router with live scraping capabilities...');
    const router = new LLMRouter({
      geminiApiKey: geminiApiKey,
      firecrawlApiKey: firecrawlApiKey,
      enableLogging: true
    });

    // Test different types of tasks
    const testCases = [
      {
        name: "Complex Coding Task",
        prompt: "Write a multi-threaded web scraper in Python that can handle rate limiting, retries, and save data to both CSV and JSON formats",
        priorities: { performance: 0.7, cost: 0.2, speed: 0.1 }
      },
      {
        name: "Creative Writing",
        prompt: "Write a compelling short story about AI and humanity collaborating to solve climate change",
        priorities: { performance: 0.4, cost: 0.4, speed: 0.2 }
      },
      {
        name: "Mathematical Problem",
        prompt: "Solve this advanced calculus problem: Find the maximum value of f(x,y) = x²y - xy² subject to the constraint x² + y² = 1",
        priorities: { performance: 0.8, cost: 0.1, speed: 0.1 }
      },
      {
        name: "Business Analysis",
        prompt: "Analyze the market trends for electric vehicles in 2024 and provide strategic recommendations for a new startup",
        priorities: { performance: 0.5, cost: 0.3, speed: 0.2 }
      }
    ];

    console.log(`📋 Testing ${testCases.length} different use cases...\n`);

    for (const [index, testCase] of testCases.entries()) {
      console.log(`🧪 Test ${index + 1}: ${testCase.name}`);
      console.log(`📝 Prompt: "${testCase.prompt.substring(0, 80)}..."`);
      console.log(`📊 Priorities: Performance ${(testCase.priorities.performance * 100).toFixed(0)}%, Cost ${(testCase.priorities.cost * 100).toFixed(0)}%, Speed ${(testCase.priorities.speed * 100).toFixed(0)}%`);
      
      const startTime = Date.now();
      
      const result = await router.selectModel(testCase.prompt, testCase.priorities, {
        includeReasoning: true,
        maxModels: 20
      });
      
      const duration = Date.now() - startTime;
      
      console.log(`🎯 Recommended: ${result.selectedModel.name} (${result.selectedModel.provider})`);
      console.log(`📊 Score: ${result.score.toFixed(1)}/10`);
      console.log(`🧠 Task Type: ${result.taskAnalysis.taskType}`);
      console.log(`🔍 Complexity: ${result.taskAnalysis.complexity}`);
      console.log(`⏱️  Analysis Time: ${duration}ms`);
      
      if (result.reasoning && firecrawlApiKey) {
        console.log(`💡 AI Reasoning: ${result.reasoning.substring(0, 100)}...`);
      }
      
      console.log(`🏆 Alternatives: ${result.alternatives.slice(0, 2).map(m => `${m.name} (${m.score.toFixed(1)})`).join(', ')}`);
      console.log('─'.repeat(80));
    }

    // Display summary statistics
    console.log('\n📈 Summary:');
    console.log(`✅ All ${testCases.length} test cases completed successfully`);
    console.log(`🔄 Data Source: ${firecrawlApiKey ? 'Live Vellum Leaderboard' : 'Mock Data'}`);
    console.log(`🧠 AI Analysis: ${geminiApiKey ? 'Gemini AI' : 'Keyword-based fallback'}`);
    
    if (firecrawlApiKey) {
      console.log('\n🎉 Live scraping is working! Your router is using real-time leaderboard data.');
    } else {
      console.log('\n💡 To enable live scraping, get a Firecrawl API key from https://firecrawl.dev/');
    }

  } catch (error) {
    console.error('❌ Error during demonstration:', error.message);
    console.log('\n🛡️  The router includes robust fallback mechanisms for reliability.');
    console.log('💡 Check your API keys and internet connection.');
  }
}

// Run the demonstration
demonstrateLiveVellumScraping().catch(console.error);
