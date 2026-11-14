import { describe, expect, it } from "vitest";
import { BASELINE, DEFAULT_COEFFICIENTS as C } from "./coefficients";
import { DEFAULT_SCENARIO, runModel } from "./model";
import { presetById, PRESETS } from "./presets";
import { simulate } from "./montecarlo";

describe("stress model", () => {
  it("base preset reproduces the deck baseline", () => {
    const o = runModel(presetById("base")!.scenario, C);
    expect(o.usdinr).toBeCloseTo(BASELINE.USDINR0, 6);
    expect(o.cpi).toBeCloseTo(BASELINE.CPI0, 6);
    expect(o.cad).toBeCloseTo(BASELINE.CAD0, 6);
    expect(o.reserves).toBeCloseTo(BASELINE.RES0, 6);
    expect(o.liquidity).toBeCloseTo(BASELINE.LIQ0, 6);
    expect(o.fwdPremium).toBeCloseTo(7.62, 6);
    expect(o.repo).toBeCloseTo(5.5, 6);
  });

  it("Brent $130 widens the CAD to about 2.45% of GDP", () => {
    const o = runModel({ ...DEFAULT_SCENARIO, brent: 130 }, C);
    expect(o.cad).toBeCloseTo(2.448, 2);
  });

  it("RBI sales of $20B drain about ₹1.88L Cr", () => {
    const o = runModel({ ...DEFAULT_SCENARIO, rbi: 20 }, C);
    expect(BASELINE.LIQ0 - o.liquidity).toBeCloseTo(1.88, 6);
  });

  it("RBI dollar purchases rebuild reserves and add liquidity", () => {
    const o = runModel({ ...DEFAULT_SCENARIO, rbi: -5 }, C);
    expect(o.reserves).toBeCloseTo(739.6, 6);
    expect(o.liquidity).toBeGreaterThan(BASELINE.LIQ0);
  });

  it("curbs damp the rupee move by 20%", () => {
    const on = runModel({ ...DEFAULT_SCENARIO, fpi: -10, curbs: true }, C);
    const off = runModel({ ...DEFAULT_SCENARIO, fpi: -10, curbs: false }, C);
    expect(on.dQuarter).toBeCloseTo(off.dQuarter * 0.8, 9);
  });

  it("call rate stays inside the corridor (+10 bps tolerance)", () => {
    for (const p of PRESETS) {
      const o = runModel(p.scenario, C);
      expect(o.callRate).toBeGreaterThanOrEqual(o.sdf - 1e-9);
      expect(o.callRate).toBeLessThanOrEqual(o.msf + 0.1 + 1e-9);
    }
  });

  it("crisis meter is bounded 0–100 for every preset", () => {
    for (const p of PRESETS) {
      const o = runModel(p.scenario, C);
      expect(o.crisis).toBeGreaterThanOrEqual(0);
      expect(o.crisis).toBeLessThanOrEqual(100);
    }
  });
});

describe("monte carlo", () => {
  it("is deterministic and ordered", () => {
    const a = simulate({ start: 93.8, end: 95, weeks: 13, volAnnual: 6, paths: 500 });
    const b = simulate({ start: 93.8, end: 95, weeks: 13, volAnnual: 6, paths: 500 });
    expect(a.p50).toEqual(b.p50);
    const w = 13;
    expect(a.p10[w]).toBeLessThan(a.p50[w]);
    expect(a.p50[w]).toBeLessThan(a.p90[w]);
    expect(a.pCross).toBeGreaterThanOrEqual(0);
  });
});
