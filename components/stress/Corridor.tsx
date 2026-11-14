"use client";
import { BASELINE as B } from "@/lib/model/coefficients";
import { useModel } from "@/lib/hooks";
import { pct } from "@/lib/format";
import { Panel } from "@/components/ui/Panel";

const LO = 5.0;
const HI = 6.75;
const x = (v: number) => `${((Math.min(HI, Math.max(LO, v)) - LO) / (HI - LO)) * 100}%`;

export function Corridor({ className = "a-corridor" }: { className?: string } = {}) {
  const o = useModel();
  const ticks = [5.0, 5.25, 5.5, 5.75, 6.0, 6.25, 6.5, 6.75];
  const pos = o.callRate >= o.msf - 0.02 ? "at the MSF ceiling" : o.callRate <= o.sdf + 0.02 ? "at the SDF floor" : o.callRate > o.repo ? "above repo" : "below repo";
  return (
    <Panel className={className} letter="f" title="RBI corridor" model source="RBI MPC Oct 2026; call 22 Oct" stamp="% p.a.">
      <div className="relative h-[132px] mt-3">
        {/* base corridor ghost */}
        <div className="absolute top-[34px] h-[40px] border border-dashed border-border-2 rounded-xs" style={{ left: x(B.SDF0), width: `calc(${x(B.MSF0)} - ${x(B.SDF0)})` }} />
        {/* scenario corridor */}
        <div className="absolute top-[34px] h-[40px] bg-panel-2 border-y border-border-2 transition-[left,width] duration-200 ease-out" style={{ left: x(o.sdf), width: `calc(${x(o.msf)} - ${x(o.sdf)})` }} />
        {[
          { v: o.sdf, l: "SDF", c: "bg-text-3", pos: "-top-[18px] -translate-x-full text-text-3" },
          { v: o.repo, l: "REPO", c: "bg-brand", pos: "-top-[32px] -translate-x-1/2 text-brand-soft" },
          { v: o.msf, l: "MSF", c: "bg-text-3", pos: `-top-[18px] text-text-3 ${o.msf > 6.2 ? "-translate-x-full -top-[46px]!" : ""}` },
        ].map((r) => (
          <div key={r.l} className="absolute top-[22px] h-[64px] transition-[left] duration-200 ease-out" style={{ left: x(r.v) }}>
            <div className={`w-[2px] h-full -ml-px ${r.c}`} />
            <div className={`absolute ${r.pos} mono text-10 whitespace-nowrap px-1`}>
              {r.l} {r.v.toFixed(2)}
            </div>
          </div>
        ))}
        {/* actual call rate */}
        <div className="absolute top-[47px] -translate-x-1/2" style={{ left: x(B.ACTUAL_CALL) }} title="Actual call rate 5.69% (22 Oct)">
          <div className="w-[10px] h-[10px] rounded-full border-2 border-text-2 bg-panel" />
        </div>
        {/* model call rate */}
        <div className="absolute top-[47px] -translate-x-1/2 transition-[left] duration-200 ease-out" style={{ left: x(o.callRate) }} title="Model call rate">
          <div className="w-[10px] h-[10px] rounded-full bg-brand-soft" />
        </div>
        {/* axis */}
        <div className="absolute left-0 right-0 top-[100px] border-t border-border" />
        {ticks.map((t) => (
          <div key={t} className="absolute top-[104px] -translate-x-1/2 mono text-10 text-text-3" style={{ left: x(t) }}>
            {t.toFixed(2)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-11 mt-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-soft" />
          <span className="text-text-3">Model call</span>
          <span className="mono text-text ml-auto">{pct(o.callRate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full border border-text-2" />
          <span className="text-text-3">Actual 22 Oct</span>
          <span className="mono text-text ml-auto">{pct(B.ACTUAL_CALL)}</span>
        </div>
      </div>
      <p className="text-11 text-text-3 mt-2">
        Call rate sits <span className="text-text-2">{pos}</span> with ₹{o.liquidity.toFixed(2)}L Cr of liquidity.
      </p>
    </Panel>
  );
}
