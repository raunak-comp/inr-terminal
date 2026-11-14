import { NextResponse } from "next/server";
import { fallback, fetchJson, remember, yearAgo } from "@/lib/market/server";
import { snapshotFeed } from "@/lib/market/snapshot";
import type { Feed } from "@/lib/market/types";

export const revalidate = 900;

type FrankSeries = { start_date: string; end_date: string; rates: Record<string, { INR: number }> };
const HOSTS = ["https://api.frankfurter.dev/v1", "https://api.frankfurter.app"];

export async function GET() {
  const from = yearAgo();
  for (const host of HOSTS) {
    try {
      const data = await fetchJson<FrankSeries>(`${host}/${from}..?base=USD&symbols=INR`);
      const series = Object.keys(data.rates)
        .sort()
        .map((d) => [d, data.rates[d].INR] as [string, number])
        .filter(([, v]) => Number.isFinite(v));
      if (series.length < 2) throw new Error("empty series");
      const last = series[series.length - 1];
      const feed: Feed = {
        id: "usdinr", label: "USD/INR", value: last[1], change: last[1] - series[series.length - 2][1], series,
        asOf: last[0], source: "ECB reference rate via Frankfurter", status: "live",
      };
      return NextResponse.json(remember(feed));
    } catch {
      // try next host
    }
  }
  return NextResponse.json(fallback("usdinr", snapshotFeed("usdinr")));
}
