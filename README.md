## Hybrid Model Selection API

- **Endpoint**: `/api/hybrid-select`
- **Logic**: Combines Gemini AI analysis with deterministic scoring
- **Leaderboard Context**: All 35+ models are considered, grouped by performance tier and specialty
- **Prompt Engineering**: Gemini receives full leaderboard context and recommends models for the task, not just top performers
- **Selection Output**: Returns selected model, score breakdown, AI reasoning, and alternatives

## How It Works

1. **Prompt & Priorities**: User enters a prompt and ranks priorities (performance, cost, speed)
2. **Leaderboard Data**: All available models and benchmarks are fetched
3. **Gemini Analysis**: AI analyzes the prompt and leaderboard, classifies the task, and recommends models
4. **Deterministic Scoring**: Mathematical scoring ranks all models by weighted priorities
5. **Final Recommendation**: The best model is selected, with reasoning and alternatives provided
## 🚀 LLM Router & Model Analysis Platform

Welcome to the future of LLM model selection! This project is your all-in-one playground for exploring, benchmarking, and intelligently choosing the best language models for any task. Powered by Next.js, Google Gemini, and a live leaderboard of 35+ models, you'll get recommendations that are smart, fast, and tailored to your needs.

Ready to supercharge your AI workflow? Dive in and let the Router do the heavy lifting!

This project is a Next.js application for intelligent LLM model selection, benchmarking, and analysis. It features a hybrid model selection API powered by Google Gemini and deterministic scoring, leveraging a live leaderboard of 35+ models for accurate recommendations.



## ✨ Features
- **LLM Router**: Just type your prompt, drag to set your priorities, and get instant, AI-powered model recommendations.
- **Hybrid Model Selection**: Gemini AI + deterministic scoring = smarter, more relevant choices every time.
- **Leaderboard Integration**: Real-time benchmark data from 35+ models means your picks are always up-to-date.
- **Model Analysis Page**: Deep-dive into stats, benchmarks, and strengths—find the perfect model for any domain.
- **Responsive UI**: Sleek, glassmorphism-inspired design with drag-and-drop priorities for a delightful experience.
- **Todo List & Examples**: Classic Next.js demos to help you learn and extend.
- **Type Safety**: Built with TypeScript for reliability and developer happiness.



## 🛠️ Tech Stack
- [Next.js](https://nextjs.org) – Lightning-fast React framework
- [Google Gemini](https://ai.google.dev/) – AI model analysis and reasoning
- [Tailwind CSS](https://tailwindcss.com) – Utility-first styling
- [TypeScript](https://www.typescriptlang.org/) – Type safety everywhere
- [@dnd-kit/core](https://docs.dndkit.com/) – Drag-and-drop priorities
- [Lucide Icons](https://lucide.dev/) – Beautiful icons


## ⚡ Getting Started
Clone, install, and launch in minutes:

```bash
git clone <your-repo-url>
cd LLM-Router
npm install # or yarn or pnpm
```

Set up your `.env` file with any required API keys (see comments in code).

Start the dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start exploring!



## 🗂️ Project Structure
- `src/app/page.tsx` – Main LLM Router page (prompt, priorities, recommendations)
- `src/app/analysis/page.tsx` – Model analysis and leaderboard stats
- `src/app/api/hybrid-select/route.ts` – Hybrid model selection API (Gemini + deterministic)
- `src/hooks/useLeaderboard.ts` – Fetches live leaderboard data
- `src/lib/modelSelector.ts` – Deterministic model scoring logic
- `src/components/LLMRouter.tsx` – Router UI, drag-and-drop priorities, model card
- `src/components/BenchmarkTable.tsx`, `LeaderboardTable.tsx` – Benchmark and leaderboard tables
- `src/components/ui/*` – UI components (button, card, select, etc.)


## Learn More
- [Next.js Documentation](https://nextjs.org/docs)
- [Google Gemini](https://ai.google.dev/)
- [LLM Leaderboard](https://vellum.ai/llm-leaderboard)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)


## Deploy on Vercel
Deploy your Next.js app using [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).
See [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for details.
