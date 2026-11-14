"use client";
import { presetById } from "@/lib/model/presets";
import { useStore } from "@/lib/store";
import { useModel } from "@/lib/hooks";
import { meterBand } from "./CrisisMeter";

export function ScenarioBadge() {
  const preset = useStore((s) => s.preset);
  const h = useStore((s) => s.scenario.horizon);
  const o = useModel();
  const b = meterBand(o.crisis);
  return (
    <div className="flex items-center gap-2">
      <span className="text-11 text-text-3 hide-sm">{preset === "custom" ? "Custom scenario" : presetById(preset)!.label} · {h === 1 ? "1Q" : "4Q"}</span>
      <span className={`tag ${b.cls}`}>{b.label}</span>
    </div>
  );
}
