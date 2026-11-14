export type MCInput = { start: number; end: number; weeks: number; volAnnual: number; paths: number; seed?: number };
export type MCOutput = { p10: number[]; p25: number[]; p50: number[]; p75: number[]; p90: number[]; pCross: number; medianEnd: number };

// Deterministic PRNG so the fan does not flicker between identical runs.
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulate({ start, end, weeks, volAnnual, paths, seed = 20261110 }: MCInput): MCOutput {
  const rnd = mulberry32(seed);
  const drift = Math.log(end / start) / weeks;
  const sigma = volAnnual / 100 / Math.sqrt(52);
  const cols: Float64Array[] = Array.from({ length: weeks + 1 }, () => new Float64Array(paths));
  let crossed = 0;
  for (let i = 0; i < paths; i++) {
    let x = start;
    let max = start;
    cols[0][i] = start;
    for (let w = 1; w <= weeks; w++) {
      // Box–Muller
      const u1 = Math.max(rnd(), 1e-12);
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * rnd());
      x = x * Math.exp(drift - 0.5 * sigma * sigma + sigma * z);
      cols[w][i] = x;
      if (x > max) max = x;
    }
    if (max >= 100) crossed++;
  }
  const q = (arr: Float64Array, p: number) => arr[Math.min(arr.length - 1, Math.floor(p * (arr.length - 1)))];
  const out: MCOutput = { p10: [], p25: [], p50: [], p75: [], p90: [], pCross: crossed / paths, medianEnd: 0 };
  for (const c of cols) {
    c.sort();
    out.p10.push(q(c, 0.1)); out.p25.push(q(c, 0.25)); out.p50.push(q(c, 0.5)); out.p75.push(q(c, 0.75)); out.p90.push(q(c, 0.9));
  }
  out.medianEnd = out.p50[out.p50.length - 1];
  return out;
}
