const { LLMRouter } = require('llm-router-core');

async function multiLanguageExample() {
  console.log('🌍 LLM Router Core - Multi-Language Examples\n');

  const router = new LLMRouter({
    geminiApiKey: process.env.GEMINI_API_KEY
  });

  // Example tasks in different programming languages
  const languageTasks = [
    {
      id: 'python-ml',
      prompt: "Create a neural network with PyTorch for image classification",
      priorities: { performance: 0.8, cost: 0.1, speed: 0.1 }
    },
    {
      id: 'rust-systems',
      prompt: "Write a high-performance web server in Rust using Tokio",
      priorities: { performance: 0.9, cost: 0.05, speed: 0.05 }
    },
    {
      id: 'go-microservice',
      prompt: "Build a REST API microservice in Go with MongoDB integration",
      priorities: { performance: 0.6, cost: 0.2, speed: 0.2 }
    },
    {
      id: 'javascript-react',
      prompt: "Create a React component with TypeScript for data visualization",
      priorities: { performance: 0.5, cost: 0.3, speed: 0.2 }
    },
    {
      id: 'java-spring',
      prompt: "Implement a Spring Boot application with JPA and security",
      priorities: { performance: 0.7, cost: 0.2, speed: 0.1 }
    },
    {
      id: 'cpp-algorithms',
      prompt: "Optimize this C++ sorting algorithm for large datasets",
      priorities: { performance: 0.9, cost: 0.05, speed: 0.05 }
    },
    {
      id: 'swift-ios',
      prompt: "Create an iOS app with SwiftUI for real-time chat",
      priorities: { performance: 0.6, cost: 0.2, speed: 0.2 }
    },
    {
      id: 'kotlin-android',
      prompt: "Build an Android app with Kotlin and Jetpack Compose",
      priorities: { performance: 0.6, cost: 0.3, speed: 0.1 }
    }
  ];

  try {
    console.log(`🔍 Analyzing ${languageTasks.length} multi-language tasks...\n`);

    const results = await router.batchSelect(languageTasks, {
      concurrency: 3,
      includeReasoning: true
    });

    results.forEach((result, index) => {
      const task = languageTasks.find(t => t.id === result.requestId);
      console.log(`🔧 ${task?.id?.toUpperCase()}:`);
      console.log(`   📝 Task: ${task?.prompt?.substring(0, 60)}...`);
      console.log(`   🎯 Best Model: ${result.selectedModel.name} (${result.selectedModel.provider})`);
      console.log(`   📊 Score: ${result.score.toFixed(1)}/10`);
      console.log(`   🧠 Task Type: ${result.taskAnalysis.taskType}`);
      console.log(`   🏆 Top Alternative: ${result.alternatives[0]?.name || 'N/A'}`);
      console.log('');
    });

    // Language-specific recommendations
    console.log('📋 Language-Specific Insights:');
    
    const languageGroups = {
      'Systems Programming (Rust, C++)': results.filter(r => 
        r.requestId?.includes('rust') || r.requestId?.includes('cpp')
      ),
      'Web Development (JS, Go, Java)': results.filter(r => 
        r.requestId?.includes('javascript') || r.requestId?.includes('go') || r.requestId?.includes('java')
      ),
      'Mobile Development (Swift, Kotlin)': results.filter(r => 
        r.requestId?.includes('swift') || r.requestId?.includes('kotlin')
      ),
      'Machine Learning (Python)': results.filter(r => 
        r.requestId?.includes('python')
      )
    };

    Object.entries(languageGroups).forEach(([category, categoryResults]) => {
      if (categoryResults.length > 0) {
        const avgScore = categoryResults.reduce((sum, r) => sum + r.score, 0) / categoryResults.length;
        const topProvider = categoryResults[0].selectedModel.provider;
        console.log(`   ${category}: Avg Score ${avgScore.toFixed(1)}, Top Provider: ${topProvider}`);
      }
    });

  } catch (error) {
    console.error('❌ Multi-language analysis failed:', error.message);
  }
}

// Run the example
multiLanguageExample().catch(console.error);
