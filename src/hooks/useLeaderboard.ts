"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LeaderboardData, ScrapeApiResponse } from "@/types/leaderboard";

type Status = "idle" | "loading" | "success" | "error";

export function useLeaderboard(initialRefresh = false) {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ScrapeApiResponse["meta"] | undefined>();

  const endpoint = useMemo(
    () => `/api/scrape${initialRefresh ? "?refresh=true" : ""}`,
    [initialRefresh]
  );

  const fetchData = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      const json: ScrapeApiResponse = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || json.message || "Request failed");
      }
      setData(json.data);
      setMeta(json.meta);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(async (force = false) => {
    const url = force ? "/api/scrape?refresh=true" : "/api/scrape";
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(url, { cache: "no-store" });
      const json: ScrapeApiResponse = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || json.message || "Request failed");
      }
      setData(json.data);
      setMeta(json.meta);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }, []);

  const backgroundRefresh = useCallback(async () => {
    try {
      await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ background: true }),
      });
    } catch {}
  }, []);

  return { status, data, error, meta, refresh, backgroundRefresh };
}
