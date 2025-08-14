const { LLMRouter } = require('../dist/index.js');

async function basicExample() {
  console.log('🚀 LLM Router Core - Basic Example\n');

  // Initialize the router
  const router = new LLMRouter({
    geminiApiKey: process.env.GEMINI_API_KEY,
    enableLogging: true
  });

  // Define your task and priorities
  const prompt = "Write a Python function to reverse a binary tree";
  const priorities = {
    performance: 0.6,  // High performance for coding
    cost: 0.2,        // Low cost priority
    speed: 0.2        // Medium speed priority
  };

  try {
    console.log('📝 Task:', prompt);
    console.log('📊 Priorities:', priorities);
    console.log('\n🔍 Analyzing...\n');

    // Get intelligent model recommendation
    const result = await router.selectModel(prompt, priorities, {
      includeReasoning: true,
      maxModels: 20
    });

    console.log('🎯 Recommended Model:', result.selectedModel.name);
    console.log('🏢 Provider:', result.selectedModel.provider);
    console.log('📊 Overall Score:', result.score.toFixed(1));
    console.log('🧠 AI Analysis:', result.taskAnalysis.taskType);
    console.log('🔍 Complexity:', result.taskAnalysis.complexity);
    
    if (result.reasoning) {
      console.log('💡 AI Reasoning:', result.reasoning);
    }
    
    console.log('\n🏆 Top 3 Alternatives:');
    result.alternatives.forEach((model, i) => {
      console.log(`${i + 1}. ${model.name} (${model.provider}) - Score: ${model.score.toFixed(1)}`);
    });

    console.log('\n📈 Used Priorities:');
    console.log(`  Performance: ${(result.prioritiesUsed.performance * 100).toFixed(0)}%`);
    console.log(`  Cost: ${(result.prioritiesUsed.cost * 100).toFixed(0)}%`);
    console.log(`  Speed: ${(result.prioritiesUsed.speed * 100).toFixed(0)}%`);

    console.log('\n✅ Analysis complete!');

  } catch (error) {
    console.error('❌ Selection failed:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Tip: Set your Gemini API key with:');
      console.log('export GEMINI_API_KEY=your_api_key_here');
    }
  }
}

// Check if API key is provided
if (!process.env.GEMINI_API_KEY) {
  console.log('⚠️  No Gemini API key found. The example will use fallback analysis.');
  console.log('💡 To get full AI analysis, set your API key:');
  console.log('export GEMINI_API_KEY=your_api_key_here\n');
}

// Run the example
basicExample().catch(console.error);
