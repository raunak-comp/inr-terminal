"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useMemo } from "react";
import { runModel } from "@/lib/model/model";
import { PRESETS } from "@/lib/model/presets";
import { crore, signedUsdB } from "@/lib/format";
import { useModel } from "@/lib/hooks";
import { useStore } from "@/lib/store";

export function NextSteps() {
  const o = useModel();
  const coef = useStore((s) => s.coef);
  const h = useStore((s) => s.scenario.horizon);
  const worst = useMemo(() => PRESETS.map((p) => ({ p, c: runModel({ ...p.scenario, horizon: h }, coef).crisis })).sort((a, b) => b.c - a.c)[0], [coef, h]);
  const cards = [
    { href: "/transmission", k: "02 · TRANSMISSION LAB", t: "Follow the shock", m: `Dollar gap ${signedUsdB(o.totals.unabsorbed)}`, d: "Animated cause-and-effect network, Sankey of dollar flows, sensitivity tornado" },
    { href: "/compare", k: "03 · SCENARIO COMPARE", t: "Seven futures side by side", m: `Most stressed: ${worst.p.label}`, d: "Radar of drivers, rupee paths, cost-versus-calm frontier" },
    { href: "/balance-sheets", k: "07 · BALANCE SHEETS", t: "Who pays for the fall", m: `ECB ${o.ecbLossCr >= 0 ? "loss" : "gain"} ${crore(Math.abs(o.ecbLossCr))}`, d: "Sector heatmap, hedging costs, refinancing cliff" },
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
      {cards.map((c) => (
        <Link key={c.href} href={c.href} className="panel group p-3 hover:bg-panel-2 transition-colors duration-150">
          <div className="flex items-center justify-between mono text-10 tracking-[0.1em] text-text-3">
            {c.k}
            <ArrowUpRight size={14} strokeWidth={1.5} className="text-text-3 group-hover:text-text transition-colors duration-150" />
          </div>
          <div className="text-14 text-text mt-1.5">{c.t}</div>
          <div className="mono text-12 c-brand mt-0.5 truncate">{c.m}</div>
          <div className="text-11 text-text-3 mt-1 leading-[1.4]">{c.d}</div>
        </Link>
      ))}
    </div>
  );
}
