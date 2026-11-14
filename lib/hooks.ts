"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { runModel, type ModelOutput } from "./model/model";
import { simulate, type MCInput, type MCOutput } from "./model/montecarlo";
import { useStore } from "./store";
import type { Feed, FeedId } from "./market/types";
import { fetchUsdInrDirect } from "./market/client";

export function useModel(): ModelOutput {
  const scenario = useStore((s) => s.scenario);
  const coef = useStore((s) => s.coef);
  return useMemo(() => runModel(scenario, coef), [scenario, coef]);
}

/** Monte Carlo in a Web Worker, debounced; falls back to a memoised 1,000-path run. */
export function useMonteCarlo(input: Omit<MCInput, "paths">): MCOutput | null {
  const [out, setOut] = useState<MCOutput | null>(null);
  const worker = useRef<Worker | null>(null);
  const failed = useRef(false);
  const seq = useRef(0);

  useEffect(() => {
    try {
      const w = new Worker(new URL("./workers/mc.worker.ts", import.meta.url));
      worker.current = w;
      w.onmessage = (e: MessageEvent<{ id: number; result: MCOutput }>) => {
        if (e.data.id === seq.current) setOut(e.data.result);
      };
      w.onerror = () => {
        failed.current = true;
      };
    } catch {
      failed.current = true;
    }
    return () => worker.current?.terminate();
  }, []);

  const { start, end, weeks, volAnnual } = input;
  useEffect(() => {
    const id = ++seq.current;
    const t = setTimeout(() => {
      if (worker.current && !failed.current) worker.current.postMessage({ id, input: { start, end, weeks, volAnnual, paths: 2000 } });
      else setOut(simulate({ start, end, weeks, volAnnual, paths: 1000 }));
    }, 60);
    return () => clearTimeout(t);
  }, [start, end, weeks, volAnnual]);

  return out;
}

/** Fetch live feeds once per mount, plus every 15 minutes. */
export function useMarketFeeds() {
  const setFeeds = useStore((s) => s.setFeeds);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const t0 = performance.now();
      const urls: [FeedId, string][] = [
        ["usdinr", "/api/market/usdinr"],
        ["brent", "/api/market/fred?series=DCOILBRENTEU"],
        ["us10y", "/api/market/fred?series=DGS10"],
        ["usd", "/api/market/fred?series=DTWEXBGS"],
      ];
      const STATIC = process.env.NEXT_PUBLIC_STATIC === "1";
      const results = await Promise.allSettled(
        urls.map(([id, u]) => (STATIC ? (id === "usdinr" ? fetchUsdInrDirect() : Promise.reject(new Error("snapshot"))) : fetch(u).then((r) => r.json() as Promise<Feed>)))
      );
      if (!alive) return;
      const next: Partial<Record<FeedId, Feed>> = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value && typeof r.value.value === "number") next[urls[i][0]] = r.value;
      });
      setFeeds(next, { latencyMs: Math.round(performance.now() - t0), lastRefresh: new Date().toISOString(), loading: false });
    };
    load();
    const iv = setInterval(load, 15 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [setFeeds]);
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const iv = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(iv);
  }, [intervalMs]);
  return now;
}
