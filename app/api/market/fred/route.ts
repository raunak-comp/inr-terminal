import { NextResponse, type NextRequest } from "next/server";
import { fallback, fetchJson, remember, yearAgo } from "@/lib/market/server";
import { snapshotFeed } from "@/lib/market/snapshot";
import type { Feed, FeedId } from "@/lib/market/types";

export const dynamic = "force-dynamic";

const SERIES: Record<string, { id: FeedId; label: string; source: string }> = {
  DGS10: { id: "us10y", label: "US 10Y", source: "FRED · DGS10 (US 10-year Treasury)" },
  DCOILBRENTEU: { id: "brent", label: "Brent", source: "FRED · DCOILBRENTEU (Brent spot)" },
  DTWEXBGS: { id: "usd", label: "Broad USD index (FRED)", source: "FRED · DTWEXBGS (broad USD index)" },
};

type FredObs = { observations: { date: string; value: string }[] };

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("series") ?? "";
  const meta = SERIES[key];
  if (!meta) return NextResponse.json({ error: "Unknown series. Use DGS10, DCOILBRENTEU or DTWEXBGS." }, { status: 400 });

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return NextResponse.json(snapshotFeed(meta.id));

  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${key}&api_key=${apiKey}&file_type=json&observation_start=${yearAgo()}`;
    const data = await fetchJson<FredObs>(url);
    const series = data.observations
      .filter((o) => o.value !== "." && o.value !== "")
      .map((o) => [o.date, Number(o.value)] as [string, number])
      .filter(([, v]) => Number.isFinite(v));
    if (series.length < 2) throw new Error("empty series");
    const last = series[series.length - 1];
    const feed: Feed = {
      id: meta.id, label: meta.label, value: last[1], change: last[1] - series[series.length - 2][1], series,
      asOf: last[0], source: meta.source, status: "live",
    };
    return NextResponse.json(remember(feed));
  } catch {
    return NextResponse.json(fallback(meta.id, snapshotFeed(meta.id)));
  }
}
