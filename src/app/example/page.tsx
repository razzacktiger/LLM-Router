import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { env } from "@/config/env";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type ExampleItem = {
  id: number;
  title: string;
  description: string;
  createdAt: string;
};

// Server Action to fetch data
async function getExampleData(): Promise<ExampleItem[]> {
  const res = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/example`, {
    // Ensure fresh data on each request
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}

// Loading component
function LoadingCard() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Card key={i} className="w-full animate-pulse">
          <CardHeader>
            <div className="h-6 w-3/4 bg-zinc-800 rounded"></div>
            <div className="h-4 w-1/2 bg-zinc-800 rounded mt-2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-4 w-full bg-zinc-800 rounded"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Error component
function ErrorCard({ error }: { error: Error }) {
  return (
    <Card className="w-full border-red-900/10 bg-red-900/5">
      <CardHeader>
        <CardTitle className="text-red-500">Error</CardTitle>
        <CardDescription>{error.message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

// Example Items component
async function ExampleItems() {
  try {
    const data = await getExampleData();

    return (
      <div className="space-y-4">
        {data.map(item => (
          <Card
            key={item.id}
            className="w-full bg-white/[0.05] border-white/[0.1] shadow-xl"
          >
            <CardHeader>
              <CardTitle className="text-white">{item.title}</CardTitle>
              <CardDescription className="text-zinc-400">
                Created: {new Date(item.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  } catch (error) {
    return (
      <ErrorCard
        error={
          error instanceof Error ? error : new Error("Something went wrong")
        }
      />
    );
  }
}

export default function ExamplePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-white/[0.1] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.15] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Data Fetching Example
            </h1>
            <p className="mt-4 text-lg text-zinc-400">
              This page demonstrates fetching data from an API route using React
              Suspense for loading states.
            </p>
          </div>

          <Suspense fallback={<LoadingCard />}>
            <ExampleItems />
          </Suspense>

          {/* Code Example */}
          <div className="rounded-lg bg-zinc-900 p-4">
            <h3 className="text-sm font-medium text-zinc-400">How it works</h3>
            <pre className="mt-2 overflow-x-auto text-sm text-zinc-300">
              <code>{`// Server Component (app/example/page.tsx)
async function ExampleItems() {
  const data = await fetch('/api/example')
  return data.map(item => (
    <Card key={item.id}>
      <CardTitle>{item.title}</CardTitle>
      {/* ... */}
    </Card>
  ))
}

// API Route (app/api/example/route.ts)
export async function GET() {
  const data = await db.fetch()
  return NextResponse.json(data)
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
