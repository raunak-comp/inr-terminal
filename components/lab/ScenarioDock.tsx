"use client";
import { RotateCcw } from "lucide-react";
import { PRESETS } from "@/lib/model/presets";
import { useStore } from "@/lib/store";
import { Levers } from "@/components/stress/ScenarioInputs";
import { Segmented } from "@/components/ui/Controls";
import { useModel } from "@/lib/hooks";
import { inr, num } from "@/lib/format";

/** Compact, page-level scenario controls so every lab screen is playable. */
export function ScenarioDock({ levers = true }: { levers?: boolean }) {
  const preset = useStore((s) => s.preset);
  const applyPreset = useStore((s) => s.applyPreset);
  const h = useStore((s) => s.scenario.horizon);
  const setParam = useStore((s) => s.setParam);
  const o = useModel();
  return (
    <section className="panel col-span-12">
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-border">
        <span className="mono text-10 tracking-[0.1em] text-text-3 mr-1">SCENARIO</span>
        {PRESETS.map((p) => (
          <button key={p.id} className="chip" data-active={preset === p.id} onClick={() => applyPreset(p.id)}>
            {p.tone === "ours" && <span className="w-1.5 h-1.5 bg-brand" />}
            {p.tone === "warn" && <span className="w-1.5 h-1.5 bg-warn" />}
            {p.label.replace(" · 10 Nov 2026", "")}
          </button>
        ))}
        {preset === "custom" && <span className="chip" data-active="true">Custom</span>}
        <div className="ml-auto flex items-center gap-3">
          <span className="mono text-12 text-text-2 hide-sm">
            USD/INR <span className="text-text">{inr(o.usdinr)}</span> · CPI <span className="text-text">{num(o.cpi)}%</span> · Crisis <span className="text-text">{num(o.crisis, 0)}</span>
          </span>
          <div className="w-[150px]">
            <Segmented<1 | 4> label="Horizon" value={h} onChange={(v) => setParam("horizon", v)} options={[{ v: 1, l: "1Q" }, { v: 4, l: "4Q" }]} />
          </div>
          <button className="btn h-[26px] px-2" onClick={() => applyPreset("base")} aria-label="Reset to base"><RotateCcw size={12} /></button>
        </div>
      </div>
      {levers && <Levers compact />}
    </section>
  );
}
