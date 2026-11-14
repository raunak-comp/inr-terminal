import { DEFAULT_SCENARIO, type Scenario } from "./model";

export type PresetId = "base" | "oil130" | "fed25" | "book200" | "stagflation" | "defend90" | "plan";

export type Preset = { id: PresetId; label: string; short: string; note: string; tone?: "warn" | "ours"; scenario: Scenario };

const p = (over: Partial<Scenario>): Scenario => ({ ...DEFAULT_SCENARIO, ...over });

// Scenario assumptions are team inputs to the model (per-quarter flows).
export const PRESETS: Preset[] = [
  { id: "base", label: "Base · 10 Nov 2026", short: "BASE", note: "Deck baseline: Brent $113.2, no new shocks, curbs ON, $103B forward book", scenario: p({}) },
  { id: "oil130", label: "Oil shock returns", short: "OIL130", note: "Brent $130, FPI −$8B, RBI sells $6B", scenario: p({ brent: 130, fpi: -8, rbi: 6 }) },
  { id: "fed25", label: "Fed hikes 9 Dec", short: "FED25", note: "US shock +25 bps, FPI −$10B, RBI sells $6B", scenario: p({ fed: 25, fpi: -10, rbi: 6 }) },
  { id: "book200", label: "Hidden forward book", short: "BOOK200", note: "Forward book ~$200B (Ambit), FPI −$8B, RBI sells $4B", scenario: p({ book: 200, fpi: -8, rbi: 4 }) },
  { id: "stagflation", label: "Food-led stagflation", short: "STAG", note: "Brent $120, food +0.8 pp, FPI −$4B, RBI sells $3B", scenario: p({ brent: 120, food: 0.8, fpi: -4, rbi: 3 }) },
  { id: "defend90", label: "Defend ₹90 at any cost", short: "DEFEND90", tone: "warn", note: "What NOT to do: RBI sells $40B, repo +75 bps, curbs ON, FPI −$6B", scenario: p({ rbi: 40, repo: 75, fpi: -6, curbs: true }) },
  { id: "plan", label: "Our plan (blend)", short: "PLAN", tone: "ours", note: "Brent $105, FPI +$6B, RBI buys $5B to rebuild reserves, curbs OFF", scenario: p({ brent: 105, fpi: 6, rbi: -5, curbs: false }) },
];

export const presetById = (id: string) => PRESETS.find((x) => x.id === id);
