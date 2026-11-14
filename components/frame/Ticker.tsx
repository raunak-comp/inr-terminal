"use client";
import { fpiKpis, reservesWeekly, ticker } from "@/lib/data/deck";
import { corporate } from "@/lib/data/deck";
import { num, signed } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Spark } from "@/components/ui/Spark";
import { COLORS } from "@/components/charts/theme";
import { Tip } from "@/components/ui/Tip";
import type { Feed } from "@/lib/market/types";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

type Item = { k: string; label: string; value: number; d: number; unit?: string; change: number | null; series: number[]; live: boolean; up: "bad" | "good" | "neutral"; note: string; asOf: string };

const fromFeed = (f: Feed, k: string, label: string, d: number, up: Item["up"], unit = ""): Item => ({
  k, label, value: f.value, d, unit, change: f.change, series: f.series.slice(-30).map((x) => x[1]), live: f.status !== "snapshot", up, note: f.source, asOf: f.asOf,
});

export function Ticker() {
  const feeds = useStore((s) => s.feeds);
  const in10 = fpiKpis.in10y.match(/[\d.]+/g)!.map(Number);
  const items: Item[] = [
    fromFeed(feeds.usdinr, "usdinr", "USD/INR", 2, "bad"),
    fromFeed(feeds.brent, "brent", "BRENT", 1, "bad", "$"),
    fromFeed(feeds.us10y, "us10y", "US 10Y", 2, "bad"),
    { k: "in10y", label: "IN 10Y", value: ticker.in10y, d: 2, change: in10[1] - in10[0], series: in10, live: false, up: "bad", note: "ANI / ICICI (10 Nov)", asOf: "2026-11-10" },
    fromFeed(feeds.usd, "usd", feeds.usd.status === "snapshot" ? "DOLLAR IDX" : "BROAD USD", feeds.usd.status === "snapshot" ? 0 : 2, "bad"),
    { k: "repo", label: "REPO", value: ticker.repo, d: 2, change: 0.25, series: [5.25, 5.5], live: false, up: "neutral", note: "RBI MPC, 7 Oct 2026", asOf: "2026-10-07" },
    { k: "call", label: "CALL", value: ticker.callRate, d: 2, change: null, series: [], live: false, up: "bad", note: "22 Oct 2026, 6 bps below MSF", asOf: "2026-10-22" },
    { k: "res", label: "FX RES $B", value: ticker.reservesB, d: 1, change: reservesWeekly.at(-1)![1] - reservesWeekly.at(-2)![1], series: reservesWeekly.map((r) => r[1]), live: false, up: "good", note: "RBI weekly", asOf: "2026-10-02" },
    { k: "cpi", label: "CPI", value: ticker.cpi, d: 2, unit: "", change: null, series: [], live: false, up: "bad", note: "PIB / MoSPI, Sep 2026", asOf: "2026-09-30" },
    { k: "fwd", label: "1M FWD", value: ticker.fwdPremium1M, d: 2, change: corporate.fwdPremiumPath[1] - corporate.fwdPremiumPath[0], series: corporate.fwdPremiumPath, live: false, up: "bad", note: "Forward premium, % annualised", asOf: "2026-10-31" },
    { k: "reer", label: "REER", value: ticker.reer, d: 1, change: null, series: [], live: false, up: "neutral", note: "RBI 40-currency REER, Sep 2026", asOf: "2026-09-30" },
  ];
  return (
    <div className="tape" role="marquee" aria-label="Market ticker">
      <div className="tape-track">
      {[...items, ...items].map((it, idx) => {
        const ch = it.change;
        const tone = ch === null || Math.abs(ch) < 1e-9 || it.up === "neutral" ? "flat" : (ch > 0) === (it.up === "good") ? "pos" : "neg";
        const col = tone === "pos" ? COLORS.pos : tone === "neg" ? COLORS.neg : COLORS.text3;
        return (
          <Tip key={`${it.k}-${idx}`} content={<><div className="text-text">{it.label}</div><div>{it.note}</div><div className="mono text-text-3">As of {it.asOf} · {it.live ? "Live feed" : "Deck snapshot"}</div></>}>
            <div className="tape-item">
              <span className={`src-tag ${it.live ? "live" : ""}`}>{it.live ? "L" : "S"}</span>
              <span className="text-text-3 text-11 tracking-[0.04em]">{it.label}</span>
              <span className="mono text-text">{it.unit}{num(it.value, it.d)}</span>
              {ch !== null ? <span className={`mono text-11 ${tone === "pos" ? "c-pos" : tone === "neg" ? "c-neg" : "text-text-3"}`}>{signed(ch, it.d === 0 ? 1 : it.d)}</span> : <span className="mono text-11 text-text-3">{MONTHS[Number(it.asOf.slice(5, 7)) - 1]}</span>}
              <Spark data={it.series} color={col} />
            </div>
          </Tip>
        );
      })}
      </div>
    </div>
  );
}
