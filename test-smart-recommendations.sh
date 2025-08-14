#!/bin/bash

echo "🎯 Testing Smart LLM Recommendations with Combined Data"
echo "======================================================"

# Test different scenarios to see varied recommendations
BASE_URL="http://localhost:3000/api/gemini-analyze"

echo ""
echo "1️⃣ CODING TASK (should recommend high SWE-Bench model)"
echo "Prompt: 'Build a React component with TypeScript'"
echo "Priorities: Performance > Speed > Cost"
echo "Expected: GPT-5, Claude Opus 4.1, or similar with high SWE scores"
echo "----------------------------------------"

curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Build a React component with TypeScript for a complex form with validation",
    "priorities": [
      {"name": "Performance Quality", "description": "Prioritize accuracy and capability"},
      {"name": "Response Speed", "description": "Minimize latency and response time"},
      {"name": "Cost Efficiency", "description": "Optimize for budget and cost-effectiveness"}
    ],
    "models": []
  }' | jq -r '.result'

echo ""
echo ""
echo "2️⃣ MATH TASK (should recommend high AIME model)"
echo "Prompt: 'Solve complex calculus problems'"
echo "Priorities: Performance > Cost > Speed"
echo "Expected: Claude Opus 4.1 (Thinking), GPT-5, or high-math model"
echo "----------------------------------------"

curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Help me solve advanced calculus and differential equations for my PhD research",
    "priorities": [
      {"name": "Performance Quality", "description": "Prioritize accuracy and capability"},
      {"name": "Cost Efficiency", "description": "Optimize for budget and cost-effectiveness"},
      {"name": "Response Speed", "description": "Minimize latency and response time"}
    ],
    "models": []
  }' | jq -r '.result'

echo ""
echo ""
echo "3️⃣ BUDGET TASK (should recommend cost-efficient model)"
echo "Prompt: 'Simple content writing'"
echo "Priorities: Cost > Speed > Performance"
echo "Expected: GPT-5 Nano, GPT-5 Mini, or other budget option"
echo "----------------------------------------"

curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write simple blog posts and marketing copy for my small business",
    "priorities": [
      {"name": "Cost Efficiency", "description": "Optimize for budget and cost-effectiveness"},
      {"name": "Response Speed", "description": "Minimize latency and response time"},
      {"name": "Performance Quality", "description": "Prioritize accuracy and capability"}
    ],
    "models": []
  }' | jq -r '.result'

echo ""
echo ""
echo "✅ Test completed! Check if recommendations vary based on:"
echo "   • Task complexity (coding vs writing vs math)"
echo "   • Priority order (cost vs performance vs speed)"
echo "   • Actual benchmark scores being considered"
