"use client";
import { BASELINE as B } from "@/lib/model/coefficients";
import { inr, lakhCr, num, pct, usdB } from "@/lib/format";
import { useModel } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { Panel } from "@/components/ui/Panel";
import { meterBand } from "./CrisisMeter";

export function WhatThisMeans() {
  const o = useModel();
  const s = useStore((st) => st.scenario);
  const mc = useStore((st) => st.mc);
  const hz = s.horizon === 1 ? "one quarter" : "four quarters";
  const n = s.horizon;

  const move = Math.abs(o.dINR) < 0.05 ? "holds near" : o.dINR > 0 ? "weakens to" : "strengthens to";
  const s1 = `Over ${hz}, the rupee ${move} ${inr(o.usdinr)} per dollar (${o.dINR >= 0 ? "+" : "−"}${num(Math.abs(o.dINR))}% vs ${inr(B.USDINR0)})${mc ? `, with a ${pct(mc.pCross * 100, 0)} chance of touching ₹100` : ""}.`;

  const cadVerb = o.cad > B.CAD0 + 0.05 ? "widens to" : o.cad < B.CAD0 - 0.05 ? "narrows to" : "stays at";
  const flows = o.annualisedOutflow > 0 ? ` Net capital outflows run at ~${usdB(o.annualisedOutflow, 0)} a year${o.annualisedOutflow > 40 ? ", above the $40B line where our plan fails" : ""}.` : " Capital flows are net positive, so the market absorbs the oil bill.";
  const s2 = `At Brent $${num(s.brent, 1)} the current account ${cadVerb} ~${num(o.cad, 1)}% of GDP.${flows}`;

  let s3: string;
  const pos = o.callRate >= o.msf - 0.02 ? "pushing the call rate to the MSF ceiling" : o.callRate > o.repo ? `lifting the call rate to ${pct(o.callRate)}, above repo` : `leaving the call rate at ${pct(o.callRate)}, inside the corridor`;
  if (s.rbi > 0) s3 = `RBI sales of ${usdB(s.rbi * n, 0)} drain ~${lakhCr(B.LIQ0 - o.liquidity, 1)} of bank liquidity, ${pos}. Usable reserves fall to ${usdB(o.usable, 0)} (${num(o.cover, 1)} months of imports).`;
  else if (s.rbi < 0) s3 = `RBI buying ${usdB(-s.rbi * n, 0)} rebuilds reserves to ${usdB(o.reserves, 0)} and adds ~${lakhCr(o.liquidity - B.LIQ0, 1)} of liquidity, ${pos}.`;
  else s3 = `With no RBI dollar sales, liquidity stays at ${lakhCr(o.liquidity, 1)} and usable reserves hold at ${usdB(o.usable, 0)} (${num(o.cover, 1)} months of imports).`;

  const band = meterBand(o.crisis);
  return (
    <Panel className="a-what" letter="i" title="What this means" right={<span className={`tag ${band.cls}`}>{band.label}</span>} source="Generated from templates on model outputs, not an AI model" stamp="Model estimate">
      <ol className="flex flex-col gap-2.5">
        {[s1, s2, s3].map((t, i) => (
          <li key={i} className="grid grid-cols-[18px_1fr] gap-2 text-13 leading-[1.5] text-text-2">
            <span className="mono text-11 text-text-3 pt-[2px]">0{i + 1}</span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
