"use client";
import { useMemo, useState } from "react";
import { ExternalLink, RotateCcw, Search } from "lucide-react";
import { sources } from "@/lib/data/deck";
import { dataCatalogue, dataLinks } from "@/lib/data/meta";
import { COEF_META, DEFAULT_COEFFICIENTS } from "@/lib/model/coefficients";
import { num } from "@/lib/format";
import { useModel } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { Panel } from "@/components/ui/Panel";

export function DataTable() {
  const [q, setQ] = useState("");
  const feeds = useStore((s) => s.feeds);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return dataCatalogue
      .map((d) => {
        if (d.value !== "Live") return d;
        const f = d.label.includes("USD/INR") ? feeds.usdinr : d.label.includes("Brent") ? feeds.brent : d.label.includes("10-year") ? feeds.us10y : feeds.usd;
        return f.status === "snapshot" ? { ...d, value: "Not connected", date: "Using deck snapshot" } : { ...d, value: num(f.value, 2), date: f.asOf };
      })
      .filter((d) => !t || `${d.label} ${d.source} ${d.value}`.toLowerCase().includes(t));
  }, [q, feeds]);
  return (
    <Panel
      className="col-span-12 2xl:col-span-7"
      letter="a"
      title="Data points"
      right={
        <label className="ctl-input w-[220px]">
          <Search size={12} strokeWidth={1.5} className="text-text-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search data" className="w-full! text-left!" aria-label="Search data points" />
        </label>
      }
      flush
      source="Team deck and live feeds"
      stamp={`${rows.length} of ${dataCatalogue.length} rows`}
    >
      <div className="max-h-[calc(100vh-230px)] overflow-auto">
        <table className="tbl">
          <thead>
            <tr><th>Data point</th><th className="num">Value</th><th>Unit</th><th>Date</th><th>Source</th></tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.label}>
                <td className="text-text">{d.label}</td>
                <td className={`num ${d.value === "Not connected" ? "text-text-3!" : ""}`}>{d.value}</td>
                <td className="mono text-11 text-text-3 whitespace-nowrap">{d.unit}</td>
                <td className="mono text-11 whitespace-nowrap">{d.date}</td>
                <td className="text-11">
                  {d.url ? (
                    <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-text">
                      {d.source} <ExternalLink size={11} strokeWidth={1.5} />
                    </a>
                  ) : (
                    d.source
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="text-text-3">No data point matches “{q}”.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function CoefTable() {
  const coef = useStore((s) => s.coef);
  const setCoef = useStore((s) => s.setCoef);
  const resetCoef = useStore((s) => s.resetCoef);
  const o = useModel();
  const changed = COEF_META.filter((m) => coef[m.key] !== DEFAULT_COEFFICIENTS[m.key]).length;
  return (
    <Panel
      className="col-span-12 2xl:col-span-5"
      letter="b"
      title="Model coefficients"
      right={
        <>
          <span className="mono text-11 text-text-3">Crisis {num(o.crisis, 0)} · ₹{num(o.usdinr)}</span>
          <button className="btn h-[24px] text-11" onClick={() => resetCoef()} disabled={!changed}>
            <RotateCcw size={12} strokeWidth={1.5} /> Reset all{changed ? ` (${changed})` : ""}
          </button>
        </>
      }
      flush
      source="/lib/model/coefficients.ts · edits re-run the Stress Engine instantly"
      stamp="v1.0"
    >
      <div className="max-h-[calc(100vh-230px)] overflow-auto">
        <table className="tbl">
          <thead>
            <tr><th>Coefficient</th><th className="num">Value</th><th>Tag</th><th /></tr>
          </thead>
          <tbody>
            {COEF_META.map((m) => {
              const v = coef[m.key];
              const dirty = v !== DEFAULT_COEFFICIENTS[m.key];
              return (
                <tr key={m.key}>
                  <td className="py-1.5">
                    <div className="text-12 text-text">{m.label}</div>
                    <div className="text-10 text-text-3 leading-[1.4]">{m.note}</div>
                  </td>
                  <td className="num">
                    <div className={`ctl-input justify-end ml-auto w-[112px] ${dirty ? "border-warn!" : ""}`}>
                      <input
                        type="number"
                        step={m.step}
                        value={v}
                        aria-label={m.label}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (e.target.value !== "" && Number.isFinite(n)) setCoef(m.key, n);
                        }}
                      />
                      <span className="whitespace-nowrap">{m.unit}</span>
                    </div>
                  </td>
                  <td><span className={`tag ${m.tag === "Team assumption" ? "" : "ok"}`}>{m.tag}</span></td>
                  <td className="w-8">
                    <button className="reset" disabled={!dirty} onClick={() => resetCoef(m.key)} aria-label={`Reset ${m.label}`}>
                      <RotateCcw size={12} strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function Methodology() {
  return (
    <Panel className="col-span-12 2xl:col-span-7" letter="c" title="Methodology" source="Team model v1.0" stamp="Illustrative, not a forecast">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-12 text-text-2 leading-[1.55]">
        <div>
          <div className="text-11 tracking-[0.08em] text-text-3 mb-1">WHAT IT DOES</div>
          Each quarter the model adds up the dollar gap: the extra oil bill, foreign portfolio flows, and the pull of US and Indian rates. RBI dollar sales absorb part of it. Whatever is left moves the rupee, which then feeds inflation, reserves, bank liquidity, the call rate and corporate FX losses. A Monte Carlo of 2,000 paths draws the range around the central path.
        </div>
        <div>
          <div className="text-11 tracking-[0.08em] text-text-3 mb-1">WHAT IT IGNORES</div>
          Second-round effects such as wage spirals, growth feedback on imports, fiscal responses, the exact timing of forward maturities and market panic beyond the volatility boost above a Crisis Meter of 60. Corporate sector scores are qualitative team assessments.
        </div>
        <div>
          <div className="text-11 tracking-[0.08em] text-text-3 mb-1">WHY IT IS ILLUSTRATIVE</div>
          Coefficients are calibrated to the deck (pass-through, liquidity drain, the CAD at Brent $130) or set as team assumptions. It shows direction and scale of trade-offs for judges to test, not a point forecast. Every coefficient is editable on this screen.
        </div>
      </div>
    </Panel>
  );
}

export function SourceList() {
  return (
    <Panel className="col-span-12 2xl:col-span-5" letter="d" title="Source list" flush source="Team deck bibliography" stamp={`${sources.length} sources`}>
      <ol className="grid grid-cols-1 2xl:grid-cols-2 text-11">
        {sources.map((s, i) => (
          <li key={s} className="flex gap-2 px-3 py-1.5 border-b border-border text-text-2">
            <span className="mono text-text-3 w-5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
            {s}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2 px-3 py-2">
        {dataLinks.map((l) => (
          <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="btn h-[24px] text-11">
            {l.label} <ExternalLink size={11} strokeWidth={1.5} />
          </a>
        ))}
      </div>
    </Panel>
  );
}
