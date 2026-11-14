"use client";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { corporate, liquidity } from "@/lib/data/deck";
import { sectorExposure } from "@/lib/data/meta";
import { BASELINE as B } from "@/lib/model/coefficients";
import { presetById } from "@/lib/model/presets";
import { bps, crore, inr, num, shortDate, signed } from "@/lib/format";
import { useModel, useNow } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { EChart, axisBase, tooltipBase, type EOption } from "@/components/charts/EChart";
import { COLORS, alpha } from "@/components/charts/theme";
import { Panel } from "@/components/ui/Panel";

export function ScenarioBar() {
  const o = useModel();
  const preset = useStore((s) => s.preset);
  const h = useStore((s) => s.scenario.horizon);
  const name = preset === "custom" ? "Custom scenario" : presetById(preset)!.label;
  return (
    <div className="col-span-12 panel flex-row! items-center gap-4 px-3 h-10 text-12">
      <span className="text-11 text-text-3 tracking-[0.08em]">ACTIVE SCENARIO</span>
      <span className="text-text">{name}</span>
      <span className="text-text-3">·</span>
      <span className="mono text-text">USD/INR {inr(o.usdinr)}</span>
      <span className={`mono ${o.dINR > 0.005 ? "c-neg" : o.dINR < -0.005 ? "c-pos" : "text-text-3"}`}>{signed(o.dINR)}%</span>
      <span className="text-text-3 hide-sm">over {h === 1 ? "1 quarter" : "4 quarters"} · panels marked Model estimate react to it</span>
      <Link href="/" className="ml-auto btn h-[26px]">
        Change in Stress Engine <ArrowRight size={13} strokeWidth={1.5} />
      </Link>
    </div>
  );
}

export function EcbDonut() {
  const option = useMemo<EOption>(
    () => ({
      tooltip: { ...tooltipBase, trigger: "item", formatter: (p: { name: string; value: number }) => `${p.name}: <b style="color:${COLORS.text};font-weight:500">$${p.value}B</b>` },
      series: [
        {
          type: "pie",
          radius: ["62%", "80%"],
          padAngle: 1.5,
          itemStyle: { borderColor: COLORS.panel, borderWidth: 1 },
          label: { show: true, position: "center", formatter: () => `{a|$${corporate.ecbTotalB}B}\n{b|ECB borrowings}`, rich: { a: { color: COLORS.text, fontSize: 22, lineHeight: 26 }, b: { color: COLORS.text3, fontSize: 10, lineHeight: 14 } } },
          emphasis: { scale: false },
          labelLine: { show: false },
          data: [
            { name: "Unhedged", value: corporate.ecbUnhedgedB, itemStyle: { color: COLORS.brand } },
            { name: "Hedged", value: corporate.ecbTotalB - corporate.ecbUnhedgedB, itemStyle: { color: "#3A3A44" } },
          ],
        },
      ],
    }),
    []
  );
  const o = useModel();
  return (
    <Panel className="col-span-12 lg:col-span-6 xl:col-span-4" letter="a" title="ECB exposure" source="Urbanomics; MUFG via FXStreet" stamp="$B">
      <div className="grid grid-cols-[150px_1fr] gap-4 items-center">
        <EChart option={option} height={150} />
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2 text-11 text-text-3"><span className="w-2 h-2 bg-brand" />UNHEDGED</div>
            <div className="mono text-20 text-text">{corporate.unhedgedPct}% · ${corporate.ecbUnhedgedB}B</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-11 text-text-3"><span className="w-2 h-2 bg-[#3A3A44]" />HEDGED</div>
            <div className="mono text-20 text-text">{100 - corporate.unhedgedPct}% · ${corporate.ecbTotalB - corporate.ecbUnhedgedB}B</div>
          </div>
          <div className="border-t border-border pt-2">
            <div className="text-11 text-text-3">Scenario translation {o.ecbLossCr >= 0 ? "loss" : "gain"} <span className="tag ml-1">Model</span></div>
            <div className={`mono text-16 ${o.ecbLossCr > 0.5 ? "c-neg" : o.ecbLossCr < -0.5 ? "c-pos" : "text-text"}`}>{crore(Math.abs(o.ecbLossCr))}</div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function ForwardPremium() {
  const o = useModel();
  const [pre, post] = corporate.fwdPremiumPath;
  const option = useMemo<EOption>(
    () => ({
      grid: { left: 8, right: 8, top: 26, bottom: 22 },
      tooltip: { ...tooltipBase, trigger: "axis", axisPointer: { type: "shadow", shadowStyle: { color: "rgba(255,255,255,0.03)" } } },
      xAxis: { type: "category", data: ["Before curbs", "After curbs (Oct)", "Scenario"], ...axisBase },
      yAxis: { type: "value", show: false, min: 0, max: 10 },
      series: [
        {
          type: "bar",
          barWidth: "44%",
          data: [
            { value: pre, itemStyle: { color: "#3A3A44" } },
            { value: post, itemStyle: { color: COLORS.brandSoft } },
            { value: +o.fwdPremium.toFixed(2), itemStyle: { color: o.fwdPremium > post + 0.005 ? COLORS.neg : o.fwdPremium < post - 0.005 ? COLORS.pos : COLORS.brandSoft, decal: undefined }, label: { color: COLORS.text } },
          ],
          label: { show: true, position: "top", color: COLORS.text2, fontSize: 11, formatter: (p: { value: number }) => `${num(p.value)}%` },
          markLine: { silent: true, symbol: "none", data: [{ yAxis: 5.6, lineStyle: { color: COLORS.pos, type: [3, 3], width: 1 }, label: { formatter: "Target < 5.6%", color: COLORS.pos, fontSize: 10, position: "insideEndBottom" } }] },
        },
      ],
    }),
    [pre, post, o.fwdPremium]
  );
  return (
    <Panel className="col-span-12 lg:col-span-6 xl:col-span-4" letter="b" title="1M forward premium" right={<span className="mono text-11 c-neg">{signed(post - pre)} pp</span>} source="Moody's via TradingView; scenario from model" stamp="% annualised">
      <EChart option={option} height={176} />
    </Panel>
  );
}

export function RefinancingCliff() {
  const o = useModel();
  const now = useNow(60000);
  const start = Date.parse("2026-04-01T00:00:00Z");
  const end = Date.parse(corporate.cliffDate + "T00:00:00Z");
  const t = now ? Math.min(1, Math.max(0, (now.getTime() - start) / (end - start))) : 0;
  const days = now ? Math.round((end - now.getTime()) / 86400000) : null;
  const quarters = ["Q1 FY27", "Q2", "Q3", "Q4", "Q1 FY28", "Q2", "Q3", "Q4"];
  const extra = (corporate.refinancingCliffB * 1e9 * (o.usdinr - B.USDINR0)) / 1e7;
  return (
    <Panel className="col-span-12 lg:col-span-12 xl:col-span-4" letter="c" title="Refinancing cliff" model source="Team deck: $120B due by Mar 2028" stamp={shortDate(corporate.cliffDate)}>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="mono text-28 text-text">${corporate.refinancingCliffB}B</div>
          <div className="text-11 text-text-3">foreign-currency debt to roll over</div>
        </div>
        <div className="text-right">
          <div className="mono text-20 c-warn">{days === null ? "—" : days.toLocaleString("en-IN")}</div>
          <div className="text-11 text-text-3">days left</div>
        </div>
      </div>
      <div className="relative mt-5">
        <div className="grid grid-cols-8 gap-px h-6 bg-border">
          {quarters.map((q, i) => (
            <div key={i} className={`${i / 8 < t ? "bg-warn/25" : "bg-panel-2"}`} />
          ))}
        </div>
        <div className="absolute -top-2 bottom-0 w-[2px] bg-text" style={{ left: `${t * 100}%` }}>
          <span className="absolute -top-4 -translate-x-1/2 mono text-10 text-text whitespace-nowrap">NOW</span>
        </div>
        <div className="grid grid-cols-8 mono text-10 text-text-3 mt-1">
          {quarters.map((q, i) => <span key={i} className="truncate">{q}</span>)}
        </div>
      </div>
      <div className="mt-3 border-t border-border pt-2 flex justify-between text-11">
        <span className="text-text-3">Extra rupee cost to repay at scenario rate</span>
        <span className={`mono ${extra > 0.5 ? "c-neg" : extra < -0.5 ? "c-pos" : "text-text"}`}>{extra >= 0 ? "+" : "−"}{crore(Math.abs(extra))}</span>
      </div>
    </Panel>
  );
}

export function SectorHeatmap() {
  const o = useModel();
  const d = o.dINR;
  const amp = 1 + Math.min(1, Math.abs(d) / 6);
  const rows = sectorExposure.rows.map((r) => {
    const net = r.s[0] + r.s[1] + r.s[2] - r.s[3];
    return { ...r, net, impact: net * d };
  });
  const maxImp = Math.max(1, ...rows.map((r) => Math.abs(r.impact)));
  return (
    <Panel
      className="col-span-12 xl:col-span-8"
      letter="d"
      title="Sector exposure heatmap"
      right={<><span className="tag">Team assessment 1–5</span><span className="tag">Re-tints with scenario</span></>}
      flush
      source="Team assessment; scenario impact = net exposure × rupee move"
      stamp={`Rupee move ${signed(d)}%`}
    >
      <table className="tbl">
        <thead>
          <tr>
            <th>Sector</th>
            {sectorExposure.columns.map((c, i) => <th key={c} className="text-center!">{c}{sectorExposure.cushion[i] ? " (cushion)" : ""}</th>)}
            <th className="num">Net</th>
            <th className="w-[30%]">Scenario impact · model</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sector}>
              <td className="text-text">{r.sector}</td>
              {r.s.map((v, i) => {
                const cushion = sectorExposure.cushion[i];
                const helps = cushion ? d >= 0 : d < 0;
                const col = helps && Math.abs(d) > 0.01 ? COLORS.pos : cushion && Math.abs(d) <= 0.01 ? COLORS.pos : COLORS.neg;
                const a = Math.min(0.6, (v / 5) * 0.32 * amp);
                return (
                  <td key={i} className="p-0! text-center">
                    <div className="mx-1 h-[24px] flex items-center justify-center mono text-12 rounded-xs transition-colors duration-200" style={{ background: alpha(col, a), color: v >= 4 ? COLORS.text : COLORS.text2 }}>
                      {v}
                    </div>
                  </td>
                );
              })}
              <td className="num">{r.net > 0 ? "+" : r.net < 0 ? "−" : ""}{Math.abs(r.net)}</td>
              <td>
                <div className="relative h-[8px] bg-panel-2 rounded-xs">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-border-2" />
                  <div
                    className={`absolute inset-y-0 transition-all duration-200 ease-out ${r.impact > 0 ? "bg-neg" : "bg-pos"}`}
                    style={r.impact >= 0 ? { left: "50%", width: `${(r.impact / maxImp) * 50}%` } : { right: "50%", width: `${(-r.impact / maxImp) * 50}%` }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

export function LiquidityChain() {
  const steps = corporate.liquidityChain;
  const lv = (k: string) => liquidity.find((l) => l[0] === k)?.[1] ?? 0;
  const levels = [lv("7 Sep"), 0, lv("22 Oct"), 0, lv("6 Nov")];
  const peak = Math.max(...levels);
  const kinds = ["level", "flow", "level", "rate", "level"];
  return (
    <Panel className="col-span-12 lg:col-span-6 xl:col-span-4" letter="e" title="Liquidity stress chain" source="ANI / ICICI; RBI" stamp={`Surplus fell ${corporate.surplusFall}`}>
      <ol className="relative">
        {steps.map((s, i) => (
          <li key={i} className="grid grid-cols-[20px_1fr_92px] gap-3 items-center h-[42px]">
            <div className="relative h-full flex justify-center">
              <div className={`absolute ${i === 0 ? "top-1/2" : "top-0"} ${i === steps.length - 1 ? "bottom-1/2" : "bottom-0"} w-px bg-border-2`} />
              <div className={`relative mt-auto mb-auto w-[9px] h-[9px] border ${i === 2 || i === 3 ? "bg-neg border-neg" : i === 4 ? "bg-pos border-pos" : "bg-panel border-text-2"}`} />
            </div>
            <div className={`text-12 ${i === 2 || i === 3 ? "text-text" : "text-text-2"}`}>{s}</div>
            {kinds[i] === "level" ? (
              <div className="h-[6px] bg-panel-2 rounded-xs overflow-hidden">
                <div className={`h-full ${i === 4 ? "bg-pos" : i === 2 ? "bg-neg" : "bg-brand-soft"}`} style={{ width: `${Math.max(2, (levels[i] / peak) * 100)}%` }} />
              </div>
            ) : (
              <span className={`mono text-11 text-right ${kinds[i] === "flow" ? "c-neg" : "c-warn"}`}>{kinds[i] === "flow" ? "~−₹11L Cr" : bps((B.ACTUAL_CALL - B.REPO0) * 100)}</span>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-2 flex justify-between text-11 text-text-3 border-t border-border pt-2">
        <span>CD rates {corporate.cdRates}</span>
        <span className="mono">{liquidity.at(-1)![0]}: ₹{num(liquidity.at(-1)![1], 1)}L Cr</span>
      </div>
    </Panel>
  );
}

export function FundingCards() {
  const big = ["5.69%", "+0.5%", "₹2L Cr", "₹3–4L Cr"];
  const tone = ["c-neg", "c-warn", "c-warn", "c-neg"];
  return (
    <Panel className="col-span-12 xl:col-span-8" letter="f" title="Funding stress" source="ANI / ICICI; Rediff; BusinessLine" stamp="Oct 2026" flush>
      <div className="grid grid-cols-2 gap-px bg-border">
        {corporate.fundingStress.map((t, i) => (
          <div key={i} className="p-3 bg-panel">
            <div className={`mono text-28 ${tone[i]}`}>{big[i]}</div>
            <div className="text-12 text-text-2 mt-1">{t}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

