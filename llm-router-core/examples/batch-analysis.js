const { LLMRouter } = require('../dist/index.js');

async function batchExample() {
  console.log('🚀 LLM Router Core - Batch Analysis Example\n');

  const router = new LLMRouter({
    geminiApiKey: process.env.GEMINI_API_KEY,
    enableLogging: true
  });

  // Multiple tasks with different priorities
  const requests = [
    {
      id: 'coding-task',
      prompt: "Implement a Redis cache with Python using connection pooling",
      priorities: { performance: 0.7, cost: 0.1, speed: 0.2 }
    },
    {
      id: 'writing-task', 
      prompt: "Write a blog post about sustainable technology trends in 2024",
      priorities: { performance: 0.3, cost: 0.4, speed: 0.3 }
    },
    {
      id: 'math-task',
      prompt: "Solve this calculus optimization problem: find the maximum area of a rectangle inscribed in a semicircle",
      priorities: { performance: 0.8, cost: 0.1, speed: 0.1 }
    },
    {
      id: 'business-task',
      prompt: "Create a quarterly business report template for a SaaS company",
      priorities: { performance: 0.2, cost: 0.6, speed: 0.2 }
    }
  ];

  try {
    console.log(`📋 Processing ${requests.length} tasks in batch...\n`);

    const startTime = Date.now();
    
    const results = await router.batchSelect(requests, {
      concurrency: 2,
      includeReasoning: true
    });

    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;

    console.log(`✅ Batch analysis completed in ${totalTime.toFixed(1)} seconds\n`);

    results.forEach((result, index) => {
      console.log(`📋 Task ${index + 1}: ${result.requestId}`);
      console.log(`🎯 Selected Model: ${result.selectedModel.name} (${result.selectedModel.provider})`);
      console.log(`📊 Score: ${result.score.toFixed(1)}/10`);
      console.log(`🔍 Task Type: ${result.taskAnalysis.taskType}`);
      console.log(`💡 Complexity: ${result.taskAnalysis.complexity}`);
      
      if (result.reasoning) {
        console.log(`🧠 AI Reasoning: ${result.reasoning.substring(0, 100)}...`);
      }
      
      console.log(`🏆 Alternatives: ${result.alternatives.map(alt => alt.name).join(', ')}`);
      console.log(''); // Empty line for separation
    });

    // Summary statistics
    const taskTypes = results.map(r => r.taskAnalysis.taskType);
    const uniqueTaskTypes = [...new Set(taskTypes)];
    const selectedProviders = results.map(r => r.selectedModel.provider);
    const uniqueProviders = [...new Set(selectedProviders)];
    
    console.log('📊 Batch Summary:');
    console.log(`  Task Types: ${uniqueTaskTypes.join(', ')}`);
    console.log(`  Providers Used: ${uniqueProviders.join(', ')}`);
    console.log(`  Average Score: ${(results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(1)}/10`);
    console.log(`  Processing Time: ${totalTime.toFixed(1)}s (${(totalTime / requests.length).toFixed(1)}s per task)`);

  } catch (error) {
    console.error('❌ Batch analysis failed:', error.message);
  }
}

// Check if API key is provided
if (!process.env.GEMINI_API_KEY) {
  console.log('⚠️  No Gemini API key found. The example will use fallback analysis.');
  console.log('💡 To get full AI analysis, set your API key:');
  console.log('export GEMINI_API_KEY=your_api_key_here\n');
}

// Run the example
batchExample().catch(console.error);
