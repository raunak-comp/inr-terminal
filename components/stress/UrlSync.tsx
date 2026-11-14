"use client";
import { useEffect, useRef } from "react";
import { DEFAULT_SCENARIO, type RepoStep, type Scenario } from "@/lib/model/model";
import { presetById, type PresetId } from "@/lib/model/presets";
import { useStore } from "@/lib/store";

const KEYS: (keyof Scenario)[] = ["brent", "fed", "fpi", "rbi", "repo", "food", "curbs", "book", "horizon"];
const SHORT: Partial<Record<keyof Scenario, string>> = { horizon: "h" };

function parse(qs: URLSearchParams, current: Scenario): { s: Scenario; preset?: PresetId } | null {
  const pid = qs.get("preset");
  const p = pid ? presetById(pid) : undefined;
  const has = KEYS.some((k) => qs.has(SHORT[k] ?? k));
  if (!p && !has) return null;
  const s: Scenario = { ...(p ? p.scenario : DEFAULT_SCENARIO), horizon: current.horizon };
  for (const k of KEYS) {
    const raw = qs.get(SHORT[k] ?? k);
    if (raw === null) continue;
    if (k === "curbs") s.curbs = raw === "1" || raw === "on" || raw === "true";
    else if (k === "repo") s.repo = ([0, 25, 50, 75].includes(Number(raw)) ? Number(raw) : 0) as RepoStep;
    else if (k === "book") s.book = Number(raw) >= 150 ? 200 : 103;
    else if (k === "horizon") s.horizon = raw === "4" ? 4 : 1;
    else if (Number.isFinite(Number(raw))) (s[k] as number) = Number(raw);
  }
  return { s, preset: p?.id };
}

function serialise(s: Scenario, preset: string): string {
  const qs = new URLSearchParams();
  const ref = preset !== "custom" ? presetById(preset)!.scenario : DEFAULT_SCENARIO;
  if (preset !== "custom") qs.set("preset", preset);
  for (const k of KEYS) {
    if (k === "horizon") continue;
    if (s[k] !== ref[k]) qs.set(k, k === "curbs" ? (s.curbs ? "1" : "0") : String(s[k]));
  }
  if (s.horizon === 4) qs.set("h", "4");
  const str = qs.toString();
  return str ? `?${str}` : "";
}

/** Two-way sync between the scenario store and the URL query string. */
export function UrlSync() {
  const ready = useRef(false);
  useEffect(() => {
    const st = useStore.getState();
    const parsed = parse(new URLSearchParams(window.location.search), st.scenario);
    if (parsed) st.setScenario(parsed.s);
    ready.current = true;
    const write = () => {
      const { scenario, preset } = useStore.getState();
      const next = serialise(scenario, preset);
      if (next !== window.location.search) window.history.replaceState(window.history.state, "", `${window.location.pathname}${next}`);
    };
    write();
    return useStore.subscribe((a, b) => {
      if (a.scenario !== b.scenario || a.preset !== b.preset) write();
    });
  }, []);
  return null;
}
