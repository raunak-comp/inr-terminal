"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { brent2026, events, liquidity, rupeeAnchors, reservesWeekly } from "@/lib/data/deck";
import { useStore } from "@/lib/store";
import { dayMonth, num, shortDate, signed } from "@/lib/format";
import { EChart, axisBase, tooltipBase, type EOption } from "@/components/charts/EChart";
import { COLORS, alpha } from "@/components/charts/theme";
import { Panel } from "@/components/ui/Panel";

const DETAIL: Record<string, { what: string; tone: "bad" | "good" | "neutral" }> = {
  "2026-03-02": { what: "The Strait of Hormuz closes. Brent races from $73 towards $118 by end-March; India's oil bill balloons.", tone: "bad" },
  "2026-05-15": { what: "Foreign money flees and the oil bill bites. The rupee hits its record low of ₹96.96.", tone: "bad" },
  "2026-07-01": { what: "A ceasefire. Brent falls back to about $72 and pressure on the rupee eases.", tone: "good" },
  "2026-09-15": { what: "The Fed hikes to 3.75–4.00%. Higher US yields pull portfolio money out of India again.", tone: "bad" },
  "2026-10-07": { what: "The RBI hikes the repo rate to 5.50% to defend the rupee and anchor prices.", tone: "neutral" },
  "2026-10-22": { what: "RBI dollar sales drain the banks. Liquidity hits ~₹0 and the call rate touches 5.69%.", tone: "bad" },
  "2026-11-06": { what: "US midterms settle nerves: $4B of foreign money returns in a week. The rupee rebounds to ₹93.8.", tone: "good" },
};
const LIQ_DATES = ["2026-02-27", "2026-03-23", "2026-09-07", "2026-10-22", "2026-11-06"];

const interp = (pts: [string, number][], d: string) => {
  if (d <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (d <= pts[i][0]) {
      const t0 = Date.parse(pts[i - 1][0]), t1 = Date.parse(pts[i][0]), t = Date.parse(d);
      return pts[i - 1][1] + ((pts[i][1] - pts[i - 1][1]) * (t - t0)) / (t1 - t0);
    }
  }
  return pts[pts.length - 1][1];
};

type Frame = { d: string; inr: number; brent: number; res: number; liq: number };

function useFrames() {
  const f = useStore((s) => s.feeds.usdinr);
  const live = f.status !== "snapshot" && f.series.length > 50;
  const frames = useMemo(() => {
    const out: Frame[] = [];
    const brent = brent2026.map((b) => [b.date, b.value] as [string, number]);
    const res = reservesWeekly;
    const liq = liquidity.map((l, i) => [LIQ_DATES[i], l[1]] as [string, number]);
    const rup = rupeeAnchors.map((a) => [a.date, a.value] as [string, number]);
    const series = live ? f.series : [];
    let j = 0;
    let lastInr = live ? series[0][1] : rup[0][1];
    for (let t = Date.parse("2026-01-01T00:00:00Z"); t <= Date.parse("2026-11-10T00:00:00Z"); t += 86400000) {
      const dt = new Date(t);
      if (dt.getUTCDay() === 0 || dt.getUTCDay() === 6) continue;
      const d = dt.toISOString().slice(0, 10);
      if (live) {
        while (j < series.length && series[j][0] <= d) lastInr = series[j++][1];
      } else lastInr = interp(rup, d);
      out.push({ d, inr: lastInr, brent: interp(brent, d), res: interp(res, d), liq: interp(liq, d) });
    }
    return out;
  }, [live, f.series]);
  return { frames, live };
}

export function Replay() {
  const { frames, live } = useFrames();
  const N = frames.length;
  const [i, setI] = useState(N - 1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setI((x) => Math.min(N - 1, x + 1)), 110 / speed);
    return () => clearInterval(iv);
  }, [playing, speed, N]);
  useEffect(() => {
    if (playing && i >= N - 1) setPlaying(false);
  }, [i, N, playing]);
  const fr = frames[Math.min(i, N - 1)];
  const passed = events.filter((e) => e.date <= fr.d);
  const latest = passed[passed.length - 1];
  const idxOf = (d: string) => Math.max(0, frames.findIndex((x) => x.d >= d));
  const play = () => {
    if (i >= N - 1) setI(0);
    setPlaying((p) => !p);
  };

  const main = useMemo<EOption>(() => {
    const dates = frames.map((x) => x.d);
    const ev = events.filter((e) => e.date <= fr.d);
    return {
      animation: false,
      grid: { left: 8, right: 52, top: 26, bottom: 24 },
      tooltip: { ...tooltipBase, trigger: "axis", formatter: (ps: { dataIndex: number; value: number | null }[]) => (ps[0].value == null ? "" : `${shortDate(dates[ps[0].dataIndex])}<br/><b style="color:${COLORS.text};font-weight:500">₹${num(ps[0].value as number)}</b>`) },
      xAxis: { type: "category", data: dates, boundaryGap: false, ...axisBase, splitLine: { show: false }, axisLabel: { ...axisBase.axisLabel, interval: (k: number) => dates[k].endsWith("-01") || (k > 0 && dates[k].slice(5, 7) !== dates[k - 1].slice(5, 7)), formatter: (v: string) => new Date(v + "T00:00:00Z").toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }) } },
      yAxis: { type: "value", position: "right", min: 84, max: 100, ...axisBase, axisLine: { show: false } },
      series: [
        {
          type: "line", data: frames.map((x, k) => (k <= i ? +x.inr.toFixed(2) : null)), symbol: "none", lineStyle: { color: COLORS.brandSoft, width: 1.75 }, areaStyle: { color: alpha(COLORS.brandSoft, 0.08), origin: "start" },
          markLine: {
            silent: true, symbol: "none",
            data: [
              { yAxis: 100, lineStyle: { color: COLORS.neg, type: [4, 4] }, label: { formatter: "₹100", color: COLORS.neg, fontSize: 10, position: "insideStartTop" } },
              ...ev.map((e) => ({ xAxis: e.date >= dates[0] ? dates[idxOf(e.date)] : dates[0], lineStyle: { color: DETAIL[e.date]?.tone === "good" ? alpha(COLORS.pos, 0.5) : alpha(COLORS.neg, 0.45), type: [2, 3] }, label: { formatter: String(events.indexOf(e) + 1), color: COLORS.text2, fontSize: 10, position: "end" } })),
            ],
          },
          markPoint: { symbol: "circle", symbolSize: 8, itemStyle: { color: COLORS.text }, label: { show: true, position: "left", color: COLORS.text, fontSize: 11, formatter: `₹${num(fr.inr)}`, distance: 8 }, data: [{ coord: [fr.d, +fr.inr.toFixed(2)] }] },
        },
      ],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames, i, fr]);

  const scatter = useMemo<EOption>(() => {
    const wk = frames.filter((_, k) => k <= i && (k % 5 === 0 || k === i));
    return {
      animation: false,
      grid: { left: 44, right: 16, top: 16, bottom: 36 },
      tooltip: { show: false },
      xAxis: { type: "value", min: 65, max: 125, name: "Brent $/bbl", nameLocation: "middle", nameGap: 24, nameTextStyle: { color: COLORS.text3, fontSize: 10 }, ...axisBase },
      yAxis: { type: "value", min: 86, max: 98, name: "USD/INR", nameTextStyle: { color: COLORS.text3, fontSize: 10, align: "left" }, ...axisBase, axisLine: { show: false } },
      series: [
        { type: "line", data: wk.map((x) => [+x.brent.toFixed(1), +x.inr.toFixed(2)]), symbol: "circle", symbolSize: 3, lineStyle: { color: alpha(COLORS.warn, 0.6), width: 1 }, itemStyle: { color: alpha(COLORS.warn, 0.6) } },
        { type: "scatter", data: [[+fr.brent.toFixed(1), +fr.inr.toFixed(2)]], symbolSize: 10, itemStyle: { color: COLORS.text }, label: { show: true, position: "right", color: COLORS.text2, fontSize: 10, formatter: dayMonth(fr.d) } },
      ],
    };
  }, [frames, i, fr]);

  const mini = (key: "brent" | "res" | "liq", color: string, min: number, max: number): EOption => ({
    animation: false,
    grid: { left: 0, right: 0, top: 4, bottom: 0 },
    xAxis: { type: "category", show: false, data: frames.map((x) => x.d), boundaryGap: false },
    yAxis: { type: "value", show: false, min, max },
    series: [{ type: "line", data: frames.map((x, k) => (k <= i ? +x[key].toFixed(2) : null)), symbol: "none", lineStyle: { color, width: 1.5 }, areaStyle: { color: alpha(color, 0.1), origin: "start" } }],
  });
  const minis = useMemo(() => [mini("brent", COLORS.warn, 60, 125), mini("res", COLORS.s2, 680, 800), mini("liq", COLORS.brandSoft, -2, 13)], [frames, i]); // eslint-disable-line react-hooks/exhaustive-deps
  const startInr = frames[0].inr;

  return (
    <>
      <section className="panel col-span-12">
        <div className="flex flex-wrap items-center gap-3 px-3 py-2.5">
          <div className="flex items-center gap-1">
            <button className="btn h-[30px] w-[30px] justify-center px-0" onClick={() => { setPlaying(false); setI(0); }} aria-label="Back to start"><SkipBack size={14} /></button>
            <button className="btn primary h-[30px] w-[86px] justify-center" onClick={play} aria-label={playing ? "Pause" : "Play"}>{playing ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}</button>
            <button className="btn h-[30px] w-[30px] justify-center px-0" onClick={() => { const nx = events.find((e) => e.date > fr.d); setI(nx ? idxOf(nx.date) : N - 1); }} aria-label="Next event"><SkipForward size={14} /></button>
          </div>
          <div className="seg w-[132px]" role="radiogroup" aria-label="Speed">
            {[1, 2, 4].map((s) => <button key={s} role="radio" aria-checked={speed === s} data-active={speed === s} onClick={() => setSpeed(s)}>{s}×</button>)}
          </div>
          <div className="mono text-20 text-text w-[150px] whitespace-nowrap">{shortDate(fr.d)}</div>
          <div className="relative flex-1 min-w-[260px] h-8">
            <div className="absolute inset-x-0 top-[15px] h-[2px] bg-border" />
            <div className="absolute left-0 top-[15px] h-[2px] bg-brand" style={{ width: `${(i / (N - 1)) * 100}%` }} />
            {events.map((e, k) => (
              <button key={e.date} className="absolute top-[9px] w-[14px] h-[14px] -ml-[7px] flex items-center justify-center mono text-[9px] border transition-colors duration-150" title={e.label}
                style={{ left: `${(idxOf(e.date) / (N - 1)) * 100}%`, background: e.date <= fr.d ? COLORS.panel2 : COLORS.panel, borderColor: e.date <= fr.d ? COLORS.text3 : COLORS.border, color: e.date <= fr.d ? COLORS.text : COLORS.text3, borderRadius: 2 }}
                onClick={() => { setPlaying(false); setI(idxOf(e.date)); }}>{k + 1}</button>
            ))}
            <input type="range" aria-label="Scrub timeline" min={0} max={N - 1} value={i} onChange={(e) => { setPlaying(false); setI(+e.target.value); }} className="absolute inset-x-0 top-0 h-3 w-full opacity-0 cursor-ew-resize" />
          </div>
        </div>
      </section>
      <Panel className="col-span-12 xl:col-span-8" letter="a" title={<>USD/INR · 2026 · <strong>{live ? "daily ECB reference rate" : "interpolated between deck anchor points"}</strong></>} right={<span className={`mono text-12 ${fr.inr > startInr ? "c-neg" : "c-pos"}`}>{signed(((fr.inr / startInr) - 1) * 100, 1)}% YTD</span>} source={live ? "ECB reference rates via Frankfurter" : "Team deck anchor points"} stamp="Numbers mark events" flush>
        <div className="px-1 pt-1"><EChart option={main} height={330} /></div>
      </Panel>
      <Panel className="col-span-12 xl:col-span-4" letter="b" title="Event tape" right={<span className="mono text-11 text-text-3">{passed.length} / {events.length}</span>} source="Team deck timeline" stamp="Newest first" flush>
        <ul className="max-h-[362px] overflow-y-auto">
          <AnimatePresence initial={false}>
            {[...passed].reverse().map((e) => {
              const det = DETAIL[e.date];
              const isNew = latest?.date === e.date;
              return (
                <motion.li key={e.date} layout initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className={`px-3 py-2.5 border-b border-border ${isNew ? "bg-panel-2" : ""}`}>
                  <div className="flex items-center gap-2 mono text-10 text-text-3">
                    <span className="text-text-2">{events.indexOf(e) + 1}</span>
                    <span>{shortDate(e.date)}</span>
                    <span className={`ml-auto tag ${det?.tone === "good" ? "ok" : det?.tone === "bad" ? "trig" : ""}`}>{det?.tone === "good" ? "Relief" : det?.tone === "bad" ? "Shock" : "Policy"}</span>
                  </div>
                  <div className="text-13 text-text mt-1">{e.label}</div>
                  {isNew && det && <div className="text-12 text-text-3 mt-0.5 leading-[1.45]">{det.what}</div>}
                </motion.li>
              );
            })}
          </AnimatePresence>
          {passed.length === 0 && <li className="px-3 py-6 text-12 text-text-3">Press Play. Events appear here as the year unfolds.</li>}
        </ul>
      </Panel>
      <Panel className="col-span-12 xl:col-span-5" letter="c" title="Oil versus rupee · the trajectory" source="Team deck anchors; weekly samples" stamp="Connected scatter">
        <EChart option={scatter} height={250} />
      </Panel>
      <Panel className="col-span-12 xl:col-span-7" letter="d" title="The other gauges, in sync" source="Team deck data points; linear between them" stamp={shortDate(fr.d)} flush>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {[
            { l: "Brent crude", v: `$${num(fr.brent, 1)}`, s: "Oil-shock tripwire $120", c: fr.brent > 110 ? "c-neg" : "text-text" },
            { l: "FX reserves", v: `$${num(fr.res, 1)}B`, s: "RBI weekly", c: "text-text" },
            { l: "Bank liquidity", v: `₹${num(fr.liq, 1)}L Cr`, s: "Surplus (+) / deficit (−)", c: fr.liq <= 0.3 ? "c-neg" : "text-text" },
          ].map((t, k) => (
            <div key={t.l} className="p-3">
              <div className="text-11 text-text-3">{t.l}</div>
              <div className={`mono text-20 mt-1 ${t.c}`}>{t.v}</div>
              <div className="text-10 text-text-3">{t.s}</div>
              <div className="mt-2"><EChart option={minis[k]} height={150} /></div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
