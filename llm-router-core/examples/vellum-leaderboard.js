#!/usr/bin/env node

/**
 * Vellum Leaderboard Integration Example
 * 
 * This example demonstrates how to use the LeaderboardProvider
 * to fetch live data from the Vellum leaderboard.
 */

const { LeaderboardProvider } = require('../dist/index.js');

async function demonstrateVellumIntegration() {
  console.log('🔥 Vellum Leaderboard Integration Demo\n');

  try {
    // Initialize with default Vellum leaderboard
    console.log('📡 Connecting to Vellum leaderboard...');
    const provider = new LeaderboardProvider();

    // Fetch latest model data
    console.log('⬇️  Fetching latest model data...\n');
    const models = await provider.getModels();

    console.log(`✅ Successfully fetched ${models.length} models from Vellum\n`);

    // Display top 5 models by overall score
    console.log('🏆 Top 5 Models by Overall Performance:');
    console.log('=' .repeat(60));
    
    const topModels = models
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 5);

    topModels.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name} (${model.provider})`);
      console.log(`   Overall Score: ${model.overallScore.toFixed(1)}/10`);
      console.log(`   Performance: ${model.performanceScore.toFixed(1)}/10`);
      console.log(`   Cost Efficiency: ${model.costScore.toFixed(1)}/10`);
      console.log(`   Speed: ${model.speedScore.toFixed(1)}/10`);
      
      if (model.benchmarks) {
        console.log(`   Key Benchmarks:`);
        if (model.benchmarks.mmluScore) console.log(`     • MMLU: ${model.benchmarks.mmluScore}`);
        if (model.benchmarks.humanEvalScore) console.log(`     • HumanEval: ${model.benchmarks.humanEvalScore}`);
        if (model.benchmarks.mathScore) console.log(`     • Math: ${model.benchmarks.mathScore}`);
      }
      
      if (model.pricing && model.pricing.inputCost) {
        console.log(`   Pricing: $${model.pricing.inputCost}/M input, $${model.pricing.outputCost}/M output`);
      }
      
      console.log('   ' + '-'.repeat(50));
    });

    // Display cost-effective models
    console.log('\n💰 Most Cost-Effective Models:');
    console.log('=' .repeat(60));
    
    const costEffectiveModels = models
      .sort((a, b) => b.costScore - a.costScore)
      .slice(0, 3);

    costEffectiveModels.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name} - Cost Score: ${model.costScore.toFixed(1)}/10`);
    });

    // Display fastest models
    console.log('\n⚡ Fastest Response Models:');
    console.log('=' .repeat(60));
    
    const fastModels = models
      .sort((a, b) => b.speedScore - a.speedScore)
      .slice(0, 3);

    fastModels.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name} - Speed Score: ${model.speedScore.toFixed(1)}/10`);
    });

    // Group by provider
    console.log('\n🏢 Models by Provider:');
    console.log('=' .repeat(60));
    
    const providerGroups = models.reduce((groups, model) => {
      const provider = model.provider || 'Unknown';
      if (!groups[provider]) groups[provider] = [];
      groups[provider].push(model);
      return groups;
    }, {});

    Object.entries(providerGroups).forEach(([provider, providerModels]) => {
      console.log(`${provider}: ${providerModels.length} models`);
      providerModels.slice(0, 2).forEach(model => {
        console.log(`  • ${model.name} (Overall: ${model.overallScore.toFixed(1)}/10)`);
      });
      if (providerModels.length > 2) {
        console.log(`  ... and ${providerModels.length - 2} more`);
      }
    });

    console.log('\n✨ Integration complete! This data is now available in your application.');
    console.log('\n📝 Note: Data is cached for 5 minutes to optimize performance.');
    console.log('🔄 To force refresh, create a new LeaderboardProvider instance.');

  } catch (error) {
    console.error('❌ Error fetching leaderboard data:', error.message);
    console.log('\n🛡️  The provider includes fallback mock data for development.');
    console.log('💡 Check your internet connection or API configuration.');
  }
}

// Run the demo
demonstrateVellumIntegration().catch(console.error);
