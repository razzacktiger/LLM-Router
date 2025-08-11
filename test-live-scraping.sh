#!/bin/bash

echo "🔍 Testing live data scraping..."
echo "======================================="

echo "📋 Checking current data source:"
curl -s "http://localhost:3000/api/scrape" | jq '.meta.source, .meta.isLiveData, .meta.modelCount'

echo ""
echo "🔄 Forcing fresh scrape with Firecrawl:"
curl -s -X POST "http://localhost:3000/api/scrape" \
  -H "Content-Type: application/json" \
  -d '{"forceFirecrawl": true}' | jq '.meta.source, .meta.isLiveData, .meta.modelCount'

echo ""
echo "✅ Done! Check if source changed from 'vellum-mock' to 'vellum-live'"
