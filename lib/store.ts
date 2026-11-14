"use client";
import { create } from "zustand";
import { DEFAULT_COEFFICIENTS, type CoefKey, type Coefficients } from "./model/coefficients";
import { DEFAULT_SCENARIO, type Scenario } from "./model/model";
import { presetById, PRESETS, type PresetId } from "./model/presets";
import { snapshotFeed } from "./market/snapshot";
import type { Feed, FeedId } from "./market/types";
import type { MCOutput } from "./model/montecarlo";
import { applyDelta, type Delta } from "./model/clamp";
import type { NewsItem, Snap } from "./news";

type Telemetry = { latencyMs: number | null; lastRefresh: string | null; loading: boolean };

type State = {
  scenario: Scenario;
  preset: PresetId | "custom";
  coef: Coefficients;
  present: boolean;
  paletteOpen: boolean;
  feeds: Record<FeedId, Feed>;
  telemetry: Telemetry;
  mc: MCOutput | null;
  mcVol: number;
  setMc: (mc: MCOutput, vol: number) => void;
  history: Scenario[];
  shock: (d: Delta) => void;
  undo: () => void;
  wire: { enabled: boolean; items: NewsItem[]; toast: string | null };
  addNews: (n: NewsItem) => void;
  markApplied: (id: string, before: Snap, after: Snap) => void;
  setToast: (id: string | null) => void;
  setWire: (v: boolean) => void;
  compare: PresetId[];
  toggleCompare: (id: PresetId) => void;
  node: string;
  setNode: (id: string) => void;
  setParam: <K extends keyof Scenario>(k: K, v: Scenario[K]) => void;
  setScenario: (s: Scenario, preset?: PresetId | "custom") => void;
  applyPreset: (id: PresetId) => void;
  resetParam: (k: keyof Scenario) => void;
  setCoef: (k: CoefKey, v: number) => void;
  resetCoef: (k?: CoefKey) => void;
  setPresent: (v: boolean) => void;
  setPalette: (v: boolean) => void;
  setFeeds: (f: Partial<Record<FeedId, Feed>>, t: Partial<Telemetry>) => void;
};

const same = (a: Scenario, b: Scenario) => (Object.keys(a) as (keyof Scenario)[]).every((k) => k === "horizon" || a[k] === b[k]);
export const matchPreset = (s: Scenario): PresetId | "custom" => PRESETS.find((p) => same(p.scenario, s))?.id ?? "custom";

export const useStore = create<State>((set, get) => ({
  scenario: { ...DEFAULT_SCENARIO },
  preset: "base",
  coef: { ...DEFAULT_COEFFICIENTS },
  present: false,
  paletteOpen: false,
  feeds: { usdinr: snapshotFeed("usdinr"), brent: snapshotFeed("brent"), us10y: snapshotFeed("us10y"), usd: snapshotFeed("usd") },
  telemetry: { latencyMs: null, lastRefresh: null, loading: true },
  mc: null,
  mcVol: 6,
  setMc: (mc, vol) => set({ mc, mcVol: vol }),
  history: [],
  shock: (d) => {
    const cur = get().scenario;
    const scenario = applyDelta(cur, d);
    set({ scenario, preset: matchPreset(scenario), history: [...get().history.slice(-19), cur] });
  },
  undo: () => {
    const h = get().history;
    if (!h.length) return;
    const scenario = h[h.length - 1];
    set({ scenario, preset: matchPreset(scenario), history: h.slice(0, -1) });
  },
  wire: { enabled: true, items: [], toast: null },
  addNews: (n) => set({ wire: { ...get().wire, items: [n, ...get().wire.items].slice(0, 30), toast: n.id } }),
  markApplied: (id, before, after) =>
    set({ wire: { ...get().wire, items: get().wire.items.map((x) => (x.id === id ? { ...x, applied: true, before, after } : x)) } }),
  setToast: (id) => set({ wire: { ...get().wire, toast: id } }),
  setWire: (v) => set({ wire: { ...get().wire, enabled: v } }),
  compare: ["base", "oil130", "defend90", "plan"],
  toggleCompare: (id) => {
    const c = get().compare;
    set({ compare: c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-4) });
  },
  node: "usdinr",
  setNode: (id) => set({ node: id }),
  setParam: (k, v) => {
    const scenario = { ...get().scenario, [k]: v };
    set({ scenario, preset: matchPreset(scenario) });
  },
  setScenario: (s, preset) => set({ scenario: s, preset: preset ?? matchPreset(s) }),
  applyPreset: (id) => {
    const p = presetById(id);
    if (p) set({ scenario: { ...p.scenario, horizon: get().scenario.horizon }, preset: id, history: [...get().history.slice(-19), get().scenario] });
  },
  resetParam: (k) => get().setParam(k, DEFAULT_SCENARIO[k] as never),
  setCoef: (k, v) => set({ coef: { ...get().coef, [k]: v } }),
  resetCoef: (k) => set({ coef: k ? { ...get().coef, [k]: DEFAULT_COEFFICIENTS[k] } : { ...DEFAULT_COEFFICIENTS } }),
  setPresent: (v) => set({ present: v }),
  setPalette: (v) => set({ paletteOpen: v }),
  setFeeds: (f, t) => set({ feeds: { ...get().feeds, ...f }, telemetry: { ...get().telemetry, ...t } }),
}));
