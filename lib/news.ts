// Simulated news wire. Headlines are auto-generated from templates and are
// clearly labelled SIMULATED in the UI. They are not real news.
import type { Delta } from "./model/clamp";

export type Severity = "HIGH" | "MEDIUM" | "LOW";
export type Snap = { usdinr: number; cpi: number; crisis: number; reserves: number; cad: number; liquidity: number };
export type NewsItem = {
  id: string; ts: number; category: string; headline: string; body: string; severity: Severity;
  delta: Delta; effect: string; tone: "bad" | "good";
  applied?: boolean; before?: Snap; after?: Snap;
};

type T = (r: () => number) => Omit<NewsItem, "id" | "ts">;
const pick = (r: () => number, lo: number, hi: number, step = 1) => Math.round((lo + r() * (hi - lo)) / step) * step;

const TEMPLATES: T[] = [
  (r) => { const x = pick(r, 5, 12); return { category: "OIL", headline: `Brent jumps $${x} as tanker traffic thins near Hormuz`, body: "Insurers widen war-risk premiums; Asian refiners scramble for spot cargoes.", severity: x >= 9 ? "HIGH" : "MEDIUM", delta: { brent: x }, effect: `Brent +$${x}`, tone: "bad" }; },
  (r) => { const x = pick(r, 4, 10); return { category: "OIL", headline: `Brent slides $${x} after OPEC+ signals higher output`, body: "Saudi-led group hints at faster unwinding of cuts from next month.", severity: "MEDIUM", delta: { brent: -x }, effect: `Brent −$${x}`, tone: "good" }; },
  () => ({ category: "FED", headline: "Fed minutes lean hawkish; US 10-year yield climbs", body: "Several officials see room for one more hike before year-end.", severity: "HIGH", delta: { fed: 25 }, effect: "US shock +25 bps", tone: "bad" }),
  () => ({ category: "FED", headline: "Soft US jobs data cuts odds of a December Fed hike", body: "Payroll growth misses estimates; Treasury yields fall across the curve.", severity: "MEDIUM", delta: { fed: -25 }, effect: "US shock −25 bps", tone: "good" }),
  (r) => { const x = pick(r, 2, 6, 0.5); return { category: "FPI", headline: `Foreign funds pull $${x}B from Indian equities in a week`, body: "Selling concentrated in financials and IT; foreign stake hits fresh low.", severity: x >= 4 ? "HIGH" : "MEDIUM", delta: { fpi: -x }, effect: `FPI −$${x}B`, tone: "bad" }; },
  (r) => { const x = pick(r, 2, 5, 0.5); return { category: "FPI", headline: `Bond index bets bring $${x}B of foreign inflows`, body: "Global funds add Indian government bonds ahead of index rebalancing.", severity: "MEDIUM", delta: { fpi: x }, effect: `FPI +$${x}B`, tone: "good" }; },
  (r) => { const x = pick(r, 3, 8); return { category: "RBI", headline: `RBI seen selling dollars near ₹95 to calm the market`, body: `Dealers estimate state-run banks sold about $${x}B on the central bank's behalf.`, severity: "MEDIUM", delta: { rbi: x }, effect: `RBI sells $${x}B`, tone: "bad" }; },
  (r) => { const x = pick(r, 2, 5); return { category: "RBI", headline: `RBI quietly buys $${x}B to rebuild reserves`, body: "Purchases absorb exporter dollar supply as the rupee steadies.", severity: "LOW", delta: { rbi: -x }, effect: `RBI buys $${x}B`, tone: "good" }; },
  () => ({ category: "FOOD", headline: "Unseasonal rain lifts vegetable prices; food CPI seen higher", body: "Tomato and onion prices up sharply in key mandis.", severity: "MEDIUM", delta: { food: 0.3 }, effect: "Food CPI +0.3 pp", tone: "bad" }),
  () => ({ category: "RBI", headline: "RBI eases emergency FX curbs on a published timetable", body: "The $5M limit is raised and NDF restrictions will be phased out.", severity: "MEDIUM", delta: { curbs: false }, effect: "FX curbs OFF", tone: "good" }),
  () => ({ category: "RBI", headline: "Report: RBI's forward dollar book may be near $200B", body: "Brokerage estimate is far above the published figure, shrinking usable reserves.", severity: "HIGH", delta: { book: 200 }, effect: "Forward book ~$200B", tone: "bad" }),
  () => ({ category: "MPC", headline: "MPC member flags upside inflation risk; hike odds rise", body: "Markets price a 25 bps repo hike at the December meeting.", severity: "MEDIUM", delta: { repo: 25 }, effect: "Repo +25 bps", tone: "bad" }),
];

let n = 0;
export function makeNews(seed = Math.random): NewsItem {
  const t = TEMPLATES[Math.floor(seed() * TEMPLATES.length)];
  n += 1;
  return { id: `w${Date.now()}-${n}`, ts: Date.now(), ...t(seed) };
}
