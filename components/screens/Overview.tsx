"use client";
import { useMemo, useState } from "react";
import { brent2026, events, fpiKpis, fpiMonthly, headline, importBasketFY26, liquidity, outflowDriversQ1FY27, reservesWeekly, ticker, twinDeficits } from "@/lib/data/deck";
import { dayMonth, num, shortDate, signed, usdB } from "@/lib/format";
import { useStore } from "@/lib/store";
import { EChart, axisBase, tooltipBase, type EOption } from "@/components/charts/EChart";
import { TimeChart, type TimePoint } from "@/components/charts/TimeChart";
import { COLORS, alpha } from "@/components/charts/theme";
import { Panel } from "@/components/ui/Panel";
import { Tabs } from "@/components/ui/Controls";

const TF = ["1M", "3M", "6M", "YTD", "1Y"] as const;
type TFk = (typeof TF)[number];

function fromDate(last: string, tf: TFk) {
  const d = new Date(last + "T00:00:00Z");
  if (tf === "YTD") return `${d.getUTCFullYear()}-01-01`;
  const m = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12 }[tf];
  d.setUTCMonth(d.getUTCMonth() - m);
  return d.toISOString().slice(0, 10);
}

function EventLegend({ from }: { from?: string }) {
  return (
    <ol className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 border-t border-border text-11 text-text-3">
      {events.map((e, i) => (
        <li key={e.date} className={from && e.date < from ? "opacity-40" : ""}>
          <span className="mono text-text-2 mr-1">{i + 1}</span>
          {e.label} <span className="mono">· {dayMonth(e.date)}</span>
        </li>
      ))}
    </ol>
  );
}

export function KpiRow() {
  const items = [
    { l: "Record low", v: `₹${num(headline.recordLow)}`, s: headline.recordLowWhen, tone: "neg" },
    { l: "Merchandise gap", v: usdB(headline.tradeGapB), s: "FY26", tone: "neg" },
    { l: "Combined fiscal deficit", v: `${num(headline.combinedFiscal, 1)}%`, s: "of GDP, FY26", tone: "warn" },
    { l: "Current account", v: `${num(headline.cadPctGDP, 1)}%`, s: "of GDP vs 4.8% in 2013", tone: "pos" },
    { l: "US–India spread", v: `${headline.spreadBps} bps`, s: "10Y, did not stop outflows", tone: "flat" },
    { l: "REER", v: num(ticker.reer, 1), s: "40-currency, Sep 2026", tone: "flat" },
  ];
  return (
    <section className="panel col-span-12">
      <div className="kpi-grid kpi-6">
        {items.map((k) => (
          <div key={k.l} className="kpi">
            <span className="kpi-l">{k.l}</span>
            <span className={`kpi-v text-20! ${k.tone === "neg" ? "c-neg" : k.tone === "pos" ? "c-pos" : k.tone === "warn" ? "c-warn" : ""}`}>{k.v}</span>
            <span className="text-11 text-text-3 truncate">{k.s}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RupeeChart() {
  const f = useStore((s) => s.feeds.usdinr);
  const [tf, setTf] = useState<TFk>("1Y");
  const live = f.status !== "snapshot";
  const data: TimePoint[] = f.series;
  const from = live && data.length ? fromDate(data[data.length - 1][0], tf) : undefined;
  const refs = useMemo(() => [{ price: 100, label: "₹100", color: COLORS.neg }], []);
  return (
    <Panel
      className="col-span-12 2xl:col-span-8"
      letter="a"
      title={<>USD/INR · <strong>{live ? "daily ECB reference rate" : "anchor points, not daily data"}</strong></>}
      right={live ? <Tabs options={[...TF]} value={tf} onChange={setTf} /> : <span className="tag">Snapshot</span>}
      flush
      source={live ? "ECB reference rates via Frankfurter" : "Team deck anchor points"}
      stamp={`As of ${shortDate(f.asOf)}`}
    >
      <div className="px-1 pt-2">
        <TimeChart data={data} height={260} events={live ? events : []} refLines={refs} from={from} anchors={!live} unit="₹" />
      </div>
      <EventLegend from={data[0]?.[0]} />
    </Panel>
  );
}

export function BrentChart() {
  const f = useStore((s) => s.feeds.brent);
  const live = f.status !== "snapshot";
  const data: TimePoint[] = live ? f.series.filter(([d]) => d >= "2026-01-01") : brent2026.map((b) => [b.date, b.value]);
  const refs = useMemo(() => [{ price: 120, label: "Tripwire $120", color: COLORS.warn }], []);
  return (
    <Panel
      className="col-span-12 2xl:col-span-4"
      letter="b"
      title={<>Brent 2026 · <strong>{live ? "daily" : "anchor points"}</strong></>}
      right={<span className={`tag ${live ? "ok" : ""}`}>{live ? "Live" : "Snapshot"}</span>}
      flush
      source={live ? "FRED · DCOILBRENTEU" : "Team deck"}
      stamp={`$/bbl · ${shortDate(f.asOf)}`}
    >
      <div className="px-1 pt-2">
        <TimeChart data={data} height={live ? 260 : 222} color={COLORS.warn} area={false} events={live ? events : []} refLines={refs} anchors={!live} decimals={1} unit="$" />
      </div>
      {!live && (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 px-3 py-2 border-t border-border text-11">
          {brent2026.map((b) => (
            <li key={b.date} className="flex justify-between">
              <span className="text-text-3">{b.label ?? "Pre-shock"} · {dayMonth(b.date)}</span>
              <span className="mono text-text">${num(b.value, 1)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function bars(cats: string[], vals: number[], opt: { color?: (v: number) => string; unit?: string; trend?: boolean; d?: number; min?: number }): EOption {
  const d = opt.d ?? 1;
  const series: unknown[] = [
    {
      type: "bar",
      data: vals.map((v) => ({ value: v, itemStyle: { color: opt.color ? opt.color(v) : COLORS.brandSoft } })),
      barWidth: "56%",
      label: { show: vals.length <= 9, position: "top", color: COLORS.text3, fontSize: 10, formatter: (p: { value: number }) => num(p.value, d) },
    },
  ];
  if (opt.trend) {
    const n = vals.length;
    const mx = (n - 1) / 2;
    const my = vals.reduce((a, b) => a + b, 0) / n;
    const b = vals.reduce((a, v, i) => a + (i - mx) * (v - my), 0) / vals.reduce((a, _, i) => a + (i - mx) ** 2, 0);
    series.push({ type: "line", data: vals.map((_, i) => +(my + b * (i - mx)).toFixed(2)), symbol: "none", lineStyle: { color: COLORS.text2, width: 1, type: [2, 3] }, silent: true });
  }
  return {
    grid: { left: 40, right: 8, top: 18, bottom: 22 },
    tooltip: { ...tooltipBase, trigger: "axis", axisPointer: { type: "shadow", shadowStyle: { color: "rgba(255,255,255,0.03)" } }, formatter: (ps: { name: string; value: number }[]) => `${ps[0].name}: <b style="color:${COLORS.text};font-weight:500">${num(ps[0].value, d)}${opt.unit ?? ""}</b>` },
    xAxis: { type: "category", data: cats, ...axisBase, axisLabel: { ...axisBase.axisLabel, interval: 0, fontSize: 10 } },
    yAxis: { type: "value", ...axisBase, axisLine: { show: false }, min: opt.min, scale: opt.min === undefined ? false : true },
    series,
  };
}

export function ReservesChart() {
  const option = useMemo<EOption>(() => ({
    grid: { left: 40, right: 12, top: 18, bottom: 22 },
    tooltip: { ...tooltipBase, trigger: "axis", axisPointer: { type: "line", lineStyle: { color: "#3A3A44", type: "dashed" } }, formatter: (ps: { name: string; value: number }[]) => `${ps[0].name}: <b style="color:${COLORS.text};font-weight:500">$${num(ps[0].value, 1)}B</b>` },
    xAxis: { type: "category", data: reservesWeekly.map((r) => dayMonth(r[0])), boundaryGap: false, ...axisBase, splitLine: { show: false }, axisLabel: { ...axisBase.axisLabel, fontSize: 10 } },
    yAxis: { type: "value", min: 670, max: 800, ...axisBase, axisLine: { show: false } },
    series: [{
      type: "line", data: reservesWeekly.map((r) => r[1]), symbol: "circle", symbolSize: 5, lineStyle: { color: COLORS.s2, width: 1.75 }, itemStyle: { color: COLORS.s2 }, areaStyle: { color: alpha(COLORS.s2, 0.1) },
      markPoint: { symbol: "pin", symbolSize: 0, label: { show: true, color: COLORS.text2, fontSize: 10, formatter: (p: { value: number; name: string }) => `${p.name} $${num(p.value, 1)}B`, offset: [0, -10] }, data: (() => { const v = reservesWeekly.map((r) => r[1]); const hi = v.indexOf(Math.max(...v)); const lo = v.indexOf(Math.min(...v)); return [{ name: "Peak", coord: [dayMonth(reservesWeekly[hi][0]), v[hi]], value: v[hi] }, { name: "Low", coord: [dayMonth(reservesWeekly[lo][0]), v[lo]], value: v[lo] }]; })() },
      markLine: { silent: true, symbol: "none", data: [{ yAxis: 734.6 }], lineStyle: { color: COLORS.border2, type: [3, 3] }, label: { formatter: "Model start $734.6B", color: COLORS.text3, fontSize: 10, position: "insideStartTop" } },
    }],
  }), []);
  return (
    <Panel className="col-span-12 lg:col-span-6 2xl:col-span-4" letter="c" title="FX reserves · weekly" source="RBI weekly statistical supplement" stamp="$B · week ending">
      <EChart option={option} height={200} />
    </Panel>
  );
}

export function FpiChart() {
  const option = useMemo<EOption>(() => {
    let c = 0;
    const cum = fpiMonthly.map((r) => +(c += r[1]).toFixed(1));
    return {
      grid: { left: 36, right: 36, top: 18, bottom: 22 },
      tooltip: { ...tooltipBase, trigger: "axis", axisPointer: { type: "shadow", shadowStyle: { color: "rgba(255,255,255,0.03)" } }, formatter: (ps: { name: string; value: number; seriesIndex: number }[]) => `${ps[0].name}<br/>Month <b style="color:${COLORS.text};font-weight:500">${signed(ps[0].value, 1)}B</b><br/>Cumulative <b style="color:${COLORS.text};font-weight:500">${signed(ps[1]?.value ?? 0, 1)}B</b>` },
      xAxis: { type: "category", data: fpiMonthly.map((r) => r[0]), ...axisBase, axisLabel: { ...axisBase.axisLabel, interval: 0, fontSize: 10 } },
      yAxis: [{ type: "value", ...axisBase, axisLine: { show: false } }, { type: "value", ...axisBase, axisLine: { show: false }, splitLine: { show: false }, axisLabel: { ...axisBase.axisLabel, color: COLORS.brandSoft } }],
      series: [
        { type: "bar", data: fpiMonthly.map((r) => ({ value: r[1], itemStyle: { color: r[1] < 0 ? alpha(COLORS.neg, 0.8) : alpha(COLORS.pos, 0.8) } })), barWidth: "50%" },
        { type: "line", yAxisIndex: 1, data: cum, symbol: "none", lineStyle: { color: COLORS.brandSoft, width: 1.5 } },
      ],
    };
  }, []);
  return (
    <Panel className="col-span-12 lg:col-span-6 2xl:col-span-4" letter="d" title="Net FPI equity flow · monthly + cumulative" right={<span className="mono text-11 text-text-3">{fpiKpis.outflowMonths} months out</span>} source="Business Standard; BusinessToday" stamp="$B · line = running total">
      <EChart option={option} height={200} />
    </Panel>
  );
}

export function LiquidityChart() {
  const option = useMemo<EOption>(() => ({
    grid: { left: 36, right: 12, top: 18, bottom: 22 },
    tooltip: { ...tooltipBase, trigger: "axis", formatter: (ps: { name: string; value: number }[]) => `${ps[0].name}: <b style="color:${COLORS.text};font-weight:500">₹${num(ps[0].value, 1)}L Cr</b>` },
    xAxis: { type: "category", data: liquidity.map((r) => r[0]), boundaryGap: false, ...axisBase, splitLine: { show: false }, axisLabel: { ...axisBase.axisLabel, fontSize: 10, interval: 0 } },
    yAxis: { type: "value", ...axisBase, axisLine: { show: false } },
    series: [{
      type: "line", data: liquidity.map((r) => ({ value: r[1], itemStyle: { color: r[1] <= 0 ? COLORS.neg : COLORS.brandSoft } })), step: "middle", symbol: "circle", symbolSize: 6, lineStyle: { width: 1.75, color: COLORS.brandSoft }, areaStyle: { color: alpha(COLORS.brandSoft, 0.1) },
      label: { show: true, position: "top", color: COLORS.text3, fontSize: 10, formatter: (p: { value: number }) => num(p.value, 1) },
    }],
  }), []);
  return (
    <Panel className="col-span-12 lg:col-span-6 2xl:col-span-4" letter="e" title="Banking liquidity" right={<span className="mono text-11 text-text-3">₹ lakh crore</span>} source="ANI / ICICI (10 Nov)" stamp="Surplus (+) / deficit (−)">
      <EChart option={option} height={200} />
    </Panel>
  );
}

function donut(data: [string, number][], centre: string, sub: string, colors: string[]): EOption {
  return {
    tooltip: { ...tooltipBase, trigger: "item", formatter: (p: { name: string; value: number }) => `${p.name}: <b style="color:${COLORS.text};font-weight:500">${p.value}%</b>` },
    series: [
      {
        type: "pie",
        radius: ["62%", "80%"],
        center: ["50%", "50%"],
        padAngle: 1.5,
        itemStyle: { borderColor: COLORS.panel, borderWidth: 1 },
        label: { show: true, position: "center", formatter: () => `{a|${centre}}\n{b|${sub}}`, rich: { a: { color: COLORS.text, fontSize: 20, lineHeight: 24 }, b: { color: COLORS.text3, fontSize: 10, lineHeight: 14 } } },
        emphasis: { scale: false, label: { show: true } },
        labelLine: { show: false },
        data: data.map(([n, v], i) => ({ name: n, value: v, itemStyle: { color: colors[i] } })),
      },
    ],
  };
}

function DonutLegend({ data, colors, total }: { data: [string, number][]; colors: string[]; total?: number }) {
  return (
    <ul className="flex flex-col gap-1.5 text-11 min-w-0">
      {data.map(([n, v], i) => (
        <li key={n} className="grid grid-cols-[8px_1fr_auto] items-center gap-2">
          <span className="w-2 h-2" style={{ background: colors[i] }} />
          <span className="text-text-2 truncate">{n}</span>
          <span className="mono text-text">{v}%{total ? <span className="text-text-3"> · ${num((total * v) / 100, 1)}B</span> : null}</span>
        </li>
      ))}
    </ul>
  );
}

const DONUT = [COLORS.brand, COLORS.brandSoft, COLORS.s2, "#3A3A44"];

export function ImportDonut() {
  const option = useMemo(() => donut(importBasketFY26, "FY26", "import basket", DONUT), []);
  return (
    <Panel className="col-span-12 lg:col-span-6 2xl:col-span-4" letter="f" title="Import basket · share" source="Finnovate: FY26 trade data" stamp="% of imports">
      <div className="grid grid-cols-[150px_1fr] gap-3 items-center">
        <EChart option={option} height={150} />
        <DonutLegend data={importBasketFY26} colors={DONUT} />
      </div>
      <p className="text-11 text-text-3 mt-2">Crude reliance {headline.crudeReliance}% · Q1 oil bill ${num(headline.q1OilBillB, 1)}B · gold ${headline.goldBillB}B</p>
    </Panel>
  );
}

export function OutflowDonut() {
  const { totalB, split } = outflowDriversQ1FY27;
  const option = useMemo(() => donut(split, `$${num(totalB, 1)}B`, "net outflow Q1", DONUT), [split, totalB]);
  return (
    <Panel className="col-span-12 lg:col-span-6 2xl:col-span-4" letter="g" title="Net FX outflow drivers · Q1 FY27" source="RBI: BoP press release Q1 FY27" stamp="% of total">
      <div className="grid grid-cols-[150px_1fr] gap-3 items-center">
        <EChart option={option} height={150} />
        <DonutLegend data={split} colors={DONUT} total={totalB} />
      </div>
      <p className="text-11 text-text-3 mt-2">BoP {signed(headline.bopB)}B · primary income {signed(headline.primaryIncomeB, 1)}B · capital shock {signed(headline.capitalShockB, 1)}B</p>
    </Panel>
  );
}

export function TwinDeficits() {
  const option = useMemo<EOption>(
    () => ({
      grid: { left: 36, right: 40, top: 30, bottom: 22 },
      tooltip: { ...tooltipBase, trigger: "axis", axisPointer: { type: "shadow", shadowStyle: { color: "rgba(255,255,255,0.03)" } } },
      xAxis: { type: "category", data: twinDeficits.map((t) => t.fy), ...axisBase },
      yAxis: [
        { type: "value", name: "Fiscal % GDP", nameTextStyle: { color: COLORS.brandSoft, fontSize: 10, align: "left" }, ...axisBase, axisLine: { show: false }, axisLabel: { ...axisBase.axisLabel, color: COLORS.brandSoft } },
        { type: "value", name: "CAD $B", nameTextStyle: { color: COLORS.s2, fontSize: 10, align: "right" }, ...axisBase, axisLine: { show: false }, splitLine: { show: false }, axisLabel: { ...axisBase.axisLabel, color: COLORS.s2 } },
      ],
      series: [
        { name: "Combined fiscal deficit, % GDP", type: "bar", data: twinDeficits.map((t) => t.fiscal), itemStyle: { color: COLORS.brandSoft }, barWidth: "28%", barGap: "20%" },
        { name: "Current account deficit, $B", type: "bar", yAxisIndex: 1, data: twinDeficits.map((t) => Math.abs(t.cadB)), itemStyle: { color: COLORS.s2 }, barWidth: "28%" },
      ],
    }),
    []
  );
  return (
    <Panel className="col-span-12 lg:col-span-12 2xl:col-span-4" letter="h" title="Twin deficits · FY23–FY27E" source="Livemint: Budget 2026-27; RBI BoP" stamp="Fiscal % GDP · CAD $B">
      <div className="flex gap-4 text-11 mb-1">
        <span className="flex items-center gap-1.5 text-text-2"><span className="w-2 h-2 bg-brand-soft" />Combined fiscal deficit, % GDP</span>
        <span className="flex items-center gap-1.5 text-text-2"><span className="w-2 h-2 bg-series-2" />CAD, $B</span>
      </div>
      <EChart option={option} height={176} />
    </Panel>
  );
}
