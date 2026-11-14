"use client";
import { useMemo, useState } from "react";
import { scorecard } from "@/lib/data/deck";
import { EChart, tooltipBase, type EOption } from "@/components/charts/EChart";
import { COLORS, alpha } from "@/components/charts/theme";
import { Panel } from "@/components/ui/Panel";

const OC = ["#A3A3AD", COLORS.warn, COLORS.s2, "#D98B5F", "#4FB0B8", COLORS.brandSoft];

export function ScorecardRadar() {
  const [on, setOn] = useState<string[]>(["Big dollar sales", "Free float", "Our blend"]);
  const option = useMemo<EOption>(() => ({
    tooltip: { ...tooltipBase, trigger: "item" },
    radar: {
      indicator: scorecard.criteria.map((c) => ({ name: c, max: 3 })), radius: "64%", center: ["50%", "53%"], splitNumber: 3, shape: "polygon",
      axisName: { color: COLORS.text2, fontSize: 10 }, splitLine: { lineStyle: { color: COLORS.border } }, splitArea: { show: false }, axisLine: { lineStyle: { color: COLORS.border } },
    },
    series: [{
      type: "radar", symbol: "circle", symbolSize: 4,
      data: scorecard.options.map((o, i) => ({ o, i })).filter(({ o }) => on.includes(o.name)).map(({ o, i }) => ({
        name: `${o.name} · ${o.total}/15`, value: o.s,
        lineStyle: { color: OC[i], width: o.ours ? 2 : 1.25 }, itemStyle: { color: OC[i] }, areaStyle: { color: alpha(OC[i], o.ours ? 0.16 : 0.05) },
      })),
    }],
  }), [on]);
  return (
    <Panel className="col-span-12 xl:col-span-5" letter="d" title="Option shapes · radar" source="Team scoring, 0–3 per criterion" stamp="Toggle options below">
      <EChart option={option} height={248} />
      <div className="flex flex-wrap gap-1.5 mt-2">
        {scorecard.options.map((o, i) => {
          const a = on.includes(o.name);
          return (
            <button key={o.name} className="chip h-[24px] text-11" data-active={a} onClick={() => setOn(a ? on.filter((x) => x !== o.name) : [...on, o.name])}>
              <span className="w-2 h-2" style={{ background: a ? OC[i] : "transparent", border: `1px solid ${OC[i]}` }} />
              {o.name}
            </button>
          );
        })}
      </div>
      <p className="text-11 text-text-3 mt-2">No single tool wins on every axis. Our blend has the widest, most balanced shape.</p>
    </Panel>
  );
}
