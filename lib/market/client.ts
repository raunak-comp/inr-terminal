import { snapshotFeed } from "./snapshot";
import type { Feed } from "./types";

/** Browser-side USD/INR feed for static hosting (GitHub Pages): Frankfurter allows CORS. */
type FrankSeries = { rates: Record<string, { INR: number }> };
const HOSTS = ["https://api.frankfurter.dev/v1", "https://api.frankfurter.app"];

export async function fetchUsdInrDirect(): Promise<Feed> {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  d.setUTCDate(d.getUTCDate() - 7);
  const from = d.toISOString().slice(0, 10);
  for (const host of HOSTS) {
    try {
      const res = await fetch(`${host}/${from}..?base=USD&symbols=INR`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as FrankSeries;
      const series = Object.keys(data.rates).sort().map((k) => [k, data.rates[k].INR] as [string, number]).filter(([, v]) => Number.isFinite(v));
      if (series.length < 2) throw new Error("empty");
      const last = series[series.length - 1];
      return { id: "usdinr", label: "USD/INR", value: last[1], change: last[1] - series[series.length - 2][1], series, asOf: last[0], source: "ECB reference rate via Frankfurter", status: "live" };
    } catch {
      /* try next host */
    }
  }
  return snapshotFeed("usdinr");
}
