"use client";
import { corporate } from "@/lib/data/deck";
import { BASELINE as B } from "@/lib/model/coefficients";
import { crore, num, pct, shortDate, signed } from "@/lib/format";
import { useModel, useNow } from "@/lib/hooks";
import { Num } from "@/components/ui/Num";
import { Panel } from "@/components/ui/Panel";

export function CorporateHit({ className = "a-corp" }: { className?: string } = {}) {
  const o = useModel();
  const now = useNow(60000);
  const cliff = Date.parse(corporate.cliffDate + "T00:00:00Z");
  const start = Date.parse("2026-04-01T00:00:00Z");
  const days = now ? Math.max(0, Math.round((cliff - now.getTime()) / 86400000)) : null;
  const elapsed = now ? Math.min(1, Math.max(0, (now.getTime() - start) / (cliff - start))) : 0;
  const months = days !== null ? Math.max(1, days / 30.44) : null;
  const loss = o.ecbLossCr;
  const curbsPrem = B.FWDPREM_NO_CURBS + B.CURBS_PREMIUM_ADD;
  return (
    <Panel className={className} letter="h" title="Corporate hit" model source="Deck: $255B ECBs, 34% unhedged; refinancing $120B" stamp={`Cliff ${shortDate(corporate.cliffDate)}`}>
      <div className="grid grid-cols-2 border border-border rounded-sm">
        <div className="p-3 border-r border-border">
          <div className="text-10 text-text-3 tracking-[0.06em]">ECB TRANSLATION {loss < 0 ? "GAIN" : "LOSS"}</div>
          <div className={`mono text-20 mt-1 ${loss > 0.5 ? "c-neg" : loss < -0.5 ? "c-pos" : "text-text"}`}>
            <Num value={Math.abs(loss)} format={(v) => crore(v)} />
          </div>
          <div className="text-11 text-text-3 mt-0.5">On ${corporate.ecbUnhedgedB}B unhedged at ₹{num(o.usdinr)}</div>
        </div>
        <div className="p-3">
          <div className="text-10 text-text-3 tracking-[0.06em]">1M FORWARD PREMIUM</div>
          <div className={`mono text-20 mt-1 ${o.fwdPremium > curbsPrem + 0.005 ? "c-neg" : o.fwdPremium < curbsPrem - 0.005 ? "c-pos" : "text-text"}`}>
            <Num value={o.fwdPremium} format={(v) => pct(v)} />
          </div>
          <div className="text-11 text-text-3 mt-0.5">
            {signed(o.fwdPremium - curbsPrem)} vs {pct(curbsPrem)} · pre-curbs {pct(B.FWDPREM_NO_CURBS)}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between items-baseline text-11 mb-1.5">
          <span className="text-text-3">REFINANCING CLIFF · ${corporate.refinancingCliffB}B DUE</span>
          <span className="mono text-text">{days === null ? "—" : `${days.toLocaleString("en-IN")} days`}</span>
        </div>
        <div className="relative h-[8px] bg-panel-2 rounded-xs overflow-hidden">
          <div className="absolute inset-y-0 left-0 bg-warn" style={{ width: `${elapsed * 100}%` }} />
          {[0.25, 0.5, 0.75].map((t) => (
            <div key={t} className="absolute inset-y-0 w-px bg-panel" style={{ left: `${t * 100}%` }} />
          ))}
        </div>
        <div className="flex justify-between mono text-10 text-text-3 mt-1">
          <span>APR 2026</span>
          <span>{months ? `~$${num(corporate.refinancingCliffB / months, 1)}B to roll per month` : ""}</span>
          <span>MAR 2028</span>
        </div>
      </div>
    </Panel>
  );
}
