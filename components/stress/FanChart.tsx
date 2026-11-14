"use client";
import { useMemo } from "react";
import { BASELINE as B } from "@/lib/model/coefficients";
import { SNAPSHOT_DATE } from "@/lib/data/deck";
import { dayMonth, inr, num, pct } from "@/lib/format";
import { useModel, useMonteCarlo } from "@/lib/hooks";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { EChart, axisBase, tooltipBase, type EOption } from "@/components/charts/EChart";
import { COLORS, alpha } from "@/components/charts/theme";
import { Panel } from "@/components/ui/Panel";
import { Num } from "@/components/ui/Num";

export function FanChart() {
  const o = useModel();
  const horizon = useStore((s) => s.scenario.horizon);
  const vol = useStore((s) => s.coef.VOL_ANNUAL);
  const present = useStore((s) => s.present);
  const weeks = 13 * horizon;
  const volAnnual = vol * (o.crisis > 60 ? 1.5 : 1);
  const mc = useMonteCarlo({ start: B.USDINR0, end: o.usdinr, weeks, volAnnual });
  const setMc = useStore((s) => s.setMc);
  useEffect(() => {
    if (mc) setMc(mc, volAnnual);
  }, [mc, volAnnual, setMc]);

  const dates = useMemo(() => {
    const t0 = Date.parse(SNAPSHOT_DATE + "T00:00:00Z");
    return Array.from({ length: weeks + 1 }, (_, i) => dayMonth(new Date(t0 + i * 7 * 86400000).toISOString().slice(0, 10)));
  }, [weeks]);

  const option = useMemo<EOption>(() => {
    if (!mc) return {};
    const lo = Math.min(84, ...mc.p10) - 0.5;
    const hi = Math.max(101, ...mc.p90) + 0.5;
    const diff = (a: number[], b: number[]) => a.map((v, i) => +(v - b[i]).toFixed(4));
    const lw = present ? 2 : 1.5;
    return {
      grid: { left: 8, right: 56, top: 16, bottom: 24 },
      tooltip: {
        ...tooltipBase,
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: "#3A3A44", type: "dashed" } },
        formatter: (ps: { dataIndex: number }[]) => {
          const i = ps[0]?.dataIndex ?? 0;
          return `<div style="color:${COLORS.text}">${dates[i]}</div>
            <div>P90 <b style="color:${COLORS.text};font-weight:500">₹${num(mc.p90[i])}</b></div>
            <div>Median <b style="color:${COLORS.brandSoft};font-weight:500">₹${num(mc.p50[i])}</b></div>
            <div>P10 <b style="color:${COLORS.text};font-weight:500">₹${num(mc.p10[i])}</b></div>`;
        },
      },
      xAxis: { type: "category", data: dates, boundaryGap: false, ...axisBase, splitLine: { show: false }, axisLabel: { ...axisBase.axisLabel, interval: horizon === 1 ? 1 : 7 } },
      yAxis: { type: "value", position: "right", min: lo, max: hi, ...axisBase, axisLine: { show: false }, axisLabel: { ...axisBase.axisLabel, formatter: (v: number) => v.toFixed(0) } },
      series: [
        { type: "line", data: mc.p10, stack: "outer", lineStyle: { opacity: 0 }, symbol: "none", silent: true },
        { type: "line", data: diff(mc.p90, mc.p10), stack: "outer", lineStyle: { opacity: 0 }, symbol: "none", areaStyle: { color: alpha(COLORS.brandSoft, 0.08) }, silent: true },
        { type: "line", data: mc.p25, stack: "inner", lineStyle: { opacity: 0 }, symbol: "none", silent: true },
        { type: "line", data: diff(mc.p75, mc.p25), stack: "inner", lineStyle: { opacity: 0 }, symbol: "none", areaStyle: { color: alpha(COLORS.brandSoft, 0.14) }, silent: true },
        {
          type: "line",
          name: "Median",
          data: mc.p50,
          symbol: "none",
          lineStyle: { color: COLORS.brandSoft, width: lw },
          markLine: {
            silent: true,
            symbol: "none",
            data: [
              { yAxis: 100, lineStyle: { color: COLORS.neg, type: [4, 4], width: 1 }, label: { formatter: "₹100 — psychological, not a cliff", position: "insideEndTop", color: COLORS.neg, fontSize: 11 } },
              { yAxis: B.USDINR0, lineStyle: { color: COLORS.text3, type: [2, 3], width: 1 }, label: { formatter: `Today ₹${num(B.USDINR0)}`, position: "insideStartTop", color: COLORS.text3, fontSize: 11 } },
            ],
          },
          markArea: {
            silent: true,
            itemStyle: { color: alpha(COLORS.brand, 0.22) },
            label: { color: COLORS.brandSoft, fontSize: 11, position: "insideLeft" },
            data: [[{ yAxis: 85, name: "Ideal zone ₹85–88" }, { yAxis: 88 }]],
          },
        },
        {
          type: "scatter",
          data: [[weeks, mc.p50[weeks]]],
          symbolSize: 6,
          itemStyle: { color: COLORS.brandSoft, borderColor: COLORS.bg, borderWidth: 2 },
          label: { show: true, position: "left", formatter: () => `₹${num(mc.p50[weeks])}`, color: COLORS.text, fontSize: 11, backgroundColor: COLORS.panel2, padding: [2, 4], borderColor: COLORS.border2, borderWidth: 1 },
          silent: true,
        },
      ],
    };
  }, [mc, dates, horizon, weeks, present]);

  return (
    <Panel
      className="a-fan"
      letter="d"
      title={<>USD/INR fan · {weeks} wks</>}
      model
      right={
        <div className="flex items-center gap-4 text-11">
          <span className="text-text-3">
            P(cross ₹100){" "}
            <b className={`mono font-medium ${mc && mc.pCross > 0.25 ? "c-neg" : "text-text"}`}>{mc ? <Num value={mc.pCross * 100} format={(v) => pct(v, 1)} /> : "—"}</b>
          </span>
          <span className="text-text-3 hide-sm">
            Median end <b className="mono font-medium text-text">{mc ? inr(mc.medianEnd) : "—"}</b>
          </span>
        </div>
      }
      source={`Monte Carlo, 2,000 paths, ${num(volAnnual, 1)}% annual vol, drift to model end value`}
      stamp="P10–P90 · P25–P75"
    >
      {mc ? <EChart option={option} height={present ? 400 : 340} /> : <div className="skeleton" style={{ height: present ? 400 : 340 }} />}
    </Panel>
  );
}
