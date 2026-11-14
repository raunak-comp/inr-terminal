"use client";
import { liquidity, reservesWeekly, rupeeAnchors } from "@/lib/data/deck";
import { BASELINE as B } from "@/lib/model/coefficients";
import { num, signed } from "@/lib/format";
import { useModel } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { Num } from "@/components/ui/Num";
import { Spark } from "@/components/ui/Spark";
import { COLORS } from "@/components/charts/theme";

type K = { label: string; unit: string; base: number; value: number; d: number; up: "bad" | "good"; hist: number[]; prefix?: string };

export function KpiStrip() {
  const o = useModel();
  const book = useStore((s) => s.scenario.book);
  const baseUsable = B.RES0 - book;
  const kpis: K[] = [
    { label: "USD/INR", unit: "", prefix: "₹", base: B.USDINR0, value: o.usdinr, d: 2, up: "bad", hist: rupeeAnchors.map((a) => a.value) },
    { label: "CPI inflation", unit: "%", base: B.CPI0, value: o.cpi, d: 2, up: "bad", hist: [B.CPI0] },
    { label: "CAD, % of GDP", unit: "%", base: B.CAD0, value: o.cad, d: 2, up: "bad", hist: [0.6] },
    { label: "Usable reserves", unit: "$B", base: baseUsable, value: o.usable, d: 1, up: "good", hist: reservesWeekly.map((r) => r[1] - book) },
    { label: "Bank liquidity", unit: "₹L Cr", base: B.LIQ0, value: o.liquidity, d: 2, up: "good", hist: liquidity.map((l) => l[1]) },
    { label: "Call rate", unit: "%", base: B.ACTUAL_CALL, value: o.callRate, d: 2, up: "bad", hist: [5.69] },
  ];
  return (
    <section className="panel">
      <div className="kpi-grid">
        {kpis.map((k) => {
          const delta = k.value - k.base;
          const r = Number(delta.toFixed(k.d));
          const tone = r === 0 ? "flat" : (r > 0) === (k.up === "good") ? "pos" : "neg";
          return (
            <div key={k.label} className="kpi">
              <div className="flex items-center justify-between gap-2">
                <span className="kpi-l">{k.label}</span>
                <Spark data={[...k.hist, k.value]} width={44} height={14} color={tone === "neg" ? COLORS.neg : tone === "pos" ? COLORS.pos : COLORS.text3} />
              </div>
              <div className="kpi-v">
                {k.prefix}
                <Num value={k.value} format={(v) => num(v, k.d)} />
                {k.unit && <small>{k.unit}</small>}
              </div>
              <div className="flex items-center gap-2 text-11">
                <span className={`delta ${tone}`}>{signed(delta, k.d)}</span>
                <span className="text-text-3 truncate">
                  {k.label === "Call rate" ? "vs 5.69% actual" : `Base ${k.prefix ?? ""}${num(k.base, k.d)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
