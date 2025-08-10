# 🚀 LLM Router

[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat&logo=vercel)](https://vercel.com/new)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.4-blue?logo=typescript)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-13-black?logo=next.js)](https://nextjs.org)

Welcome to **LLM Router**, your one-stop hub for effortlessly selecting the perfect Large Language Model (LLM). Whether you’re optimizing for budget, speed, or cutting-edge performance, LLM Router makes it a breeze.

## 🎉 Highlights

- Intuitive **drag-and-drop** priority stacking
- **Live leaderboard** updates—no manual refresh needed
- Secure **Gemini** recommendations via GoogleGenAI
- Responsive design: works beautifully on desktop and mobile
- Crafted with **TypeScript**, **Tailwind CSS**, and **Shadcn UI**

## 🚀 Quick Start

1. Clone the repo

   ```bash
   git clone https://github.com/razzacktiger/LLM-Router.git
   cd LLM-Router
   ```

2. Install dependencies

   ```bash
   npm install  # or yarn install / pnpm install
   ```

3. Add your Gemini API key

   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   ```

4. Launch the dev server

   ```bash
   npm run dev  # or yarn dev / pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) and start routing!

## 🏗️ Built With

- **Next.js** — The React framework for production
- **Shadcn UI** — A superbly crafted component library
- **Tailwind CSS** — Utility-first styling made agile
- **GoogleGenAI (Gemini)** — AI-powered LLM recommendations

## 📂 Project Structure

```bash
src/
├── app/
│   ├── api/
│   │   ├── gemini-analyze/route.ts    # Secure server-side Gemini calls
│   │   └── scrape/route.ts           # Live leaderboard scraping
│   ├── page.tsx                      # Landing page with LLM Router UI
│   └── globals.css                   # Global styles
└── components/
    └── LLMRouter.tsx                 # Drag-and-drop priority UI & logic
```

## 🤝 Contributing

1. Fork it
2. Create your branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
