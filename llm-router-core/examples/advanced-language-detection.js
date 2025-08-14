const { LLMRouter } = require('../dist');

async function demonstrateAdvancedLanguageDetection() {
  console.log('🚀 Advanced Multi-Language LLM Router Demo\n');

  const router = new LLMRouter({
    geminiApiKey: process.env.GEMINI_API_KEY, // Optional
    enableCaching: true
  });

  // Test cases with diverse programming contexts
  const testCases = [
    {
      name: 'Rust Systems Programming',
      prompt: 'Write a high-performance concurrent web server in Rust using Tokio for handling 10k+ connections with memory safety',
      priorities: { performance: 0.8, cost: 0.1, speed: 0.1 }
    },
    {
      name: 'React Web Development',
      prompt: 'Create a responsive React TypeScript component with hooks for a real-time chat application using WebSocket',
      priorities: { performance: 0.4, cost: 0.4, speed: 0.2 }
    },
    {
      name: 'Python Data Science',
      prompt: 'Build a machine learning pipeline using pandas and scikit-learn for predicting customer churn with feature engineering',
      priorities: { performance: 0.7, cost: 0.2, speed: 0.1 }
    },
    {
      name: 'Swift iOS Development',
      prompt: 'Design a SwiftUI app with Core Data integration for offline-first photo gallery with iCloud sync',
      priorities: { performance: 0.6, cost: 0.2, speed: 0.2 }
    },
    {
      name: 'Go Microservices',
      prompt: 'Implement a Go microservice using Gin framework with Docker containerization and Kubernetes deployment',
      priorities: { performance: 0.5, cost: 0.3, speed: 0.2 }
    },
    {
      name: 'Flutter Cross-Platform',
      prompt: 'Create a Flutter e-commerce app with state management using Bloc pattern and Firebase backend',
      priorities: { performance: 0.5, cost: 0.3, speed: 0.2 }
    },
    {
      name: 'Java Enterprise',
      prompt: 'Build a Spring Boot REST API with JPA/Hibernate for inventory management with transaction handling',
      priorities: { performance: 0.4, cost: 0.3, speed: 0.3 }
    },
    {
      name: 'C++ Game Development',
      prompt: 'Optimize a C++ game engine renderer for real-time ray tracing with CUDA acceleration',
      priorities: { performance: 0.9, cost: 0.05, speed: 0.05 }
    }
  ];

  console.log('Testing language detection and model selection...\n');

  for (const testCase of testCases) {
    console.log(`\n📋 ${testCase.name}`);
    console.log(`Prompt: "${testCase.prompt.substring(0, 60)}..."`);
    
    try {
      const result = await router.selectModel(testCase.prompt, testCase.priorities);
      
      console.log(`✅ Selected Model: ${result.selectedModel.name}`);
      console.log(`📊 Score: ${result.selectedModel.score.toFixed(3)}`);
      
      if (result.selectedModel.languageContext) {
        const ctx = result.selectedModel.languageContext;
        console.log(`🔍 Language: ${ctx.language || 'Not detected'}`);
        console.log(`🌐 Domain: ${ctx.domain}`);
        console.log(`📈 Confidence: ${(ctx.confidence * 100).toFixed(1)}%`);
        if (ctx.framework) {
          console.log(`🔧 Framework: ${ctx.framework}`);
        }
        if (ctx.characteristics.length > 0) {
          console.log(`🏷️  Characteristics: ${ctx.characteristics.slice(0, 3).join(', ')}`);
        }
      }
      
      console.log(`💰 Cost: $${result.selectedModel.costPer1M}/1M tokens`);
      console.log(`⚡ Speed: ${result.selectedModel.speed} tokens/sec`);
      console.log('─'.repeat(50));
      
    } catch (error) {
      console.error(`❌ Error for ${testCase.name}:`, error.message);
    }
  }
  
  // Batch processing example
  console.log('\n\n🔄 Batch Processing Example');
  console.log('Processing multiple tasks simultaneously...\n');
  
  const batchTasks = testCases.slice(0, 4).map(tc => ({
    prompt: tc.prompt,
    priorities: tc.priorities,
    metadata: { taskName: tc.name }
  }));
  
  try {
    const batchResults = await router.batchSelect(batchTasks);
    
    console.log(`✅ Processed ${batchResults.length} tasks in batch`);
    
    batchResults.forEach((result, index) => {
      console.log(`\n${index + 1}. ${batchTasks[index].metadata.taskName}:`);
      console.log(`   Model: ${result.selectedModel.name} (Score: ${result.selectedModel.score.toFixed(3)})`);
      if (result.selectedModel.languageContext?.language) {
        console.log(`   Language: ${result.selectedModel.languageContext.language} (${result.selectedModel.languageContext.domain})`);
      }
    });
    
  } catch (error) {
    console.error('❌ Batch processing error:', error.message);
  }
  
  // Domain-specific recommendations
  console.log('\n\n🎯 Domain-Specific Recommendations');
  
  const domains = [
    { name: 'Systems Programming', prompt: 'low-level memory management in Rust' },
    { name: 'Web Development', prompt: 'React component with TypeScript' },
    { name: 'Data Science', prompt: 'machine learning with Python pandas' },
    { name: 'Mobile Development', prompt: 'iOS app with SwiftUI' }
  ];
  
  for (const domain of domains) {
    try {
      const recommendations = await router.getRecommendationsForDomain(domain.name.toLowerCase().replace(' ', '-'));
      console.log(`\n${domain.name}:`);
      console.log(`  Top Models: ${recommendations.slice(0, 3).map(r => r.name).join(', ')}`);
    } catch (error) {
      console.log(`  ${domain.name}: Standard recommendations apply`);
    }
  }
  
  console.log('\n🎉 Advanced language detection demo completed!');
  console.log('\nKey Features Demonstrated:');
  console.log('✓ Automatic language and framework detection');
  console.log('✓ Domain-specific model scoring');
  console.log('✓ Context-aware priority adjustment');
  console.log('✓ Batch processing capabilities');
  console.log('✓ Confidence-based recommendations');
}

// Run the demo
demonstrateAdvancedLanguageDetection().catch(console.error);
