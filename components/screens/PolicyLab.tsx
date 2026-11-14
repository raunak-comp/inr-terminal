"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import { answer, idealRupee, limits, playbook, roadmap, scorecard, SNAPSHOT_DATE, tripwires } from "@/lib/data/deck";
import { inr, shortDate } from "@/lib/format";
import { useModel } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { EChart, type EOption } from "@/components/charts/EChart";
import { COLORS } from "@/components/charts/theme";
import { Panel } from "@/components/ui/Panel";
import { Tip } from "@/components/ui/Tip";

const [LO, HI] = [75, 100];
const ZONE_COLORS: Record<string, string> = { "Too weak": COLORS.neg, Risky: COLORS.warn, IDEAL: COLORS.brand, "Too strong": COLORS.s2 };

export function IdealGauge() {
  const f = useStore((s) => s.feeds.usdinr);
  const live = f.status !== "snapshot";
  const v = f.value;
  const option = useMemo<EOption>(() => {
    const zones = [...idealRupee.zones].sort((a, b) => a.to - b.to); // ascending from 75
    const stops = zones.map((z) => [(Math.max(z.from, z.to) - LO) / (HI - LO), ZONE_COLORS[z.label]] as [number, string]);
    return {
      series: [
        {
          type: "gauge",
          startAngle: 0,
          endAngle: 180,
          clockwise: false,
          min: LO,
          max: HI,
          radius: "150%",
          center: ["50%", "94%"],
          splitNumber: 5,
          axisLine: { lineStyle: { width: 12, color: stops } },
          pointer: { length: "64%", width: 3, itemStyle: { color: COLORS.text } },
          anchor: { show: true, size: 9, itemStyle: { color: COLORS.text, borderColor: COLORS.panel, borderWidth: 2 } },
          axisTick: { show: false },
          splitLine: { length: 12, distance: -12, lineStyle: { color: COLORS.panel, width: 2 } },
          axisLabel: { distance: 18, color: COLORS.text3, fontSize: 10, formatter: (x: number) => `₹${x}` },
          detail: { show: false },
          data: [{ value: Math.min(HI, Math.max(LO, v)) }],
        },
      ],
    };
  }, [v]);
  return (
    <Panel className="col-span-12 lg:col-span-5 2xl:col-span-4" letter="a" title="Ideal rupee" right={<span className={`tag ${live ? "ok" : ""}`}>{live ? "Live needle" : "Snapshot"}</span>} source="Team analysis: REER-anchored fair value" stamp={`Needle ${inr(v)} · ${shortDate(live ? f.asOf : SNAPSHOT_DATE)}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-20 text-text">
            Ideal: <span className="mono c-brand">₹{idealRupee.ideal[0]}–{idealRupee.ideal[1]}</span> per $
          </div>
          <div className="text-12 text-text-3">REER {idealRupee.reerEquilibrium} equilibrium · gap to ideal {idealRupee.gap}</div>
        </div>
      </div>
      <EChart option={option} height={150} className="mt-2" />
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-3 text-11">
        {idealRupee.zones.map((z) => (
          <span key={z.label + z.from} className="flex items-center gap-1.5 text-text-3">
            <span className="w-2 h-2" style={{ background: ZONE_COLORS[z.label] }} />
            {z.label === "IDEAL" ? <span className="text-text">IDEAL</span> : z.label} <span className="mono">{z.from}–{z.to}</span>
          </span>
        ))}
      </div>
    </Panel>
  );
}

export function ZoneTable() {
  const { columns, rows } = idealRupee.comparison;
  return (
    <Panel className="col-span-12 lg:col-span-7 2xl:col-span-8" letter="b" title="Three rupee zones compared" flush source="Team deck: Ideal Value slide" stamp={idealRupee.result}>
      <table className="tbl">
        <thead>
          <tr>
            <th className="w-[22%]">₹ per $</th>
            {columns.map((c, i) => (
              <th key={c} className={i === 1 ? "text-brand-soft! bg-brand/10!" : ""}>
                {c} {i === 1 && <span className="tag brand ml-1">Ideal</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, ...cells]) => (
            <tr key={label}>
              <td className="text-text">{label}</td>
              {cells.map((c, i) => (
                <td key={i} className={i === 1 ? "bg-brand/10 text-text" : ""}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid grid-cols-2 xl:grid-cols-4 border-t border-border">
        {idealRupee.road.map((r, i) => (
          <div key={i} className="px-3 py-2 border-r border-border last:border-r-0 text-11 text-text-2">
            <span className="mono text-text-3 mr-1.5">0{i + 1}</span>
            {r}
          </div>
        ))}
      </div>
    </Panel>
  );
}

const LINKS: Record<string, string | null> = {
  "Big dollar sales": "/?rbi=50",
  "Sharp rate hikes": "/?repo=75",
  "FX curbs & controls": "/?curbs=1",
  "Gold import curbs": null,
  "Free float": "/?rbi=0&curbs=0",
  "Our blend": "/?preset=plan",
};

function Squares({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-[3px]" aria-label={`${n} of 3`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`w-[10px] h-[10px] ${i < n ? "bg-text-2" : "bg-panel-2 border border-border-2"}`} />
      ))}
    </span>
  );
}

export function Scorecard() {
  const router = useRouter();
  return (
    <Panel className="col-span-12 xl:col-span-7" letter="c" title="Policy scorecard" right={<span className="text-11 text-text-3">Click an option to load it in the Stress Engine</span>} flush source="Team scoring, 0–3 per criterion" stamp="Max 15">
      <table className="tbl">
        <thead>
          <tr>
            <th>Option</th>
            {scorecard.criteria.map((c) => <th key={c} className="text-center!">{c}</th>)}
            <th className="num">Total</th>
            <th className="hidden 2xl:table-cell">Opportunity cost</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {scorecard.options.map((o) => {
            const href = LINKS[o.name];
            const row = (
              <>
                <td className={`whitespace-nowrap ${o.ours ? "text-brand-soft font-medium" : "text-text"}`} title={o.cost}>{o.name}</td>
                {o.s.map((v, i) => <td key={i} className="text-center"><Squares n={v} /></td>)}
                <td className={`num ${o.ours ? "c-brand" : ""}`}>{o.total}</td>
                <td className="text-11 max-w-[220px] truncate hidden 2xl:table-cell" title={o.cost}>{o.cost}</td>
                <td className="w-6 text-text-3">{href ? <ArrowUpRight size={14} strokeWidth={1.5} /> : null}</td>
              </>
            );
            return href ? (
              <tr key={o.name} className={`cursor-pointer ${o.ours ? "bg-brand/12" : ""}`} onClick={() => router.push(href)}>
                {row}
              </tr>
            ) : (
              <Tip key={o.name} content="No direct lever in the model: gold curbs act through smuggling and the import basket.">
                <tr>{row}</tr>
              </Tip>
            );
          })}
        </tbody>
      </table>
      <div className="flex gap-2 px-3 py-2 border-t border-border">
        {scorecard.options.filter((o) => LINKS[o.name]).map((o) => (
          <Link key={o.name} href={LINKS[o.name]!} className={`btn h-[24px] text-11 ${o.ours ? "primary" : ""}`}>
            {o.name} <ArrowUpRight size={12} strokeWidth={1.5} />
          </Link>
        ))}
      </div>
    </Panel>
  );
}

export function TripwireTable() {
  const o = useModel();
  const keys = ["oil", "fed", "book", "cpi"];
  return (
    <Panel className="col-span-12" letter="f" title="Tripwires · watch and act" flush source="Team deck risk register" stamp="Status from active scenario">
      <table className="tbl">
        <thead>
          <tr><th>Risk</th><th>Watch</th><th>Act</th><th className="num">Status</th></tr>
        </thead>
        <tbody>
          {tripwires.map((t, i) => {
            const st = o.trips.find((x) => x.key === keys[i])?.status ?? "OK";
            return (
              <tr key={t.name}>
                <td className="text-text py-2 align-top">
                  {t.name}
                  <div className={`text-10 mono mt-0.5 ${t.severity === "HIGH" ? "c-neg" : t.severity === "LIKELY" ? "c-warn" : "text-text-3"}`}>{t.severity}</div>
                </td>
                <td className="text-11 py-2 align-top">{t.watch}</td>
                <td className="text-11 py-2 align-top">{t.act}</td>
                <td className="num py-2 align-top"><span className={`tag ${st === "TRIGGERED" ? "trig" : st === "WATCH" ? "watch" : "ok"}`}>{st}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}

const OWNER_COLOR = (o: string) => (o.startsWith("Govt + RBI") ? "bg-brand-soft" : o.startsWith("Govt") ? "bg-series-2" : "bg-brand");

export function Roadmap() {
  const ticks = [
    { m: 0, l: "Now" }, { m: 3, l: "3m" }, { m: 6, l: "6m" }, { m: 12, l: "1y" }, { m: 18, l: "18m" }, { m: 24, l: "2y" }, { m: 36, l: "3y" },
  ];
  const x = (m: number) => `${(m / 36) * 100}%`;
  return (
    <Panel className="col-span-12 xl:col-span-8" letter="e" title="Phased roadmap · P1–P4" right={
      <div className="flex gap-3 text-11 text-text-3">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-brand" />RBI</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-series-2" />Govt</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-brand-soft" />Govt + RBI</span>
      </div>
    } source="Team deck: Policy & Risks" stamp="Months from now">
      <div className="grid grid-cols-4 gap-px bg-border border border-border rounded-sm mb-3">
        {playbook.map((p) => (
          <div key={p.p} className="bg-panel p-2.5">
            <div className="flex items-center justify-between">
              <span className="mono text-11 c-brand">P{p.p}</span>
              <span className="text-10 text-text-3">{p.when}</span>
            </div>
            <div className="text-13 text-text mt-1">{p.title}</div>
            <div className="text-11 text-text-2 mt-0.5 leading-[1.45]">{p.what}</div>
            <div className="text-10 text-text-3 mt-1.5">{p.who} · {p.why}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[minmax(0,210px)_minmax(0,1fr)_minmax(0,150px)] gap-x-3">
        <div />
        <div className="relative h-5">
          {ticks.map((t) => (
            <span key={t.m} className="absolute -translate-x-1/2 mono text-10 text-text-3 first:translate-x-0" style={{ left: x(t.m) }}>{t.l}</span>
          ))}
        </div>
        <div className="text-10 text-text-3 tracking-[0.08em]">YEAR-3 TARGET</div>
        {roadmap.map((r, i) => (
          <div key={i} className="contents">
            <div className="h-9 flex flex-col justify-center border-t border-border min-w-0">
              <span className="text-12 text-text truncate"><span className="mono text-10 text-text-3 mr-1.5">{r.pr}</span>{r.action}</span>
              <span className="text-10 text-text-3 truncate">{r.owner}</span>
            </div>
            <div className="relative h-9 border-t border-border">
              {ticks.map((t) => <span key={t.m} className="absolute inset-y-0 w-px bg-grid" style={{ left: x(t.m) }} />)}
              <span className={`absolute top-1/2 -translate-y-1/2 h-[10px] ${OWNER_COLOR(r.owner)}`} style={{ left: x(r.start), width: `calc(${x(r.end - r.start)})` }} />
            </div>
            <div className="h-9 flex items-center border-t border-border text-11 text-text-2 truncate">{r.target}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function OurAnswer() {
  return (
    <Panel className="col-span-12 xl:col-span-4" letter="g" title="Our answer" source="Team deck: conclusion" stamp="₹100 is a milestone, not a cliff">
      <div className="flex flex-col">
        {answer.map((a, i) => (
          <div key={a.title} className="grid grid-cols-[24px_1fr] gap-2 py-2.5 border-b border-border last:border-b-0">
            <span className="mono text-11 c-brand pt-0.5">0{i + 1}</span>
            <div>
              <div className="text-16 text-text">{a.title}</div>
              <div className="text-12 text-text-2 mt-0.5">{a.text}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 border border-border rounded-sm">
        <div className="px-2.5 h-7 flex items-center text-10 tracking-[0.1em] text-text-3 border-b border-border">LIMITS OF OUR PLAN</div>
        <ul className="px-2.5 py-2 flex flex-col gap-1">
          {limits.map((l, i) => (
            <li key={l} className={`text-11 ${i === 0 ? "c-warn" : "text-text-3"}`}>
              <span className="mono mr-1.5">{String.fromCharCode(97 + i)}</span>
              {l}
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}
