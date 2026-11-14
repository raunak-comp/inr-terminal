"use client";
import { Command } from "cmdk";
import { CornerDownLeft, MonitorPlay, Navigation, RotateCcw, SlidersHorizontal, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PRESETS } from "@/lib/model/presets";
import { DEFAULT_SCENARIO, type RepoStep, type Scenario } from "@/lib/model/model";
import { useStore } from "@/lib/store";
import { NAV } from "./nav";
import { fireNews } from "./Wire";

const PARAMS: Record<string, { key: keyof Scenario; min: number; max: number; label: string }> = {
  BRENT: { key: "brent", min: 60, max: 160, label: "Brent $/bbl" },
  FED: { key: "fed", min: -50, max: 100, label: "Fed shock bps" },
  FPI: { key: "fpi", min: -30, max: 15, label: "Net FPI $B" },
  RBI: { key: "rbi", min: -20, max: 80, label: "RBI dollar sales $B" },
  REPO: { key: "repo", min: 0, max: 75, label: "Repo change bps" },
  FOOD: { key: "food", min: 0, max: 1.5, label: "Food shock pp" },
  BOOK: { key: "book", min: 103, max: 200, label: "Forward book $B" },
};

function parseSet(q: string): { key: keyof Scenario; value: number; label: string } | null {
  const m = q.trim().toUpperCase().match(/^SET\s+([A-Z]+)\s+(-?[\d.]+)$/);
  if (!m || !PARAMS[m[1]]) return null;
  const p = PARAMS[m[1]];
  let v = Math.min(p.max, Math.max(p.min, Number(m[2])));
  if (p.key === "repo") v = [0, 25, 50, 75].reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a), 0);
  if (p.key === "book") v = v >= 150 ? 200 : 103;
  return Number.isFinite(v) ? { key: p.key, value: v, label: p.label } : null;
}

export function CommandPalette() {
  const open = useStore((s) => s.paletteOpen);
  const setOpen = useStore((s) => s.setPalette);
  const setParam = useStore((s) => s.setParam);
  const applyPreset = useStore((s) => s.applyPreset);
  const setScenario = useStore((s) => s.setScenario);
  const setPresent = useStore((s) => s.setPresent);
  const present = useStore((s) => s.present);
  const resetCoef = useStore((s) => s.resetCoef);
  const router = useRouter();
  const [q, setQ] = useState("");
  const set = parseSet(q);

  const run = (fn: () => void) => {
    fn();
    setOpen(false);
    setQ("");
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setQ("");
      }}
      label="Command palette"
      overlayClassName="cmdk-overlay"
      contentClassName="cmdk-box"
      shouldFilter={!set}
    >
      <Command.Input value={q} onValueChange={setQ} placeholder="GO STRESS · PRESET OIL130 · SET BRENT 125 · PRESENT" />
      <Command.List>
        <Command.Empty>No matching command. Try SET BRENT 125 or PRESET PLAN.</Command.Empty>
        {set && (
          <Command.Group heading="Set parameter">
            <Command.Item value={`set ${set.key}`} onSelect={() => run(() => { setParam(set.key, set.value as never); router.push("/"); })}>
              <SlidersHorizontal size={14} strokeWidth={1.5} /> Set {set.label} to {set.value}
              <code><CornerDownLeft size={12} /></code>
            </Command.Item>
          </Command.Group>
        )}
        <Command.Group heading="Navigate">
          {NAV.map((n) => (
            <Command.Item key={n.href} value={`GO ${n.cmd} ${n.label}`} onSelect={() => run(() => router.push(n.href))}>
              <Navigation size={14} strokeWidth={1.5} /> {n.label}
              <code>GO {n.cmd}</code>
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Scenario presets">
          {PRESETS.map((p) => (
            <Command.Item key={p.id} value={`PRESET ${p.short} ${p.label}`} onSelect={() => run(() => { applyPreset(p.id); router.push(`/?preset=${p.id}`); })}>
              <Zap size={14} strokeWidth={1.5} /> {p.label}
              <code>PRESET {p.short}</code>
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Actions">
          <Command.Item value="PRESENT presentation mode" onSelect={() => run(() => { if (!present) router.push("/"); setPresent(!present); })}>
            <MonitorPlay size={14} strokeWidth={1.5} /> {present ? "Exit presentation mode" : "Presentation mode"}
            <code>PRESENT · F</code>
          </Command.Item>
          <Command.Item value="WIRE NOW fire headline news" onSelect={() => run(() => fireNews())}>
            <Zap size={14} strokeWidth={1.5} /> Fire a simulated headline
            <code>WIRE NOW</code>
          </Command.Item>
          <Command.Item value="UNDO last change" onSelect={() => run(() => useStore.getState().undo())}>
            <RotateCcw size={14} strokeWidth={1.5} /> Undo last scenario change
            <code>UNDO · Ctrl+Z</code>
          </Command.Item>
          <Command.Item value="HORIZON 4Q four quarters" onSelect={() => run(() => setParam("horizon", 4))}>
            <SlidersHorizontal size={14} strokeWidth={1.5} /> Horizon: 4 quarters
            <code>HORIZON 4Q</code>
          </Command.Item>
          <Command.Item value="HORIZON 1Q one quarter" onSelect={() => run(() => setParam("horizon", 1))}>
            <SlidersHorizontal size={14} strokeWidth={1.5} /> Horizon: 1 quarter
            <code>HORIZON 1Q</code>
          </Command.Item>
          <Command.Item value="CURBS toggle FX curbs" onSelect={() => run(() => setParam("curbs", !useStore.getState().scenario.curbs))}>
            <SlidersHorizontal size={14} strokeWidth={1.5} /> Toggle emergency FX curbs
            <code>CURBS</code>
          </Command.Item>
          <Command.Item value="RESET scenario" onSelect={() => run(() => setScenario({ ...DEFAULT_SCENARIO, repo: 0 as RepoStep }, "base"))}>
            <RotateCcw size={14} strokeWidth={1.5} /> Reset scenario to base
            <code>RESET</code>
          </Command.Item>
          <Command.Item value="RESET MODEL coefficients" onSelect={() => run(() => resetCoef())}>
            <RotateCcw size={14} strokeWidth={1.5} /> Reset all model coefficients
            <code>RESET MODEL</code>
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
