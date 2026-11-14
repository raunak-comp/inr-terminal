import "server-only";
import type { Feed } from "./types";

// Last good response per feed, used when an upstream call fails ("cached" status).
const lastGood = new Map<string, Feed>();

export async function fetchJson<T>(url: string, revalidate = 900): Promise<T> {
  const res = await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(4000), headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${url.split("?")[0]}`);
  return (await res.json()) as T;
}

export function remember(feed: Feed) {
  lastGood.set(feed.id, feed);
  return feed;
}

export function fallback(id: string, snapshot: Feed): Feed {
  const prev = lastGood.get(id);
  return prev ? { ...prev, status: "cached" } : snapshot;
}

export const yearAgo = () => {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
};
