"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Play } from "lucide-react";
import { runModel, type ModelOutput } from "@/lib/model/model";
import { PRESETS, presetById, type PresetId } from "@/lib/model/presets";
import { METRICS, path, terminalHistogram, type MetricKey } from "@/lib/model/analysis";
import { useModel } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { inr, num, pct, signed } from "@/lib/format";
import { EChart, axisBase, tooltipBase, type EOption } from "@/components/charts/EChart";
import { COLORS, alpha } from "@/components/charts/theme";
import { Panel } from "@/components/ui/Panel";
import { Tabs } from "@/components/ui/Controls";

export const PCOL: Record<PresetId, string> = {
  base: "#A3A3AD", oil130: COLORS.warn, fed25: COLORS.s2, book200: "#4FB0B8", stagflation: "#D98B5F", defend90: COLORS.neg, plan: COLORS.pos,
};
const short = (id: PresetId) => presetById(id)!.label.replace(" · 10 Nov 2026", "");

function useRuns(h: 1 | 4) {
  const coef = useStore((s) => s.coef);
  return useMemo(() => Object.fromEntries(PRESETS.map((p) => [p.id, runModel({ ...p.scenario, horizon: h }, coef)])) as Record<PresetId, ModelOutput>, [coef, h]);
}

export function ComparePicker() {
  const compare = useStore((s) => s.compare);
  const toggle = useStore((s) => s.toggleCompare);
  const h = useStore((s) => s.scenario.horizon);
  const setParam = useStore((s) => s.setParam);
  return (
    <section className="panel col-span-12">
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2">
        <span className="mono text-10 tracking-[0.1em] text-text-3 mr-1">COMPARE UP TO 4</span>
        {PRESETS.map((p) => {
          const on = compare.includes(p.id);
          return (
            <button key={p.id} className="chip" data-active={on} onClick={() => toggle(p.id)} aria-pressed={on}>
              <span className="w-2 h-2" style={{ background: on ? PCOL[p.id] : "transparent", border: `1px solid ${PCOL[p.id]}` }} />
              {short(p.id)}
              {on && <Check size={11} />}
            </button>
          );
        })}
        <span className="flex items-center gap-1.5 text-11 text-text-3 ml-2"><span className="w-4 border-t border-dashed border-text" />Your current scenario</span>
        <div className="ml-auto flex items-center gap-2 text-11 text-text-3">
          Horizon
          <Tabs options={["1Q", "4Q"]} value={h === 1 ? "1Q" : "4Q"} onChange={(v) => setParam("horizon", v === "1Q" ? 1 : 4)} />
        </div>
      </div>
    </section>
  );
}

export function DriverRadar() {
  const compare = useStore((s) => s.compare);
  const h = useStore((s) => s.scenario.horizon);
  const runs = useRuns(h);
  const cur = useModel();
  const option = useMemo<EOption>(() => {
    const ind = cur.drivers.map((d) => ({ name: d.label, max: 100 }));
    return {
      tooltip: { ...tooltipBase, trigger: "item" },
      radar: {
        indicator: ind, radius: "66%", center: ["50%", "54%"], splitNumber: 4, shape: "polygon",
        axisName: { color: COLORS.text2, fontSize: 10 },
        splitLine: { lineStyle: { color: COLORS.border } }, splitArea: { show: false }, axisLine: { lineStyle: { color: COLORS.border } },
      },
      series: [
        {
          type: "radar", symbol: "circle", symbolSize: 4,
          data: [
            ...compare.map((id) => ({ name: short(id), value: runs[id].drivers.map((d) => +(d.score * 100).toFixed(0)), lineStyle: { color: PCOL[id], width: 1.5 }, itemStyle: { color: PCOL[id] }, areaStyle: { color: alpha(PCOL[id], 0.07) } })),
            { name: "Current scenario", value: cur.drivers.map((d) => +(d.score * 100).toFixed(0)), lineStyle: { color: COLORS.text, width: 1.5, type: "dashed" }, itemStyle: { color: COLORS.text }, areaStyle: { color: "transparent" } },
          ],
        },
      ],
    };
  }, [compare, runs, cur]);
  return (
    <Panel className="col-span-12 lg:col-span-5" letter="a" title="Stress fingerprint · 6 drivers" model source="Crisis-meter driver scores, 0 = calm, 100 = maximum stress" stamp="Score 0–100">
      <EChart option={option} height={300} />
    </Panel>
  );
}

const PM: Record<string, MetricKey> = { "USD/INR": "usdinr", CPI: "cpi", Reserves: "reserves", Crisis: "crisis" };
export function PathChart() {
  const compare = useStore((s) => s.compare);
  const coef = useStore((s) => s.coef);
  const scen = useStore((s) => s.scenario);
  const [tab, setTab] = useState<keyof typeof PM>("USD/INR");
  const m = PM[tab];
  const option = useMemo<EOption>(() => {
    const series = [
      ...compare.map((id) => ({ name: short(id), type: "line", data: path(presetById(id)!.scenario, coef, m).map((v) => +v.toFixed(2)), symbol: "circle", symbolSize: 5, lineStyle: { color: PCOL[id], width: 1.75 }, itemStyle: { color: PCOL[id] }, endLabel: { show: true, color: PCOL[id], fontSize: 10, formatter: (p: { value: number }) => num(p.value, METRICS[m].d) } })),
      { name: "Current", type: "line", data: path(scen, coef, m).map((v) => +v.toFixed(2)), symbol: "none", lineStyle: { color: COLORS.text, width: 1.5, type: "dashed" }, z: 5 },
    ];
    if (m === "usdinr") (series[0] as Record<string, unknown>).markLine = { silent: true, symbol: "none", data: [{ yAxis: 100 }], lineStyle: { color: COLORS.neg, type: [4, 4] }, label: { formatter: "₹100", color: COLORS.neg, fontSize: 10, position: "insideStartTop" } };
    return {
      grid: { left: 44, right: 56, top: 16, bottom: 24 },
      tooltip: { ...tooltipBase, trigger: "axis" },
      xAxis: { type: "category", data: ["Today", "Q1", "Q2", "Q3", "Q4"], boundaryGap: false, ...axisBase, splitLine: { show: false } },
      yAxis: { type: "value", scale: true, ...axisBase, axisLine: { show: false }, max: m === "usdinr" ? (v: { max: number }) => Math.max(101, Math.ceil(v.max)) : undefined },
      series,
    };
  }, [compare, coef, scen, m]);
  return (
    <Panel className="col-span-12 lg:col-span-7" letter="b" title="Four-quarter paths" model right={<Tabs options={Object.keys(PM) as (keyof typeof PM)[]} value={tab} onChange={setTab} />} source="Team model, scenario held for four quarters" stamp="Deterministic path">
      <EChart option={option} height={300} />
    </Panel>
  );
}

export function CompareTable() {
  const h = useStore((s) => s.scenario.horizon);
  const runs = useRuns(h);
  const compare = useStore((s) => s.compare);
  const toggle = useStore((s) => s.toggleCompare);
  const applyPreset = useStore((s) => s.applyPreset);
  const preset = useStore((s) => s.preset);
  const router = useRouter();
  const cols: { k: keyof ModelOutput; l: string; d: number; upBad: boolean; fmt?: (v: number) => string; lim: [number, number] }[] = [
    { k: "usdinr", l: "USD/INR", d: 2, upBad: true, fmt: (v) => inr(v), lim: [85, 100] },
    { k: "dINR", l: "Rupee move", d: 1, upBad: true, fmt: (v) => `${signed(v, 1)}%`, lim: [-8, 8] },
    { k: "cpi", l: "CPI", d: 2, upBad: true, fmt: (v) => pct(v), lim: [5, 6.6] },
    { k: "reserves", l: "Reserves", d: 1, upBad: false, fmt: (v) => `$${num(v, 1)}B`, lim: [570, 760] },
    { k: "cover", l: "Cover", d: 2, upBad: false, fmt: (v) => `${num(v)} mo`, lim: [5, 8] },
    { k: "callRate", l: "Call rate", d: 2, upBad: true, fmt: (v) => pct(v), lim: [5.25, 6.6] },
    { k: "crisis", l: "Crisis", d: 0, upBad: true, fmt: (v) => num(v, 0), lim: [0, 100] },
  ];
  const sev = (v: number, c: (typeof cols)[number]) => {
    let t = (v - c.lim[0]) / (c.lim[1] - c.lim[0]);
    if (!c.upBad) t = 1 - t;
    return Math.max(0, Math.min(1, t));
  };
  return (
    <Panel className="col-span-12" letter="c" title={<>All seven scenarios · {h === 1 ? "1 quarter" : "4 quarters"}</>} model flush source="Team model; cell shading = severity" stamp="Click a row to compare · ▶ to load">
      <div className="overflow-x-auto">
        <table className="tbl w-full">
          <thead>
            <tr>
              <th className="text-left">Scenario</th>
              {cols.map((c) => <th key={c.l} className="text-right">{c.l}</th>)}
              <th />
            </tr>
          </thead>
          <tbody>
            {PRESETS.map((p) => {
              const r = runs[p.id];
              const on = compare.includes(p.id);
              return (
                <tr key={p.id} className="cursor-pointer" onClick={() => toggle(p.id)} data-active={preset === p.id}>
                  <td>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2" style={{ background: on ? PCOL[p.id] : "transparent", border: `1px solid ${PCOL[p.id]}` }} />
                      <span className={p.tone === "ours" ? "c-brand" : "text-text"}>{short(p.id)}</span>
                      {p.tone === "warn" && <span className="tag watch">Not to do</span>}
                    </span>
                  </td>
                  {cols.map((c) => {
                    const v = r[c.k] as number;
                    const t = sev(v, c);
                    const bg = t > 0.6 ? alpha(COLORS.neg, 0.1 + (t - 0.6) * 0.5) : t < 0.25 ? alpha(COLORS.pos, 0.06 + (0.25 - t) * 0.3) : "transparent";
                    return <td key={c.l} className="mono text-right" style={{ background: bg }}>{c.fmt ? c.fmt(v) : num(v, c.d)}</td>;
                  })}
                  <td className="text-right w-[44px]">
                    <button className="reset" aria-label={`Load ${p.label}`} onClick={(e) => { e.stopPropagation(); applyPreset(p.id); router.push("/"); }}>
                      <Play size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function Frontier() {
  const h = useStore((s) => s.scenario.horizon);
  const runs = useRuns(h);
  const cur = useModel();
  const scen = useStore((s) => s.scenario);
  const applyPreset = useStore((s) => s.applyPreset);
  const option = useMemo<EOption>(() => {
    const pts = PRESETS.map((p) => {
      const r = runs[p.id];
      return { name: p.id, value: [+(p.scenario.rbi * h).toFixed(1), +r.dINR.toFixed(2), +r.cpi.toFixed(2), Math.round(r.crisis)], itemStyle: { color: alpha(PCOL[p.id], 0.75), borderColor: PCOL[p.id] }, symbolSize: 10 + (r.cpi - 5) * 26 };
    });
    return {
      grid: { left: 48, right: 24, top: 24, bottom: 40 },
      tooltip: { ...tooltipBase, trigger: "item", formatter: (p: { name: string; value: number[]; seriesName: string }) => `${p.seriesName === "cur" ? "Current scenario" : short(p.name as PresetId)}<br/>Reserves used <b style="color:${COLORS.text};font-weight:500">$${num(p.value[0], 0)}B</b><br/>Rupee move <b style="color:${COLORS.text};font-weight:500">${signed(p.value[1], 1)}%</b><br/>CPI ${num(p.value[2])}% · Crisis ${p.value[3]}` },
      xAxis: { type: "value", name: "Reserves spent defending ($B)", nameLocation: "middle", nameGap: 26, nameTextStyle: { color: COLORS.text3, fontSize: 10 }, ...axisBase, min: (v: { min: number }) => Math.min(-25, Math.floor(v.min / 10) * 10), max: (v: { max: number }) => Math.max(60, Math.ceil(v.max / 10) * 10) },
      yAxis: { type: "value", name: "Rupee move % (+ = weaker)", nameTextStyle: { color: COLORS.text3, fontSize: 10, align: "left" }, ...axisBase, axisLine: { show: false } },
      series: [
        {
          type: "scatter", data: pts, cursor: "pointer",
          label: { show: true, position: "right", color: COLORS.text2, fontSize: 10, formatter: (p: { name: string }) => short(p.name as PresetId) },
          labelLayout: { hideOverlap: true },
          markLine: { silent: true, symbol: "none", lineStyle: { color: COLORS.border2, type: [3, 3] }, label: { show: false }, data: [{ xAxis: 0 }, { yAxis: 0 }] },
          markArea: { silent: true, itemStyle: { color: "transparent" }, label: { color: COLORS.text3, fontSize: 10 }, data: [[{ name: "Calm, but burns reserves", coord: [20, -100], label: { position: "insideTopRight" } }, { coord: [1000, 0] }], [{ name: "Cheap, but rupee slides", coord: [-1000, 0], label: { position: "insideTopLeft" } }, { coord: [0, 100] }]] },
        },
        { name: "cur", type: "effectScatter", data: [{ value: [+(scen.rbi * h).toFixed(1), +cur.dINR.toFixed(2), +cur.cpi.toFixed(2), Math.round(cur.crisis)] }], symbolSize: 9, itemStyle: { color: COLORS.text }, rippleEffect: { brushType: "stroke", scale: 2.6, period: 3 }, z: 10 },
      ],
    };
  }, [runs, h, cur, scen.rbi]);
  return (
    <Panel className="col-span-12 lg:col-span-6" letter="d" title="The trade-off · cost vs calm" model source="Bubble size = CPI; pulsing dot = your current scenario" stamp="Click a bubble to load it">
      <EChart option={option} height={300} onClick={(p) => p.name && presetById(p.name) && applyPreset(p.name as PresetId)} />
    </Panel>
  );
}

export function Histogram() {
  const cur = useModel();
  const coef = useStore((s) => s.coef);
  const h = useStore((s) => s.scenario.horizon);
  const weeks = 13 * h;
  const vol = coef.VOL_ANNUAL * (cur.crisis > 60 ? 1.5 : 1);
  const hist = useMemo(() => terminalHistogram(93.8, cur.usdinr, weeks, vol), [cur.usdinr, weeks, vol]);
  const option = useMemo<EOption>(() => {
    const cats = hist.bins.map((b) => b.x);
    const total = hist.bins.reduce((a, b) => a + b.n, 0);
    const near = (x: number) => cats.reduce((a, c, i) => (Math.abs(c - x) < Math.abs(cats[a] - x) ? i : a), 0);
    return {
      grid: { left: 36, right: 12, top: 24, bottom: 28 },
      tooltip: { ...tooltipBase, trigger: "axis", axisPointer: { type: "shadow", shadowStyle: { color: "rgba(255,255,255,0.03)" } }, formatter: (ps: { dataIndex: number; value: number }[]) => `₹${num(cats[ps[0].dataIndex], 2)}–${num(cats[ps[0].dataIndex] + hist.w, 2)}<br/><b style="color:${COLORS.text};font-weight:500">${num((ps[0].value / total) * 100, 1)}%</b> of paths` },
      xAxis: { type: "category", data: cats.map((c) => num(c, hist.w < 1 ? 1 : 0)), ...axisBase, axisLabel: { ...axisBase.axisLabel, interval: Math.ceil(cats.length / 8) } },
      yAxis: { type: "value", ...axisBase, axisLine: { show: false }, axisLabel: { ...axisBase.axisLabel, formatter: (v: number) => `${Math.round((v / total) * 100)}%` } },
      series: [
        {
          type: "bar", barCategoryGap: "8%",
          data: hist.bins.map((b) => ({ value: b.n, itemStyle: { color: b.x + hist.w > 100 ? alpha(COLORS.neg, 0.85) : alpha(COLORS.s2, 0.7) } })),
          markLine: {
            silent: true, symbol: "none",
            data: [
              { xAxis: near(hist.p50), lineStyle: { color: COLORS.text, type: [3, 3] }, label: { formatter: `Median ₹${num(hist.p50)}`, color: COLORS.text2, fontSize: 10 } },
              ...(cats[cats.length - 1] >= 99 && cats[0] <= 100 ? [{ xAxis: near(100), lineStyle: { color: COLORS.neg, type: [4, 4] }, label: { formatter: "₹100", color: COLORS.neg, fontSize: 10 } }] : []),
            ],
          },
        },
      ],
    };
  }, [hist]);
  return (
    <Panel className="col-span-12 lg:col-span-6" letter="e" title={<>Where the rupee ends · {h === 1 ? "1 quarter" : "4 quarters"}</>} model right={<span className={`mono text-12 ${hist.above100 > 0.25 ? "c-neg" : hist.above100 > 0.05 ? "c-warn" : "c-pos"}`}>{num(hist.above100 * 100, 1)}% end above ₹100</span>} source={`4,000 Monte Carlo paths, ${num(vol, 1)}% annual vol`} stamp={`90% range ₹${num(hist.p5)}–₹${num(hist.p95)}`}>
      <EChart option={option} height={300} />
    </Panel>
  );
}
