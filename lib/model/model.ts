import { BASELINE, type Coefficients } from "./coefficients";

export type RepoStep = 0 | 25 | 50 | 75;

export type Scenario = {
  brent: number; // $/bbl
  fed: number; // bps
  fpi: number; // $B per quarter
  rbi: number; // $B per quarter (negative = RBI buys dollars)
  repo: RepoStep; // bps
  food: number; // CPI pp
  curbs: boolean;
  book: 103 | 200; // $B forward book
  horizon: 1 | 4; // quarters
};

export const DEFAULT_SCENARIO: Scenario = {
  brent: BASELINE.BRENT0, fed: 0, fpi: 0, rbi: 0, repo: 0, food: 0, curbs: true, book: 103, horizon: 1,
};

export type Driver = { key: string; label: string; score: number; weight: number; points: number };
export type TripStatus = "OK" | "WATCH" | "TRIGGERED";
export type Trip = { key: string; name: string; reading: string; threshold: string; status: TripStatus };

export type ModelOutput = {
  oilQ: number; fedQ: number; repoQ: number; gap: number; unabsorbed: number;
  dQuarter: number; // % rupee depreciation per quarter (+ = weaker)
  dINR: number; // cumulative % over horizon
  dAnnual: number; // annualised %
  usdinr: number; cpi: number; cad: number; reserves: number; usable: number; cover: number;
  liquidity: number; repo: number; sdf: number; msf: number; callRate: number;
  ecbLossCr: number; fwdPremium: number; annualisedOutflow: number;
  crisis: number; drivers: Driver[];
  trips: Trip[];
  totals: { oil: number; fpi: number; fed: number; repo: number; rbi: number; unabsorbed: number };
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const clamp01 = (v: number) => clamp(v, 0, 1);

export function runModel(s: Scenario, c: Coefficients): ModelOutput {
  const B = BASELINE;
  const n = s.horizon;
  const dBrent10 = (s.brent - B.BRENT0) / 10;

  const oilQ = -(c.OIL_BILL_PER_10 / 4) * dBrent10;
  const fedQ = c.FED_FPI_PER_25 * (s.fed / 25);
  const repoQ = c.REPO_FPI_PER_25 * (s.repo / 25);
  const gap = s.fpi + oilQ + fedQ + repoQ;
  const unabsorbed = gap + s.rbi;

  let dQuarter = unabsorbed < 0 ? -unabsorbed * c.DEPR_PER_1B : -unabsorbed * c.APPR_PER_1B;
  if (s.curbs) dQuarter *= 1 - c.CURBS_DAMPING;

  const dINR = (Math.pow(1 + dQuarter / 100, n) - 1) * 100;
  const dAnnual = (Math.pow(1 + dQuarter / 100, 4) - 1) * 100;
  const usdinr = B.USDINR0 * (1 + dINR / 100);

  const cpi = Math.max(2, B.CPI0 + c.PASS_THROUGH * Math.max(dINR, 0) + c.FUEL_DIRECT_PER_10 * dBrent10 + s.food);
  const cad = Math.max(-0.5, B.CAD0 + c.CAD_PER_10 * dBrent10);

  const reserves = B.RES0 - s.rbi * n;
  const usable = reserves - s.book;
  const cover = usable / c.MONTHLY_IMPORTS;
  const liquidity = B.LIQ0 - c.LIQ_DRAIN_PER_1B * s.rbi * n;

  const sdf = B.SDF0 + s.repo / 100;
  const repo = B.REPO0 + s.repo / 100;
  const msf = B.MSF0 + s.repo / 100;
  const callRate = clamp(c.CALL_BASE + s.repo / 100 - c.CALL_LIQ_SENS * liquidity, sdf, msf + 0.1);

  const ecbLossCr = (B.UNHEDGED_ECB * 1e9 * (usdinr - B.USDINR0)) / 1e7;
  const fwdPremium = B.FWDPREM_NO_CURBS + (s.curbs ? B.CURBS_PREMIUM_ADD : 0) + c.FWD_PREM_PER_1PCT * Math.max(dINR, 0);
  const annualisedOutflow = -Math.min(gap, 0) * 4;

  const drivers: Driver[] = [
    { key: "pace", label: "Rupee pace", score: clamp01(Math.abs(dAnnual) / 9.5), weight: 25, points: 0 },
    { key: "cad", label: "Current account", score: clamp01(cad / 2.5), weight: 20, points: 0 },
    { key: "cover", label: "Reserve cover", score: clamp01((8 - cover) / 4), weight: 15, points: 0 },
    { key: "cpi", label: "Inflation", score: clamp01((cpi - 4) / 2), weight: 15, points: 0 },
    { key: "call", label: "Call rate stress", score: clamp01((callRate - repo) / (msf - repo)), weight: 10, points: 0 },
    { key: "flows", label: "Capital outflows", score: clamp01(annualisedOutflow / 40), weight: 15, points: 0 },
  ];
  drivers.forEach((d) => (d.points = d.score * d.weight));
  const crisis = drivers.reduce((a, d) => a + d.points, 0);

  const trips: Trip[] = [
    {
      key: "oil", name: "Oil shock", reading: `$${s.brent.toFixed(1)}`, threshold: "> $110 watch · > $120",
      status: s.brent > 120 ? "TRIGGERED" : s.brent > 110 ? "WATCH" : "OK",
    },
    { key: "fed", name: "Fed hikes 9 Dec", reading: `${s.fed > 0 ? "+" : ""}${s.fed} bps`, threshold: "≥ +25 bps", status: s.fed >= 25 ? "TRIGGERED" : "OK" },
    {
      key: "book", name: "Forward book", reading: `$${usable.toFixed(0)}B usable`, threshold: "< $450B usable",
      status: usable < 450 ? "TRIGGERED" : s.book === 200 ? "WATCH" : "OK",
    },
    {
      key: "cpi", name: "Stagflation", reading: `CPI ${cpi.toFixed(2)}%`, threshold: "≥ 5.5 watch · ≥ 6.0",
      status: cpi >= 6 ? "TRIGGERED" : cpi >= 5.5 ? "WATCH" : "OK",
    },
    {
      key: "plan", name: "Plan-failure test", reading: `CAD ${cad.toFixed(1)}% · $${annualisedOutflow.toFixed(0)}B/yr`,
      threshold: "CAD > 2.5% and > $40B/yr", status: cad > 2.5 && annualisedOutflow > 40 ? "TRIGGERED" : "OK",
    },
  ];

  return {
    oilQ, fedQ, repoQ, gap, unabsorbed, dQuarter, dINR, dAnnual, usdinr, cpi, cad, reserves, usable, cover,
    liquidity, repo, sdf, msf, callRate, ecbLossCr, fwdPremium, annualisedOutflow, crisis, drivers, trips,
    totals: { oil: oilQ * n, fpi: s.fpi * n, fed: fedQ * n, repo: repoQ * n, rbi: s.rbi * n, unabsorbed: unabsorbed * n },
  };
}
