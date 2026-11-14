import type { RepoStep, Scenario } from "./model";

export const RANGES = {
  brent: [60, 160], fed: [-50, 100], fpi: [-30, 15], rbi: [-20, 80], food: [0, 1.5],
} as const;

const c = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

export function clampScenario(s: Scenario): Scenario {
  const repo = [0, 25, 50, 75].reduce((a, b) => (Math.abs(b - s.repo) < Math.abs(a - s.repo) ? b : a), 0) as RepoStep;
  return {
    ...s,
    brent: r1(c(s.brent, RANGES.brent)), fed: Math.round(c(s.fed, RANGES.fed)), fpi: r1(c(s.fpi, RANGES.fpi)),
    rbi: Math.round(c(s.rbi, RANGES.rbi)), food: r1(c(s.food, RANGES.food)), repo,
  };
}

export type Delta = Partial<Pick<Scenario, "brent" | "fed" | "fpi" | "rbi" | "repo" | "food">> & { curbs?: boolean; book?: 103 | 200 };

/** Numeric fields are added; curbs and book are set. */
export function applyDelta(s: Scenario, d: Delta): Scenario {
  const n = { ...s };
  (["brent", "fed", "fpi", "rbi", "repo", "food"] as const).forEach((k) => {
    if (d[k] !== undefined) (n[k] as number) = (s[k] as number) + (d[k] as number);
  });
  if (d.curbs !== undefined) n.curbs = d.curbs;
  if (d.book !== undefined) n.book = d.book;
  return clampScenario(n);
}
