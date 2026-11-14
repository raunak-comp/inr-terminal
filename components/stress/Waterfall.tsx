"use client";
import { useMemo } from "react";
import { useModel } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { signed, signedUsdB } from "@/lib/format";
import { EChart, axisBase, tooltipBase, type EOption } from "@/components/charts/EChart";
import { COLORS } from "@/components/charts/theme";
import { Panel } from "@/components/ui/Panel";
import { ArrowRight } from "lucide-react";
import { BASELINE as B } from "@/lib/model/coefficients";

export function Waterfall({ className = "a-wf" }: { className?: string } = {}) {
  const o = useModel();
  const h = useStore((s) => s.scenario.horizon);
  const curbs = useStore((s) => s.scenario.curbs);
  const steps = useMemo(
    () => [
      { l: "Oil", v: o.totals.oil },
      { l: "FPI", v: o.totals.fpi },
      { l: "Fed", v: o.totals.fed },
      { l: "Repo", v: o.totals.repo },
      { l: o.totals.rbi >= 0 ? "RBI sells" : "RBI buys", v: o.totals.rbi },
    ],
    [o]
  );
  const option = useMemo<EOption>(() => {
    let run = 0;
    const base: number[] = [];
    const vals: { value: number; itemStyle: { color: string } }[] = [];
    steps.forEach((s) => {
      const start = run;
      run += s.v;
      base.push(Math.min(start, run));
      vals.push({ value: Math.abs(s.v), itemStyle: { color: s.v >= 0 ? COLORS.pos : COLORS.neg } });
    });
    const total = o.totals.unabsorbed;
    base.push(Math.min(0, total));
    vals.push({ value: Math.abs(total), itemStyle: { color: total >= 0 ? COLORS.text2 : COLORS.neg } });
    const labels = [...steps.map((s) => s.v), total];
    const cats = [...steps.map((s) => s.l), "Gap"];
    return {
      grid: { left: 44, right: 12, top: 22, bottom: 22 },
      tooltip: { ...tooltipBase, trigger: "axis", axisPointer: { type: "shadow", shadowStyle: { color: "rgba(255,255,255,0.03)" } }, formatter: (ps: { dataIndex: number }[]) => `${cats[ps[0].dataIndex]}: <b style="color:${COLORS.text};font-weight:500">${signedUsdB(labels[ps[0].dataIndex])}</b>` },
      xAxis: { type: "category", data: cats, ...axisBase, axisLabel: { ...axisBase.axisLabel, interval: 0 } },
      yAxis: { type: "value", ...axisBase, axisLine: { show: false }, axisLabel: { ...axisBase.axisLabel, formatter: (v: number) => `${v}` }, name: "$B", nameTextStyle: { color: COLORS.text3, fontSize: 10, align: "right" } },
      series: [
        { type: "bar", stack: "w", stackStrategy: "all", data: base, itemStyle: { color: "transparent" }, silent: true, barWidth: "46%" },
        {
          type: "bar",
          stack: "w",
          stackStrategy: "all",
          data: vals,
          barWidth: "46%",
          label: { show: true, position: "top", color: COLORS.text2, fontSize: 10, formatter: (p: { dataIndex: number }) => signedUsdB(labels[p.dataIndex]) },
        },
      ],
    };
  }, [steps, o.totals.unabsorbed]);

  const weaker = o.dINR > 0;
  return (
    <Panel className={className} letter="g" title={<>Transmission · {h === 1 ? "1 quarter" : "4 quarters"}</>} model source="Team model: flows → rupee → CPI" stamp="$B over horizon">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-stretch">
        <EChart option={option} height={196} />
        <div className="flex flex-col justify-center gap-2 w-[138px]">
          <ArrowRight size={14} strokeWidth={1.5} className="text-text-3" />
          <div className="border border-border rounded-sm p-2.5">
            <div className="text-10 text-text-3 tracking-[0.06em]">RUPEE MOVE</div>
            <div className={`mono text-20 ${weaker ? "c-neg" : o.dINR < 0 ? "c-pos" : "text-text"}`}>{signed(o.dINR)}%</div>
            <div className="text-11 text-text-3">{weaker ? "Weaker" : o.dINR < 0 ? "Stronger" : "Flat"}{curbs ? " · curbs damp move" : ""}</div>
          </div>
          <div className="border border-border rounded-sm p-2.5">
            <div className="text-10 text-text-3 tracking-[0.06em]">CPI IMPACT</div>
            <div className={`mono text-20 ${o.cpi - B.CPI0 > 0.005 ? "c-neg" : o.cpi - B.CPI0 < -0.005 ? "c-pos" : "text-text"}`}>{signed(o.cpi - B.CPI0)} pp</div>
            <div className="text-11 text-text-3">Pass-through + fuel + food</div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
