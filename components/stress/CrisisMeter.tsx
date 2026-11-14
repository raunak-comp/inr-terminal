"use client";
import { useMemo } from "react";
import { useModel } from "@/lib/hooks";
import { num } from "@/lib/format";
import { EChart, type EOption } from "@/components/charts/EChart";
import { COLORS } from "@/components/charts/theme";
import { Panel } from "@/components/ui/Panel";

export const meterBand = (v: number) => (v >= 60 ? { label: "HIGH STRESS", cls: "trig" } : v >= 35 ? { label: "ELEVATED", cls: "watch" } : { label: "CONTAINED", cls: "ok" });

export function CrisisMeter() {
  const o = useModel();
  const band = meterBand(o.crisis);
  const option = useMemo<EOption>(
    () => ({
      series: [
        {
          type: "gauge",
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          radius: "155%",
          center: ["50%", "96%"],
          splitNumber: 4,
          axisLine: { lineStyle: { width: 10, color: [[0.35, COLORS.pos], [0.6, COLORS.warn], [1, COLORS.neg]] } },
          pointer: { length: "62%", width: 3, itemStyle: { color: COLORS.text } },
          anchor: { show: true, size: 8, itemStyle: { color: COLORS.text, borderColor: COLORS.panel, borderWidth: 2 } },
          axisTick: { show: false },
          splitLine: { length: 14, distance: -10, lineStyle: { color: COLORS.panel, width: 2 } },
          axisLabel: { distance: 16, color: COLORS.text3, fontSize: 10 },
          detail: { show: false },
          title: { show: false },
          data: [{ value: +o.crisis.toFixed(1) }],
        },
      ],
    }),
    [o.crisis]
  );
  const max = Math.max(...o.drivers.map((d) => d.weight));
  return (
    <Panel className="a-crisis" letter="e" title="Crisis meter" model source="Weighted score of 6 drivers" stamp="0–100">
      <EChart option={option} height={120} />
      <div className="flex items-center justify-center gap-3 mt-2 mb-3">
        <span className="mono text-28 leading-none text-text">{num(o.crisis, 0)}</span>
        <span className="text-11 text-text-3">/ 100</span>
        <span className={`tag ${band.cls}`}>{band.label}</span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {o.drivers.map((d) => (
          <li key={d.key} className="grid grid-cols-[96px_1fr_34px] items-center gap-2 text-11">
            <span className="text-text-2 truncate">{d.label}</span>
            <span className="relative h-[6px] bg-panel-2 rounded-xs overflow-hidden" title={`Weight ${d.weight}`}>
              <span className="absolute inset-y-0 left-0 bg-border-2" style={{ width: `${(d.weight / max) * 100}%` }} />
              <span className={`absolute inset-y-0 left-0 transition-[width] duration-150 ease-out ${d.score >= 0.75 ? "bg-neg" : d.score >= 0.4 ? "bg-warn" : "bg-text-3"}`} style={{ width: `${(d.points / max) * 100}%` }} />
            </span>
            <span className="mono text-right text-text-2">{num(d.points, 1)}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
