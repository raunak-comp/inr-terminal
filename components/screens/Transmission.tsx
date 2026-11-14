"use client";
import { useMemo, useState } from "react";
import { ArrowRight, MousePointerClick } from "lucide-react";
import { runModel, DEFAULT_SCENARIO, type ModelOutput, type Scenario } from "@/lib/model/model";
import { HEAT_BRENT, HEAT_FPI, METRICS, heatGrid, sankeyFlows, tornado, type MetricKey } from "@/lib/model/analysis";
import type { Delta } from "@/lib/model/clamp";
import { useModel } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { crore, num, signed } from "@/lib/format";
import { EChart, axisBase, tooltipBase, type EOption } from "@/components/charts/EChart";
import { COLORS, alpha } from "@/components/charts/theme";
import { Panel } from "@/components/ui/Panel";
import { Tabs } from "@/components/ui/Controls";

/* ───────────── Causal network ───────────── */
type NodeDef = {
  id: string; label: string; x: number; y: number; kind: "in" | "mid" | "out";
  get: (o: ModelOutput, s: Scenario) => number; fmt: (v: number) => string; upBad: boolean | null; scale: number;
  desc: string; tryIt?: { label: string; delta: Delta };
};

const NODES: NodeDef[] = [
  { id: "brent", label: "Brent crude", x: 0, y: 0, kind: "in", get: (_, s) => s.brent, fmt: (v) => `$${num(v, 1)}`, upBad: true, scale: 20, desc: "India imports 88% of its crude. Every $10 on Brent adds about $15B a year to the oil bill, widens the current account and lifts fuel prices directly.", tryIt: { label: "Brent +$15", delta: { brent: 15 } } },
  { id: "fed", label: "Fed / US yields", x: 0, y: 1, kind: "in", get: (_, s) => s.fed, fmt: (v) => `${signed(v, 0)} bps`, upBad: true, scale: 25, desc: "Higher US yields pull portfolio money out of India: about $3B a quarter for every +25 bps in the model.", tryIt: { label: "Fed +25 bps", delta: { fed: 25 } } },
  { id: "fpi", label: "FPI flow", x: 0, y: 2, kind: "in", get: (_, s) => s.fpi, fmt: (v) => `${signed(v, 1)}B`, upBad: false, scale: 6, desc: "Foreign portfolio investors. Outflows are the single biggest driver of dollar demand: 50% of Q1 FY27 net outflows.", tryIt: { label: "FPI −$6B", delta: { fpi: -6 } } },
  { id: "rbi", label: "RBI dollar ops", x: 0, y: 3, kind: "in", get: (_, s) => s.rbi, fmt: (v) => `${signed(v, 0)}B`, upBad: null, scale: 10, desc: "RBI selling dollars fills the gap and slows the rupee, but drains reserves and rupee liquidity (~₹9,400 Cr per $1B).", tryIt: { label: "RBI sells $10B", delta: { rbi: 10 } } },
  { id: "repo", label: "Repo rate", x: 0, y: 4, kind: "in", get: (_, s) => 5.5 + s.repo / 100, fmt: (v) => `${num(v)}%`, upBad: null, scale: 0.25, desc: "A hike pulls in a little foreign money and lifts the call-rate corridor. The effect on flows is deliberately weak: a 251 bps spread did not stop outflows.", tryIt: { label: "Repo +25 bps", delta: { repo: 25 } } },
  { id: "food", label: "Food shock", x: 0, y: 5, kind: "in", get: (_, s) => s.food, fmt: (v) => `+${num(v, 1)} pp`, upBad: true, scale: 0.4, desc: "A monsoon or supply shock that lifts CPI directly. Food inflation was already 7.74% in Sep 2026.", tryIt: { label: "Food +0.5 pp", delta: { food: 0.5 } } },
  { id: "curbs", label: "FX curbs", x: 0, y: 6, kind: "in", get: (_, s) => (s.curbs ? 1 : 0), fmt: (v) => (v ? "ON" : "OFF"), upBad: null, scale: 1, desc: "Emergency curbs (FERR, $5M limit, NDF ban) damp the rupee move by 20% but push hedging costs to 7.62%.", tryIt: { label: "Toggle curbs", delta: {} } },
  { id: "oil", label: "Oil bill", x: 1.45, y: 0.6, kind: "mid", get: (o) => o.oilQ, fmt: (v) => `${signed(v, 1)}B/q`, upBad: false, scale: 3, desc: "Extra (or saved) dollars spent on crude each quarter." },
  { id: "gap", label: "Dollar gap", x: 1.45, y: 3, kind: "mid", get: (o) => o.unabsorbed, fmt: (v) => `${signed(v, 1)}B/q`, upBad: false, scale: 4, desc: "Net dollars the market must find after RBI action. A negative gap is cleared by a weaker rupee." },
  { id: "liq", label: "Bank liquidity", x: 1.45, y: 5.4, kind: "mid", get: (o) => o.liquidity, fmt: (v) => `₹${num(v, 1)}L Cr`, upBad: false, scale: 1, desc: "Rupee cash in the banking system. RBI dollar sales suck it out; on 22 Oct 2026 the surplus hit ~₹0." },
  { id: "cad", label: "Current account", x: 2.9, y: 0, kind: "out", get: (o) => o.cad, fmt: (v) => `${num(v, 1)}% GDP`, upBad: true, scale: 0.6, desc: "The deck's plan-failure test trips if the CAD tops 2.5% of GDP with outflows above $40B a year." },
  { id: "usdinr", label: "USD/INR", x: 2.9, y: 2, kind: "out", get: (o) => o.usdinr, fmt: (v) => `₹${num(v)}`, upBad: true, scale: 2, desc: "The rupee clears whatever dollar gap is left. The pace of the move matters more than the level." },
  { id: "reserves", label: "FX reserves", x: 2.9, y: 4, kind: "out", get: (o) => o.reserves, fmt: (v) => `$${num(v, 1)}B`, upBad: false, scale: 20, desc: "Starts at $734.6B. Every dollar sold to defend the rupee comes out of here." },
  { id: "call", label: "Call rate", x: 2.9, y: 6, kind: "out", get: (o) => o.callRate, fmt: (v) => `${num(v)}%`, upBad: true, scale: 0.15, desc: "The overnight interbank rate. When liquidity dries up it climbs towards the 5.75% MSF ceiling (5.69% on 22 Oct)." },
  { id: "cpi", label: "CPI inflation", x: 4.35, y: 0.8, kind: "out", get: (o) => o.cpi, fmt: (v) => `${num(v)}%`, upBad: true, scale: 0.3, desc: "A 10% fall in the rupee adds 30–40 bps to CPI, on top of direct fuel and food effects." },
  { id: "fwd", label: "Hedging cost", x: 4.35, y: 2.4, kind: "out", get: (o) => o.fwdPremium, fmt: (v) => `${num(v)}%`, upBad: true, scale: 0.5, desc: "1M forward premium: 5.58% before curbs, 7.62% after. Rises further as the rupee falls." },
  { id: "ecb", label: "ECB loss", x: 4.35, y: 3.6, kind: "out", get: (o) => o.ecbLossCr, fmt: (v) => crore(v), upBad: true, scale: 20000, desc: "Mark-to-market hit on $87B of unhedged corporate dollar debt." },
  { id: "cover", label: "Import cover", x: 4.35, y: 4.8, kind: "out", get: (o) => o.cover, fmt: (v) => `${num(v, 2)} mo`, upBad: false, scale: 0.4, desc: "Usable reserves (after the forward book) divided by monthly imports." },
  { id: "crisis", label: "Crisis meter", x: 5.8, y: 3, kind: "out", get: (o) => o.crisis, fmt: (v) => `${num(v, 0)} / 100`, upBad: true, scale: 15, desc: "Weighted score of six drivers: rupee pace, CAD, reserve cover, CPI, call-rate stress and outflows." },
];
const EDGES: [string, string][] = [
  ["brent", "oil"], ["brent", "cad"], ["brent", "cpi"], ["oil", "gap"], ["fed", "gap"], ["fpi", "gap"], ["repo", "gap"], ["rbi", "gap"],
  ["rbi", "reserves"], ["rbi", "liq"], ["repo", "call"], ["liq", "call"], ["gap", "usdinr"], ["curbs", "usdinr"], ["curbs", "fwd"],
  ["usdinr", "cpi"], ["usdinr", "fwd"], ["usdinr", "ecb"], ["reserves", "cover"], ["food", "cpi"],
  ["cad", "crisis"], ["cpi", "crisis"], ["cover", "crisis"], ["call", "crisis"], ["usdinr", "crisis"], ["gap", "crisis"],
];
const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

function useNodeStates() {
  const o = useModel();
  const s = useStore((st) => st.scenario);
  const coef = useStore((st) => st.coef);
  const base = useMemo(() => runModel({ ...DEFAULT_SCENARIO, horizon: s.horizon }, coef), [coef, s.horizon]);
  const bs = useMemo(() => ({ ...DEFAULT_SCENARIO, horizon: s.horizon }), [s.horizon]);
  return useMemo(
    () =>
      Object.fromEntries(
        NODES.map((n) => {
          const v = n.get(o, s);
          const b = n.get(base, bs);
          const d = v - b;
          const mag = Math.min(1, Math.abs(d) / n.scale);
          const active = Math.abs(d) > n.scale * 0.02;
          let tone: "bad" | "good" | "neutral" | "idle" = active ? "neutral" : "idle";
          if (active && n.upBad !== null) tone = (d > 0) === n.upBad ? "bad" : "good";
          return [n.id, { v, b, d, mag, active, tone }];
        })
      ) as Record<string, { v: number; b: number; d: number; mag: number; active: boolean; tone: "bad" | "good" | "neutral" | "idle" }>,
    [o, s, base, bs]
  );
}
const toneColor = (t: string) => (t === "bad" ? COLORS.neg : t === "good" ? COLORS.pos : t === "neutral" ? COLORS.s2 : COLORS.border2);

export function CausalNetwork() {
  const st = useNodeStates();
  const sel = useStore((s) => s.node);
  const setNode = useStore((s) => s.setNode);
  const option = useMemo<EOption>(() => {
    const nodes = NODES.map((n) => {
      const k = st[n.id];
      const c = toneColor(k.tone);
      const isSel = sel === n.id;
      return {
        name: n.id,
        value: [n.x, n.y],
        symbol: "rect",
        symbolSize: n.id === "crisis" ? [112, 46] : [112, 36],
        itemStyle: { color: k.active ? alpha(c, 0.12 + k.mag * 0.18) : COLORS.panel2, borderColor: isSel ? COLORS.text : k.active ? c : COLORS.border2, borderWidth: isSel ? 1.5 : 1 },
        label: {
          show: true, position: "inside",
          formatter: () => `{l|${n.label.toUpperCase()}}\n{v|${n.fmt(k.v)}}`,
          rich: { l: { fontSize: 9, color: COLORS.text3, lineHeight: 13 }, v: { fontSize: 12, color: k.active ? COLORS.text : COLORS.text2, lineHeight: 16 } },
        },
      };
    });
    const links = EDGES.map(([a, b]) => {
      const k = st[a];
      return { source: a, target: b, lineStyle: { color: k.active ? alpha(toneColor(k.tone), 0.7) : COLORS.border, width: k.active ? 1 + k.mag * 2 : 1, curveness: 0 } };
    });
    const flows = EDGES.filter(([a]) => st[a].active).map(([a, b]) => ({
      coords: [[byId[a].x, byId[a].y], [byId[b].x, byId[b].y]],
      lineStyle: { color: toneColor(st[a].tone), opacity: 0 },
      effect: { color: toneColor(st[a].tone) },
    }));
    return {
      animationDurationUpdate: 300,
      grid: { left: 64, right: 64, top: 30, bottom: 30 },
      xAxis: { type: "value", min: 0, max: 5.8, show: false },
      yAxis: { type: "value", min: 0, max: 6, inverse: true, show: false },
      tooltip: { show: false },
      series: [
        {
          type: "lines", coordinateSystem: "cartesian2d", z: 1, silent: true, data: flows,
          effect: { show: true, period: 2.4, symbol: "circle", symbolSize: 4, trailLength: 0, loop: true },
        },
        { type: "graph", coordinateSystem: "cartesian2d", layout: "none", z: 3, data: nodes, links, edgeSymbol: ["none", "arrow"], edgeSymbolSize: 5, emphasis: { disabled: true }, cursor: "pointer" },
      ],
    };
  }, [st, sel]);
  const live = NODES.filter((n) => n.kind === "in" && st[n.id].active).length;
  return (
    <Panel
      className="col-span-12 xl:col-span-8"
      letter="a"
      title="Cause and effect · live network"
      model
      right={<span className="mono text-11 text-text-3 flex items-center gap-1.5"><MousePointerClick size={12} /> Click any node</span>}
      source="Team model: each arrow is an equation in the Stress Engine"
      stamp={live ? `${live} shock${live > 1 ? "s" : ""} travelling` : "At baseline: move a lever"}
      flush
    >
      <div className="flex items-center gap-4 px-3 pt-2 text-11 text-text-3">
        {[["Shock / input", COLORS.border2], ["Worse than base", COLORS.neg], ["Better than base", COLORS.pos], ["Policy choice", COLORS.s2]].map(([l, c]) => (
          <span key={l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 border" style={{ borderColor: c, background: alpha(c, 0.15) }} />{l}</span>
        ))}
        <span className="ml-auto mono hide-sm">Inputs → channels → outcomes → crisis</span>
      </div>
      <EChart option={option} height={430} onClick={(p) => p.name && byId[p.name] && setNode(p.name)} />
    </Panel>
  );
}

export function NodeInspector() {
  const st = useNodeStates();
  const id = useStore((s) => s.node);
  const setNode = useStore((s) => s.setNode);
  const shock = useStore((s) => s.shock);
  const curbs = useStore((s) => s.scenario.curbs);
  const n = byId[id] ?? byId.usdinr;
  const k = st[n.id];
  const ins = EDGES.filter(([, b]) => b === n.id).map(([a]) => byId[a]);
  const outs = EDGES.filter(([a]) => a === n.id).map(([, b]) => byId[b]);
  const c = toneColor(k.tone);
  return (
    <Panel className="col-span-12 xl:col-span-4" letter="b" title="Node inspector" source="Team model" stamp="vs base scenario, same horizon">
      <div className="mono text-10 tracking-[0.1em] text-text-3">{n.kind === "in" ? "INPUT" : n.kind === "mid" ? "CHANNEL" : "OUTCOME"}</div>
      <div className="text-20 text-text mt-0.5">{n.label}</div>
      <div className="flex items-baseline gap-3 mt-3">
        <span className="mono text-36 leading-none" style={{ color: k.active ? c : COLORS.text }}>{n.fmt(k.v)}</span>
        <span className="mono text-12 text-text-3">base {n.fmt(k.b)}</span>
      </div>
      <div className="h-1 bg-panel-2 mt-3 relative">
        <div className="absolute inset-y-0 left-0 transition-[width] duration-200" style={{ width: `${k.mag * 100}%`, background: c }} />
      </div>
      <div className="flex justify-between text-10 mono text-text-3 mt-1"><span>No change</span><span>Large move</span></div>
      <p className="text-13 text-text-2 mt-3 leading-[1.5]">{n.desc}</p>
      {ins.length > 0 && (
        <div className="mt-4">
          <div className="text-10 mono tracking-[0.1em] text-text-3 mb-1.5">DRIVEN BY</div>
          <div className="flex flex-wrap gap-1.5">{ins.map((x) => <button key={x.id} className="chip" onClick={() => setNode(x.id)}>{x.label}</button>)}</div>
        </div>
      )}
      {outs.length > 0 && (
        <div className="mt-3">
          <div className="text-10 mono tracking-[0.1em] text-text-3 mb-1.5">FEEDS INTO</div>
          <div className="flex flex-wrap gap-1.5">{outs.map((x) => <button key={x.id} className="chip" onClick={() => setNode(x.id)}>{x.label} <ArrowRight size={11} /></button>)}</div>
        </div>
      )}
      {n.tryIt && (
        <button className="btn primary mt-4 w-full justify-center" onClick={() => (n.id === "curbs" ? shock({ curbs: !curbs }) : shock(n.tryIt!.delta))}>
          Try it: {n.id === "curbs" ? (curbs ? "switch curbs OFF" : "switch curbs ON") : n.tryIt.label}
        </button>
      )}
    </Panel>
  );
}

/* ───────────── Sankey ───────────── */
const NAME_IN: Record<string, string> = { "FPI flow": "FPI inflow", "Oil bill": "Oil savings", "Fed-driven flows": "US yields fall", "Repo-driven flows": "Repo hike pull", "RBI dollar ops": "RBI sells dollars" };
const NAME_OUT: Record<string, string> = { "FPI flow": "FPI outflow", "Oil bill": "Extra oil bill", "Fed-driven flows": "Fed-driven exit", "Repo-driven flows": "Repo cut exit", "RBI dollar ops": "RBI buys dollars" };

export function DollarSankey() {
  const o = useModel();
  const h = useStore((s) => s.scenario.horizon);
  const applyPreset = useStore((s) => s.applyPreset);
  const { ins, outs } = sankeyFlows(o);
  const empty = !ins.length && !outs.length;
  const option = useMemo<EOption>(() => {
    const L = ins.map(([k, v]) => [NAME_IN[k] ?? k, v] as [string, number]);
    const R = outs.map(([k, v]) => [NAME_OUT[k] ?? k, v] as [string, number]);
    const colIn = (n: string) => (n.startsWith("Rupee") ? COLORS.neg : n.startsWith("RBI") ? COLORS.s2 : COLORS.pos);
    const colOut = (n: string) => (n.startsWith("Rupee") ? COLORS.pos : n.startsWith("RBI") ? COLORS.s2 : COLORS.neg);
    return {
      tooltip: { ...tooltipBase, trigger: "item", formatter: (p: { data: { source?: string; target?: string; value?: number; name?: string }; value: number }) => (p.data.source ? `${p.data.source} → ${p.data.target}: <b style="color:${COLORS.text};font-weight:500">$${num(p.value, 1)}B</b>` : `${p.data.name}: <b style="color:${COLORS.text};font-weight:500">$${num(p.value, 1)}B</b>`) },
      series: [
        {
          type: "sankey", left: 210, right: 170, top: 30, bottom: 10, nodeWidth: 10, nodeGap: 14, layoutIterations: 0, draggable: false,
          label: { color: COLORS.text2, fontSize: 11, formatter: (p: { name: string; value: number }) => `${p.name}  {v|$${num(p.value, 1)}B}`, rich: { v: { color: COLORS.text, fontSize: 11 } } },
          lineStyle: { color: "source", opacity: 0.28, curveness: 0.5 },
          emphasis: { focus: "adjacency", lineStyle: { opacity: 0.5 } },
          data: [
            ...L.map(([n]) => ({ name: n, depth: 0, itemStyle: { color: colIn(n), borderWidth: 0 }, label: { position: "left" } })),
            { name: "FX market", depth: 1, itemStyle: { color: COLORS.text2, borderWidth: 0 }, label: { position: "top", formatter: (p: { value: number }) => `FX market  {v|$${num(p.value, 1)}B}`, color: COLORS.text2 } },
            ...R.map(([n]) => ({ name: n, depth: 2, itemStyle: { color: colOut(n), borderWidth: 0 } })),
          ],
          links: [...L.map(([n, v]) => ({ source: n, target: "FX market", value: +v.toFixed(2) })), ...R.map(([n, v]) => ({ source: "FX market", target: n, value: +v.toFixed(2) }))],
        },
      ],
    };
  }, [ins, outs]);
  return (
    <Panel className="col-span-12 xl:col-span-6" letter="c" title={<>Where the dollars go · {h === 1 ? "1 quarter" : "4 quarters"}</>} model source="Team model: dollar supply and demand over the horizon" stamp="$B">
      {empty ? (
        <div className="h-[280px] flex flex-col items-center justify-center text-center gap-3">
          <div className="text-14 text-text-2">No net dollar pressure at the baseline.</div>
          <div className="text-12 text-text-3 max-w-[360px]">Load a scenario to watch dollars flow from sources (left) through the FX market to uses (right). Whatever is left is cleared by the rupee.</div>
          <div className="flex gap-2 mt-1">
            <button className="btn" onClick={() => applyPreset("oil130")}>Oil shock</button>
            <button className="btn" onClick={() => applyPreset("fed25")}>Fed hike</button>
            <button className="btn primary" onClick={() => applyPreset("plan")}>Our plan</button>
          </div>
        </div>
      ) : (
        <EChart option={option} height={280} />
      )}
    </Panel>
  );
}

/* ───────────── Tornado ───────────── */
const TM: MetricKey[] = ["usdinr", "cpi", "crisis", "reserves"];
const TL: Record<string, MetricKey> = { "USD/INR": "usdinr", CPI: "cpi", Crisis: "crisis", Reserves: "reserves" };

export function Tornado() {
  const s = useStore((st) => st.scenario);
  const coef = useStore((st) => st.coef);
  const [tab, setTab] = useState<keyof typeof TL>("USD/INR");
  const m = TL[tab];
  const meta = METRICS[m];
  const rows = useMemo(() => tornado(s, coef, m), [s, coef, m]);
  const cur = useMemo(() => runModel(s, coef)[m], [s, coef, m]);
  const option = useMemo<EOption>(() => {
    const col = (v: number) => (Math.abs(v) < 1e-9 ? COLORS.border2 : (v > 0) === meta.upBad ? COLORS.neg : COLORS.pos);
    const mx = Math.max(1e-6, ...rows.map((r) => Math.max(Math.abs(r.lo), Math.abs(r.hi))));
    const lim = mx * 1.55;
    const lab = { show: true, color: COLORS.text2, fontSize: 10, formatter: (p: { value: number }) => (Math.abs(p.value) < 10 ** -meta.d / 2 ? "" : signed(p.value, meta.d)) };
    const item = (v: number) => ({ value: +v.toFixed(4), itemStyle: { color: alpha(col(v), 0.85) }, label: { ...lab, position: v < 0 ? "left" : "right" } });
    return {
      grid: { left: 118, right: 12, top: 8, bottom: 22 },
      tooltip: { ...tooltipBase, trigger: "axis", axisPointer: { type: "shadow", shadowStyle: { color: "rgba(255,255,255,0.03)" } }, formatter: (ps: { dataIndex: number }[]) => { const r = rows[ps[0].dataIndex]; return `${r.label}<br/>${r.loL}: <b style="color:${COLORS.text};font-weight:500">${signed(r.lo, meta.d)}</b><br/>${r.hiL}: <b style="color:${COLORS.text};font-weight:500">${signed(r.hi, meta.d)}</b>`; } },
      xAxis: { type: "value", min: -lim, max: lim, ...axisBase, axisLabel: { show: false }, splitLine: { show: false } },
      yAxis: {
        type: "category", data: rows.map((r) => r.k), ...axisBase, axisLine: { show: false },
        axisLabel: { ...axisBase.axisLabel, formatter: (k: string) => { const r = rows.find((x) => x.k === k)!; return `{a|${r.label}}\n{b|${r.loL} / ${r.hiL}}`; }, rich: { a: { color: COLORS.text2, fontSize: 11, lineHeight: 14, align: "right" }, b: { color: COLORS.text3, fontSize: 9, lineHeight: 12, align: "right" } } },
      },
      series: [
        { type: "bar", data: rows.map((r) => item(r.lo)), barWidth: 14, stack: "a", markLine: { silent: true, symbol: "none", data: [{ xAxis: 0 }], lineStyle: { color: COLORS.text3 }, label: { show: false } } },
        { type: "bar", data: rows.map((r) => item(r.hi)), barWidth: 14, stack: "b", barGap: "-100%" },
      ],
    };
  }, [rows, meta]);
  return (
    <Panel className="col-span-12 xl:col-span-5" letter="d" title="Tornado" model right={<Tabs options={Object.keys(TL) as (keyof typeof TL)[]} value={tab} onChange={setTab} />} source="Each lever swung across a realistic band, others held" stamp={`Now ${meta.unit === "₹" ? "₹" : ""}${num(cur, meta.d)}${meta.unit && meta.unit !== "₹" ? " " + meta.unit : ""}`}>
      <EChart option={option} height={250} />
      <p className="text-11 text-text-3 mt-1">Longest bar = the lever that matters most right now. It changes as you move the scenario.</p>
    </Panel>
  );
}

/* ───────────── Heatmap ───────────── */
const HM: Record<string, MetricKey> = { Crisis: "crisis", "USD/INR": "usdinr", CPI: "cpi" };
const PIECES: Record<MetricKey, number[]> = {
  crisis: [20, 35, 50, 60, 75], usdinr: [92, 94, 96, 98, 100], cpi: [5.5, 5.75, 6, 6.25, 6.5], reserves: [], cover: [], callRate: [],
};
const SCALE = [alpha(COLORS.pos, 0.55), alpha(COLORS.pos, 0.22), "#24242A", alpha(COLORS.warn, 0.45), alpha(COLORS.neg, 0.5), alpha(COLORS.neg, 0.85)];

export function StressHeatmap() {
  const s = useStore((st) => st.scenario);
  const coef = useStore((st) => st.coef);
  const shock = useStore((st) => st.shock);
  const [tab, setTab] = useState<keyof typeof HM>("Crisis");
  const m = HM[tab];
  const data = useMemo(() => heatGrid(s, coef, m), [s, coef, m]);
  const ci = HEAT_BRENT.reduce((a, b, i) => (Math.abs(b - s.brent) < Math.abs(HEAT_BRENT[a] - s.brent) ? i : a), 0);
  const cj = HEAT_FPI.reduce((a, f, j) => (Math.abs(f - s.fpi) < Math.abs(HEAT_FPI[a] - s.fpi) ? j : a), 0);
  const p = PIECES[m];
  const d = METRICS[m].d;
  const option = useMemo<EOption>(
    () => ({
      grid: { left: 48, right: 8, top: 8, bottom: 40 },
      tooltip: { ...tooltipBase, formatter: (q: { value: [number, number, number] }) => `Brent $${HEAT_BRENT[q.value[0]]} · FPI ${signed(HEAT_FPI[q.value[1]], 0)}B/q<br/>${METRICS[m].label}: <b style="color:${COLORS.text};font-weight:500">${num(q.value[2], d)}</b><br/><span style="color:${COLORS.text3}">Click to load</span>` },
      xAxis: { type: "category", data: HEAT_BRENT.map((b) => `$${b}`), ...axisBase, splitArea: { show: false }, name: "Brent $/bbl", nameLocation: "middle", nameGap: 26, nameTextStyle: { color: COLORS.text3, fontSize: 10 } },
      yAxis: { type: "category", data: HEAT_FPI.map((f) => signed(f, 0)), ...axisBase, name: "FPI $B/q", nameLocation: "middle", nameGap: 34, nameTextStyle: { color: COLORS.text3, fontSize: 10 } },
      visualMap: { show: false, type: "piecewise", dimension: 2, pieces: [{ lt: p[0], color: SCALE[0] }, { gte: p[0], lt: p[1], color: SCALE[1] }, { gte: p[1], lt: p[2], color: SCALE[2] }, { gte: p[2], lt: p[3], color: SCALE[3] }, { gte: p[3], lt: p[4], color: SCALE[4] }, { gte: p[4], color: SCALE[5] }] },
      series: [
        {
          type: "heatmap", cursor: "pointer",
          data: data.map(([i, j, v]) => ({ value: [i, j, v], itemStyle: i === ci && j === cj ? { borderColor: COLORS.text, borderWidth: 2 } : { borderColor: COLORS.panel, borderWidth: 1 } })),
          label: { show: true, fontSize: 9, color: COLORS.text2, formatter: (q: { value: [number, number, number] }) => num(q.value[2], m === "crisis" ? 0 : m === "usdinr" ? 0 : 1) },
          emphasis: { itemStyle: { borderColor: COLORS.text2, borderWidth: 1 } },
        },
      ],
    }),
    [data, ci, cj, p, m, d]
  );
  return (
    <Panel className="col-span-12 xl:col-span-7" letter="e" title="Stress map · Brent × foreign flows" model right={<Tabs options={Object.keys(HM) as (keyof typeof HM)[]} value={tab} onChange={setTab} />} source="100 model runs; other levers held at current values" stamp="White box = you are here">
      <EChart option={option} height={300} onClick={(q) => { const v = (q as unknown as { value: [number, number] }).value; if (v) shock({ brent: HEAT_BRENT[v[0]] - s.brent, fpi: HEAT_FPI[v[1]] - s.fpi }); }} />
      <div className="flex items-center gap-1 mt-2 text-10 mono text-text-3">
        {SCALE.map((c, i) => (
          <span key={i} className="flex items-center gap-1 mr-2"><span className="w-3 h-2.5" style={{ background: c }} />{i === 0 ? `< ${p[0]}` : i === 5 ? `≥ ${p[4]}` : `${p[i - 1]}–${p[i]}`}</span>
        ))}
        <span className="ml-auto">Click any cell to load it</span>
      </div>
    </Panel>
  );
}
