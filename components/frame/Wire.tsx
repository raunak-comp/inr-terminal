"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Newspaper, Undo2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { makeNews, type NewsItem, type Snap } from "@/lib/news";
import { runModel } from "@/lib/model/model";
import { useStore } from "@/lib/store";
import { num, signed } from "@/lib/format";

export const snap = (): Snap => {
  const { scenario, coef } = useStore.getState();
  const o = runModel(scenario, coef);
  return { usdinr: o.usdinr, cpi: o.cpi, crisis: o.crisis, reserves: o.reserves, cad: o.cad, liquidity: o.liquidity };
};

export function applyNews(n: NewsItem) {
  const st = useStore.getState();
  const before = snap();
  st.shock(n.delta);
  st.markApplied(n.id, before, snap());
}

export function fireNews() {
  useStore.getState().addNews(makeNews());
}

/** Fires a simulated headline every 40–70 s while the wire is on. */
export function WireManager() {
  const enabled = useStore((s) => s.wire.enabled);
  useEffect(() => {
    if (!enabled) return;
    let t: ReturnType<typeof setTimeout>;
    const loop = (first: boolean) => {
      t = setTimeout(() => {
        const st = useStore.getState();
        if (!st.paletteOpen && !st.wire.toast) fireNews();
        loop(false);
      }, first ? 15000 : 40000 + Math.random() * 30000);
    };
    loop(true);
    return () => clearTimeout(t);
  }, [enabled]);
  return null;
}

const time = (ts: number) => new Date(ts).toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });

function ImpactRows({ b, a }: { b: Snap; a: Snap }) {
  const rows: [string, number, number, number, boolean][] = [
    ["USD/INR", b.usdinr, a.usdinr, 2, false],
    ["CPI %", b.cpi, a.cpi, 2, false],
    ["Crisis meter", b.crisis, a.crisis, 0, false],
    ["Reserves $B", b.reserves, a.reserves, 1, true],
  ];
  return (
    <div className="grid grid-cols-[1fr_auto_14px_auto_auto] gap-x-2 gap-y-1 items-center text-12">
      {rows.map(([l, x, y, d, upGood]) => {
        const dv = y - x;
        const tone = Math.abs(dv) < 10 ** -d / 2 ? "text-text-3" : (dv > 0) === upGood ? "c-pos" : "c-neg";
        return (
          <div key={l} className="contents">
            <span className="text-text-3">{l}</span>
            <span className="mono text-text-2 text-right">{num(x, d)}</span>
            <ArrowRight size={11} className="text-text-3" />
            <span className="mono text-text text-right">{num(y, d)}</span>
            <span className={`mono text-11 text-right ${tone}`}>{signed(dv, d)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function WireToast() {
  const router = useRouter();
  const toastId = useStore((s) => s.wire.toast);
  const item = useStore((s) => s.wire.items.find((x) => x.id === s.wire.toast));
  const setToast = useStore((s) => s.setToast);
  const undo = useStore((s) => s.undo);
  const [hover, setHover] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!toastId || hover) return;
    timer.current = setTimeout(() => setToast(null), item?.applied ? 20000 : 16000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [toastId, hover, item?.applied, setToast]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className="wire-toast"
          role="status"
        >
          <div className="flex items-center gap-2 h-8 px-3 border-b border-border">
            <span className={`w-1.5 h-1.5 rounded-full ${item.tone === "bad" ? "bg-neg" : "bg-pos"} live-dot`} />
            <span className="mono text-10 tracking-[0.1em] text-text-3">SIMULATED WIRE · {time(item.ts)} IST</span>
            <span className={`tag ml-auto ${item.severity === "HIGH" ? "trig" : item.severity === "MEDIUM" ? "watch" : "ok"}`}>{item.category}</span>
            <button className="reset" onClick={() => setToast(null)} aria-label="Dismiss">
              <X size={12} />
            </button>
          </div>
          <div className="p-3">
            <div className="text-14 text-text leading-[1.35]">{item.headline}</div>
            <div className="text-12 text-text-3 mt-1">{item.body}</div>
            <AnimatePresence mode="wait" initial={false}>
              {!item.applied ? (
                <motion.div key="ask" exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="mt-3 flex items-center gap-2">
                  <span className="mono text-11 text-text-2 mr-auto">
                    Model shock: <span className={item.tone === "bad" ? "c-neg" : "c-pos"}>{item.effect}</span>
                  </span>
                  <button className="btn h-[26px]" onClick={() => setToast(null)}>Ignore</button>
                  <button className="btn primary h-[26px]" onClick={() => applyNews(item)}>
                    Apply shock
                  </button>
                </motion.div>
              ) : (
                <motion.div key="done" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="mt-3">
                  <div className="flex items-center gap-1.5 text-11 c-pos mb-2">
                    <Check size={12} /> Shock applied · {item.effect}
                  </div>
                  {item.before && item.after && <ImpactRows b={item.before} a={item.after} />}
                  <div className="flex gap-2 mt-3">
                    <button className="btn h-[26px]" onClick={() => { undo(); setToast(null); }}>
                      <Undo2 size={12} /> Undo
                    </button>
                    <button className="btn primary h-[26px] ml-auto" onClick={() => { router.push("/transmission"); setToast(null); }}>
                      See the chain reaction <ArrowRight size={12} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function WireFeed() {
  const items = useStore((s) => s.wire.items);
  const enabled = useStore((s) => s.wire.enabled);
  const setToast = useStore((s) => s.setToast);
  return (
    <div>
      <div className="flex items-center justify-between px-3 h-9 border-b border-border text-11">
        <span className="text-text-3">{enabled ? "Headlines every 40–70 s" : "Wire paused"}</span>
        <button className="btn h-[24px] text-11" onClick={fireNews}>
          <Newspaper size={12} /> Fire headline
        </button>
      </div>
      {items.length === 0 ? (
        <div className="px-3 py-6 text-12 text-text-3">No headlines yet. The first simulated story arrives within 15 seconds, or press “Fire headline”.</div>
      ) : (
        <ul>
          <AnimatePresence initial={false}>
            {items.map((n) => (
              <motion.li key={n.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.18 }} className="border-b border-border last:border-b-0">
                <button className="w-full text-left px-3 py-2.5 hover:bg-panel-2 transition-colors duration-150" onClick={() => setToast(n.id)}>
                  <div className="flex items-center gap-2 mono text-10 text-text-3">
                    <span>{time(n.ts)}</span>
                    <span className={n.severity === "HIGH" ? "c-neg" : n.severity === "MEDIUM" ? "c-warn" : "c-pos"}>{n.category}</span>
                    <span className="ml-auto">{n.applied ? <span className="c-pos">APPLIED</span> : "OPEN"}</span>
                  </div>
                  <div className="text-12 text-text-2 mt-0.5 leading-[1.35]">{n.headline}</div>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
