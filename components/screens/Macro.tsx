"use client";
import { useMemo, useState } from "react";
import { headline, idealRupee, importBasketFY26, inflationSplit, outflowDriversQ1FY27, twinDeficits, corporate } from "@/lib/data/deck";
import { useModel } from "@/lib/hooks";
import { DEFAULT_SCENARIO, runModel } from "@/lib/model/model";
import { useStore } from "@/lib/store";
import { crore, inr, num, signed } from "@/lib/format";
import { EChart, axisBase, tooltipBase, type EOption } from "@/components/charts/EChart";
import { COLORS, alpha } from "@/components/charts/theme";
import { Panel } from "@/components/ui/Panel";

/* ───────────── Rupee calculator ───────────── */
export function RupeeCalculator() {
  const o = useModel();
  const pt = useStore((s) => s.coef.PASS_THROUGH);
  const [rate, setRate] = useState(93.8);
  const dPct = (rate / 93.8 - 1) * 100;
  const oilQ = (headline.q1OilBillB * rate) / 1000;
  const oil0 = (headline.q1OilBillB * 93.8) / 1000;
  const gold = (headline.goldBillB * rate) / 1000;
  const gold0 = (headline.goldBillB * 93.8) / 1000;
  const ecb = (corporate.ecbUnhedgedB * 1e9 * (rate - 93.8)) / 1e7;
  const cpiAdd = pt * dPct;
  const zone = idealRupee.zones.find((z) => rate <= z.from && rate >= z.to) ?? (rate > 100 ? { label: "Beyond ₹100" } : { label: "Too strong" });
  const zc = (l: string) => (l === "IDEAL" ? COLORS.pos : l === "Risky" ? COLORS.warn : COLORS.neg);
  const pos = (v: number) => ((v - 75) / (105 - 75)) * 100;
  const tiles = [
    { l: "Prices (CPI)", v: `${signed(cpiAdd, 2)} pp`, s: `${num(pt, 3)} pp per 1% move`, bad: cpiAdd > 0.005, good: cpiAdd < -0.005 },
    { l: "Quarterly oil bill", v: `₹${num(oilQ, 2)}L Cr`, s: `${signed(oilQ - oil0, 2)}L Cr vs today`, bad: oilQ > oil0 + 0.001, good: oilQ < oil0 - 0.001 },
    { l: "Unhedged ECB hit", v: crore(Math.abs(ecb)), s: ecb >= 0 ? "Mark-to-market loss" : "Mark-to-market gain", bad: ecb > 1, good: ecb < -1 },
    { l: "Annual gold bill", v: `₹${num(gold, 2)}L Cr`, s: `${signed(gold - gold0, 2)}L Cr vs today`, bad: gold > gold0 + 0.001, good: gold < gold0 - 0.001 },
  ];
  return (
    <Panel className="col-span-12 xl:col-span-6" letter="a" title="Rupee calculator · what a level means" right={<button className="btn h-[22px] text-11" onClick={() => setRate(+o.usdinr.toFixed(1))}>Use scenario {inr(o.usdinr, 1)}</button>} source="Deck: Q1 oil bill $60.6B, gold $72B, $87B unhedged ECBs; CPI pass-through" stamp="vs ₹93.80 today">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-11 text-text-3">Drag the rupee</div>
          <div className="mono text-36 text-text leading-none mt-1">₹{num(rate, 1)}</div>
        </div>
        <div className="text-right">
          <div className="mono text-14" style={{ color: dPct > 0 ? COLORS.neg : dPct < 0 ? COLORS.pos : COLORS.text3 }}>{signed(dPct, 1)}% {dPct > 0 ? "weaker" : dPct < 0 ? "stronger" : ""}</div>
          <span className="tag mt-1" style={{ color: zc(zone.label), borderColor: alpha(zc(zone.label), 0.5) }}>{zone.label}</span>
        </div>
      </div>
      <div className="relative mt-4 h-7">
        <div className="absolute inset-x-0 top-2 h-3 flex">
          {[...idealRupee.zones].reverse().map((z) => (
            <div key={z.from + z.label} className="h-full border-r border-bg" style={{ width: `${((z.from - z.to) / 30) * 100}%`, background: alpha(zc(z.label), z.label === "IDEAL" ? 0.55 : 0.25) }} />
          ))}
          <div className="h-full flex-1" style={{ background: alpha(COLORS.neg, 0.45) }} />
        </div>
        <div className="absolute top-0 w-px h-7 bg-text transition-[left] duration-100" style={{ left: `${pos(rate)}%` }} />
        <input type="range" aria-label="Rupee level" min={75} max={105} step={0.1} value={rate} onChange={(e) => setRate(+e.target.value)} className="absolute inset-0 w-full opacity-0 cursor-ew-resize" />
      </div>
      <div className="relative h-4 mono text-10 text-text-3 mt-1">
        {[[75, "₹75"], [80, "₹80"], [86.5, "Ideal ₹85–88"], [94.3, "₹94.3"], [100, "₹100"], [105, "₹105"]].map(([v, l]) => (
          <span key={l as string} className="absolute whitespace-nowrap" style={{ left: `${pos(v as number)}%`, transform: v === 75 ? "none" : v === 105 ? "translateX(-100%)" : "translateX(-50%)", color: v === 86.5 ? COLORS.pos : undefined }}>{l}</span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-px bg-border mt-4 border border-border">
        {tiles.map((t) => (
          <div key={t.l} className="bg-panel p-3">
            <div className="text-11 text-text-3">{t.l}</div>
            <div className={`mono text-20 mt-1 ${t.bad ? "c-neg" : t.good ? "c-pos" : "text-text"}`}>{t.v}</div>
            <div className="text-11 text-text-3 mt-0.5">{t.s}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ───────────── Twin deficits connected scatter ───────────── */
export function TwinPath() {
  const option = useMemo<EOption>(() => {
    const pts = twinDeficits.map((t) => [t.fiscal, Math.abs(t.cadB)]);
    return {
      grid: { left: 48, right: 24, top: 24, bottom: 40 },
      tooltip: { ...tooltipBase, trigger: "item", formatter: (p: { dataIndex: number }) => { const t = twinDeficits[p.dataIndex]; return `${t.fy}<br/>Fiscal <b style="color:${COLORS.text};font-weight:500">${num(t.fiscal, 1)}% GDP</b><br/>CAD <b style="color:${COLORS.text};font-weight:500">$${Math.abs(t.cadB)}B</b>`; } },
      xAxis: { type: "value", name: "Combined fiscal deficit, % GDP", nameLocation: "middle", nameGap: 26, nameTextStyle: { color: COLORS.text3, fontSize: 10 }, min: 7, max: 9.6, inverse: true, ...axisBase },
      yAxis: { type: "value", name: "Current account deficit, $B", nameTextStyle: { color: COLORS.text3, fontSize: 10, align: "left" }, min: 0, max: 75, ...axisBase, axisLine: { show: false } },
      series: [
        {
          type: "line", data: pts, symbol: "circle", symbolSize: (_: unknown, p: { dataIndex: number }) => (p.dataIndex === pts.length - 1 ? 11 : 8),
          lineStyle: { color: COLORS.brandSoft, width: 1.5 },
          itemStyle: { color: COLORS.panel, borderColor: COLORS.brandSoft, borderWidth: 1.5 },
          label: { show: true, position: "top", color: COLORS.text2, fontSize: 10, formatter: (p: { dataIndex: number }) => twinDeficits[p.dataIndex].fy },
        },
        { type: "lines", coordinateSystem: "cartesian2d", silent: true, data: pts.slice(1).map((p, i) => ({ coords: [pts[i], p] })), lineStyle: { opacity: 0 }, effect: { show: true, period: 3, symbol: "arrow", symbolSize: 6, color: COLORS.brandSoft, trailLength: 0 } },
      ],
    };
  }, []);
  return (
    <Panel className="col-span-12 xl:col-span-6" letter="b" title="Twin deficits · the path FY23 → FY27E" source="Livemint: Budget 2026-27; RBI BoP" stamp="Fiscal axis reversed: right = smaller deficit">
      <EChart option={option} height={292} />
      <p className="text-11 text-text-3">The fiscal side kept improving; the external side turned back up in FY26–27 as oil and outflows bit. That is the “twin-deficit squeeze”.</p>
    </Panel>
  );
}

/* ───────────── Treemap ───────────── */
export function ImportTreemap() {
  const option = useMemo<EOption>(() => {
    const cols = [COLORS.brand, COLORS.brandSoft, COLORS.warn, "#3A3A44"];
    return {
      tooltip: { ...tooltipBase, formatter: (p: { name: string; value: number }) => `${p.name}: <b style="color:${COLORS.text};font-weight:500">${p.value}%</b> of imports` },
      series: [
        {
          type: "treemap", roam: false, nodeClick: false, breadcrumb: { show: false }, left: 0, right: 0, top: 0, bottom: 0,
          itemStyle: { borderColor: COLORS.panel, borderWidth: 2, gapWidth: 2 },
          label: { show: true, formatter: (p: { name: string; value: number }) => `{v|${p.value}%}\n{n|${p.name}}`, rich: { v: { fontSize: 18, color: COLORS.text, lineHeight: 22 }, n: { fontSize: 10, color: COLORS.text2, lineHeight: 14 } }, position: "insideTopLeft", padding: 8 },
          data: importBasketFY26.map(([n, v], i) => ({ name: n, value: v, itemStyle: { color: alpha(cols[i], i === 3 ? 1 : 0.55) } })),
        },
      ],
    };
  }, []);
  return (
    <Panel className="col-span-12 lg:col-span-6 xl:col-span-4" letter="c" title="Import basket · FY26" source="Finnovate: FY26 trade data" stamp={`Crude reliance ${headline.crudeReliance}%`}>
      <EChart option={option} height={230} />
      <p className="text-11 text-text-3 mt-2">Half the import bill is oil, chips and gold: the “dollar bills” our plan targets.</p>
    </Panel>
  );
}

/* ───────────── Waffle ───────────── */
export function OutflowWaffle() {
  const { totalB, split } = outflowDriversQ1FY27;
  const cols = [COLORS.neg, COLORS.warn, COLORS.s2, COLORS.text3];
  const cells = split.flatMap(([, v], i) => Array(v).fill(i));
  const [hi, setHi] = useState<number | null>(null);
  return (
    <Panel className="col-span-12 lg:col-span-6 xl:col-span-4" letter="d" title="Why dollars left · Q1 FY27" source="RBI: BoP press release Q1 FY27" stamp={`$${num(totalB, 1)}B net outflow`}>
      <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
        <div className="grid grid-cols-10 gap-[3px]" style={{ width: 170 }}>
          {cells.map((c, i) => (
            <span key={i} className="aspect-square transition-opacity duration-150" style={{ background: cols[c], opacity: hi === null || hi === c ? 0.9 : 0.15, borderRadius: 1 }} />
          ))}
        </div>
        <ul className="flex flex-col gap-2 text-11 min-w-0">
          {split.map(([n, v], i) => (
            <li key={n} className="cursor-default" onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)}>
              <div className="flex items-center gap-2"><span className="w-2 h-2" style={{ background: cols[i] }} /><span className="text-text-2 truncate">{n}</span></div>
              <div className="mono text-text ml-4">{v}% <span className="text-text-3">· ${num((totalB * v) / 100, 1)}B</span></div>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-11 text-text-3 mt-3">Each square = 1% of the outflow. Hover a driver to isolate it.</p>
    </Panel>
  );
}

/* ───────────── Inflation dot plot ───────────── */
export function InflationDots() {
  const o = useModel();
  const rows: [string, number, string][] = [["Rural food", corporate.ruralFood, COLORS.neg], ...inflationSplit.map(([n, v]) => [n, v, n === "Food" ? COLORS.neg : COLORS.warn] as [string, number, string]), ["Headline CPI", 5.54, COLORS.text], ["Scenario CPI", +o.cpi.toFixed(2), COLORS.brandSoft]];
  const option = useMemo<EOption>(() => ({
    grid: { left: 92, right: 40, top: 22, bottom: 24 },
    tooltip: { show: false },
    xAxis: { type: "value", min: 2, max: 9, ...axisBase, axisLabel: { ...axisBase.axisLabel, formatter: "{value}%" } },
    yAxis: { type: "category", data: rows.map((r) => r[0]), inverse: true, ...axisBase, axisLine: { show: false }, axisLabel: { ...axisBase.axisLabel, color: COLORS.text2, fontFamily: "inherit" } },
    series: [
      { type: "bar", data: rows.map((r) => r[1] - 2), stack: "s", barWidth: 2, itemStyle: { color: COLORS.border2 }, silent: true },
      {
        type: "scatter", data: rows.map((r, i) => ({ value: [r[1], i], itemStyle: { color: r[2] } })), symbolSize: 10,
        label: { show: true, position: "right", color: COLORS.text, fontSize: 11, formatter: (p: { value: number[] }) => `${num(p.value[0])}%` },
        markArea: { silent: true, itemStyle: { color: alpha(COLORS.pos, 0.05) }, data: [[{ xAxis: 2 }, { xAxis: 6 }]] },
        markLine: { silent: true, symbol: "none", data: [{ xAxis: 4, label: { formatter: "Target 4%" } }, { xAxis: 6, label: { formatter: "Ceiling 6%" } }], lineStyle: { color: COLORS.text3, type: [3, 3] }, label: { color: COLORS.text3, fontSize: 9, position: "end" } },
      },
    ],
  }), [rows]);
  return (
    <Panel className="col-span-12 xl:col-span-4" letter="e" title="Who feels inflation · Sep 2026" right={<span className="tag">Scenario-linked</span>} source="MoSPI CPI Sep 2026; team model" stamp="RBI band 2–6%">
      <EChart option={option} height={230} />
      <p className="text-11 text-text-3 mt-2">Food and villages run hottest; cities sit inside the band. The pink dot moves with your scenario.</p>
    </Panel>
  );
}

/* ───────────── Bullet charts ───────────── */
type B = { l: string; v: number; scen?: number; mark?: { v: number; l: string }; min: number; max: number; bands: [number, number, number]; upBad: boolean; unit: string; d: number; note: string };
function Bullet({ b }: { b: B }) {
  const p = (x: number) => `${Math.max(0, Math.min(100, ((x - b.min) / (b.max - b.min)) * 100))}%`;
  const [c1, c2, c3] = b.upBad ? [COLORS.pos, COLORS.warn, COLORS.neg] : [COLORS.neg, COLORS.warn, COLORS.pos];
  const band = (v: number) => (v < b.bands[1] ? 0 : v < b.bands[2] ? 1 : 2);
  const tone = [c1, c2, c3][band(b.scen ?? b.v)];
  return (
    <div className="py-2.5 border-b border-border last:border-b-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-12 text-text-2 truncate">{b.l}</span>
        <span className="mono text-14" style={{ color: tone }}>
          {num(b.scen ?? b.v, b.d)}{b.unit}
          {b.scen !== undefined && Math.abs(b.scen - b.v) > 10 ** -b.d / 2 && <span className="text-11 text-text-3"> · today {num(b.v, b.d)}{b.unit}</span>}
        </span>
      </div>
      <div className="relative h-4 mt-1.5">
        <div className="absolute inset-y-1 left-0" style={{ width: p(b.bands[1]), background: alpha(c1, 0.16) }} />
        <div className="absolute inset-y-1" style={{ left: p(b.bands[1]), width: `calc(${p(b.bands[2])} - ${p(b.bands[1])})`, background: alpha(c2, 0.16) }} />
        <div className="absolute inset-y-1 right-0" style={{ left: p(b.bands[2]), background: alpha(c3, 0.16) }} />
        <div className="absolute top-[6px] h-1 left-0 bg-text-2 transition-[width] duration-200" style={{ width: p(b.v) }} />
        {b.scen !== undefined && <div className="absolute top-0 w-[3px] h-4 transition-[left] duration-200" style={{ left: `calc(${p(b.scen)} - 1px)`, background: COLORS.brandSoft }} />}
        {b.mark && <div className="absolute top-0 w-px h-4 bg-text" style={{ left: p(b.mark.v) }} title={b.mark.l} />}
      </div>
      <div className="flex justify-between text-10 text-text-3 mt-0.5">
        <span>{b.note}</span>
        {b.mark && <span className="mono">{b.mark.l}</span>}
      </div>
    </div>
  );
}

export function Vulnerability() {
  const o = useModel();
  const coef = useStore((s) => s.coef);
  const base = useMemo(() => +runModel(DEFAULT_SCENARIO, coef).cover.toFixed(2), [coef]);
  const L: B[] = [
    { l: "Current account deficit, % GDP", v: 0.6, scen: +o.cad.toFixed(2), mark: { v: 4.8, l: "| 2013: 4.8%" }, min: 0, max: 5.5, bands: [0, 1.5, 2.5], upBad: true, unit: "%", d: 1, note: "Plan-failure line 2.5%" },
    { l: "CPI inflation, %", v: 5.54, scen: +o.cpi.toFixed(2), mark: { v: 4, l: "| target 4%" }, min: 2, max: 8, bands: [2, 4, 6], upBad: true, unit: "%", d: 2, note: "RBI band 2–6%" },
    { l: "Import cover, months (usable)", v: base, scen: +o.cover.toFixed(2), min: 3, max: 10, bands: [3, 5, 6.5], upBad: false, unit: " mo", d: 2, note: "After the forward book" },
    { l: "Combined fiscal deficit, % GDP", v: headline.combinedFiscal, mark: { v: 4, l: "| goal < 4%" }, min: 0, max: 10, bands: [0, 4, 7], upBad: true, unit: "%", d: 1, note: "FY26" },
  ];
  const R: B[] = [
    { l: "Short-term debt, % of reserves", v: headline.stDebtPctReserves, min: 0, max: 60, bands: [0, 20, 40], upBad: true, unit: "%", d: 0, note: "External debt $778B" },
    { l: "One-year dues, % of reserves", v: headline.oneYearDuesPctReserves, min: 0, max: 100, bands: [0, 40, 70], upBad: true, unit: "%", d: 1, note: "Debt due within 12 months" },
    { l: "Reserves to external debt, %", v: 86, mark: { v: 91, l: "| was 91%" }, min: 50, max: 120, bands: [50, 80, 100], upBad: false, unit: "%", d: 0, note: "Falling cushion" },
    { l: "Foreign stake in Indian equities, %", v: 14.7, mark: { v: 15, l: "| goal > 15%" }, min: 10, max: 20, bands: [10, 13, 15], upBad: false, unit: "%", d: 1, note: "14-year low" },
  ];
  return (
    <Panel className="col-span-12" letter="f" title="Vulnerability dashboard · how close to the line" right={<span className="flex items-center gap-3 text-11 text-text-3"><span className="flex items-center gap-1.5"><span className="w-4 h-1 bg-text-2" />Today</span><span className="flex items-center gap-1.5"><span className="w-[3px] h-3 bg-brand-soft" />Your scenario</span></span>} source="Deck data; bands are team judgement except the RBI CPI band and the 2.5% plan-failure line" stamp="Bullet charts">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
        <div>{L.map((b) => <Bullet key={b.l} b={b} />)}</div>
        <div>{R.map((b) => <Bullet key={b.l} b={b} />)}</div>
      </div>
    </Panel>
  );
}
