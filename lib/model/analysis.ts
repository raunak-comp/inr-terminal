import { runModel, type ModelOutput, type Scenario } from "./model";
import type { Coefficients } from "./coefficients";
import { RANGES } from "./clamp";

export type MetricKey = "usdinr" | "cpi" | "crisis" | "reserves" | "cover" | "callRate";
export const METRICS: Record<MetricKey, { label: string; unit: string; d: number; upBad: boolean }> = {
  usdinr: { label: "USD/INR", unit: "₹", d: 2, upBad: true },
  cpi: { label: "CPI inflation", unit: "%", d: 2, upBad: true },
  crisis: { label: "Crisis meter", unit: "", d: 0, upBad: true },
  reserves: { label: "FX reserves", unit: "$B", d: 1, upBad: false },
  cover: { label: "Import cover", unit: "mo", d: 2, upBad: false },
  callRate: { label: "Call rate", unit: "%", d: 2, upBad: true },
};

export type Lever = "brent" | "fed" | "fpi" | "rbi" | "food" | "repo";
export const LEVER_LABEL: Record<Lever, string> = {
  brent: "Brent crude", fed: "Fed shock", fpi: "FPI flow", rbi: "RBI dollar sales", food: "Food shock", repo: "Repo hike",
};

/** Tornado: swing each lever across a realistic band around the current scenario. */
export function tornado(s: Scenario, c: Coefficients, m: MetricKey) {
  const base = runModel(s, c)[m];
  const bands: Record<Lever, [Partial<Scenario>, Partial<Scenario>, string, string]> = {
    brent: [{ brent: Math.max(RANGES.brent[0], s.brent - 20) }, { brent: Math.min(RANGES.brent[1], s.brent + 20) }, "−$20", "+$20"],
    fed: [{ fed: Math.max(RANGES.fed[0], s.fed - 25) }, { fed: Math.min(RANGES.fed[1], s.fed + 50) }, "−25 bps", "+50 bps"],
    fpi: [{ fpi: Math.min(RANGES.fpi[1], s.fpi + 8) }, { fpi: Math.max(RANGES.fpi[0], s.fpi - 8) }, "+$8B in", "−$8B out"],
    rbi: [{ rbi: Math.min(RANGES.rbi[1], s.rbi + 15) }, { rbi: Math.max(RANGES.rbi[0], s.rbi - 15) }, "sells +$15B", "buys $15B"],
    food: [{ food: Math.max(0, s.food - 0.5) }, { food: Math.min(1.5, s.food + 0.5) }, "−0.5 pp", "+0.5 pp"],
    repo: [{ repo: 0 }, { repo: 75 }, "0 bps", "+75 bps"],
  };
  return (Object.keys(bands) as Lever[])
    .map((k) => {
      const [lo, hi, ll, hl] = bands[k];
      const a = runModel({ ...s, ...lo } as Scenario, c)[m] - base;
      const b = runModel({ ...s, ...hi } as Scenario, c)[m] - base;
      return { k, label: LEVER_LABEL[k], lo: a, hi: b, loL: ll, hiL: hl, span: Math.abs(b - a) };
    })
    .sort((x, y) => x.span - y.span);
}

export const HEAT_BRENT = [70, 80, 90, 100, 110, 120, 130, 140, 150, 160];
export const HEAT_FPI = [-30, -25, -20, -15, -10, -5, 0, 5, 10, 15];
export function heatGrid(s: Scenario, c: Coefficients, m: MetricKey) {
  const out: [number, number, number][] = [];
  HEAT_BRENT.forEach((b, i) => HEAT_FPI.forEach((f, j) => out.push([i, j, +runModel({ ...s, brent: b, fpi: f }, c)[m].toFixed(METRICS[m].d)])));
  return out;
}

/** Deterministic quarter-by-quarter path (0..4). */
export function path(s: Scenario, c: Coefficients, m: MetricKey = "usdinr") {
  const p0 = runModel({ ...s, horizon: 1, rbi: 0, fpi: 0, fed: 0, repo: 0, food: 0, brent: 113.2 }, c);
  const q1 = runModel({ ...s, horizon: 1 }, c);
  const q4 = runModel({ ...s, horizon: 4 }, c);
  // compound per-quarter rupee move; other metrics interpolate between 1Q and 4Q runs
  if (m === "usdinr") return [0, 1, 2, 3, 4].map((q) => +(93.8 * Math.pow(1 + q1.dQuarter / 100, q)).toFixed(2));
  return [p0[m], q1[m], q1[m] + ((q4[m] - q1[m]) * 1) / 3, q1[m] + ((q4[m] - q1[m]) * 2) / 3, q4[m]];
}

/** Terminal-value histogram via the same GBM as the fan chart. */
export function terminalHistogram(start: number, end: number, weeks: number, volAnnual: number, paths = 4000, seed = 7) {
  let a = seed;
  const rnd = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const drift = Math.log(end / start) / weeks;
  const sig = volAnnual / 100 / Math.sqrt(52);
  const ends = new Float64Array(paths);
  for (let i = 0; i < paths; i++) {
    let x = start;
    for (let w = 0; w < weeks; w++) {
      const z = Math.sqrt(-2 * Math.log(Math.max(rnd(), 1e-12))) * Math.cos(2 * Math.PI * rnd());
      x *= Math.exp(drift - 0.5 * sig * sig + sig * z);
    }
    ends[i] = x;
  }
  ends.sort();
  const lo = Math.floor(ends[Math.floor(paths * 0.002)]);
  const hi = Math.ceil(ends[Math.floor(paths * 0.998)]);
  const w = Math.max(0.25, Math.round(((hi - lo) / 28) * 4) / 4);
  const bins: { x: number; n: number }[] = [];
  for (let x = lo; x < hi; x += w) bins.push({ x, n: 0 });
  ends.forEach((v) => {
    const k = Math.min(bins.length - 1, Math.max(0, Math.floor((v - lo) / w)));
    bins[k].n++;
  });
  const above100 = ends.filter((v) => v >= 100).length / paths;
  return { bins, w, above100, p5: ends[Math.floor(paths * 0.05)], p50: ends[Math.floor(paths * 0.5)], p95: ends[Math.floor(paths * 0.95)] };
}

/** Sankey of the dollar gap: sources of dollars on the left, uses on the right. */
export function sankeyFlows(o: ModelOutput) {
  const t = o.totals;
  const items: [string, number][] = [
    ["FPI flow", t.fpi], ["Oil bill", t.oil], ["Fed-driven flows", t.fed], ["Repo-driven flows", t.repo], ["RBI dollar ops", t.rbi],
  ];
  const ins: [string, number][] = [];
  const outs: [string, number][] = [];
  items.forEach(([k, v]) => {
    if (v > 0.05) ins.push([k, v]);
    else if (v < -0.05) outs.push([k, -v]);
  });
  if (o.totals.unabsorbed < -0.05) ins.push(["Rupee weakens to clear", -o.totals.unabsorbed]);
  if (o.totals.unabsorbed > 0.05) outs.push(["Rupee strengthens to clear", o.totals.unabsorbed]);
  return { ins, outs };
}
