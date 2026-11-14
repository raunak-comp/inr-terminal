"use client";
import { RotateCcw } from "lucide-react";
import { PRESETS } from "@/lib/model/presets";
import { DEFAULT_SCENARIO, type RepoStep } from "@/lib/model/model";
import { useStore } from "@/lib/store";
import { Segmented, Slider, Toggle } from "@/components/ui/Controls";
import { Tip } from "@/components/ui/Tip";
import { Panel } from "@/components/ui/Panel";

export function Levers({ compact }: { compact?: boolean }) {
  const s = useStore((st) => st.scenario);
  const setParam = useStore((st) => st.setParam);
  const q = s.horizon === 4 ? "per qtr" : "this qtr";
  const brent = <Slider key="brent" label="Brent crude" unit="$/bbl" value={s.brent} min={60} max={160} step={0.1} decimals={1} def={DEFAULT_SCENARIO.brent} onChange={(v) => setParam("brent", v)} scale={["$60", "$160"]} />;
  const fed = <Slider key="fed" label="Fed / US yield shock" unit="bps" value={s.fed} min={-50} max={100} step={5} def={0} onChange={(v) => setParam("fed", v)} scale={["−50", "+100"]} />;
  const fpi = <Slider key="fpi" label={`Net FPI flow ${q}`} unit="$B" value={s.fpi} min={-30} max={15} step={0.5} decimals={1} def={0} onChange={(v) => setParam("fpi", v)} scale={["Outflow −30", "+15 Inflow"]} />;
  const rbi = <Slider key="rbi" label={`RBI spot dollar ops ${q}`} unit="$B" value={s.rbi} min={-20} max={80} step={1} def={0} onChange={(v) => setParam("rbi", v)} scale={["Buys $20B", "Sells $80B"]} />;
  const food = <Slider key="food" label="Food price shock" unit="pp" value={s.food} min={0} max={1.5} step={0.1} decimals={1} def={0} onChange={(v) => setParam("food", v)} scale={["0", "+1.5 CPI pp"]} />;
  const repo = (
    <div key="repo" className="ctl">
      <div className="ctl-top">
        <span className="ctl-label">RBI repo change</span>
        <span className="mono text-11 text-text-3">Repo {(5.5 + s.repo / 100).toFixed(2)}%</span>
      </div>
      <Segmented<RepoStep> label="Repo change" value={s.repo} onChange={(v) => setParam("repo", v)} options={[{ v: 0, l: "0" }, { v: 25, l: "+25" }, { v: 50, l: "+50" }, { v: 75, l: "+75" }]} />
    </div>
  );
  const curbs = (
    <div key="curbs" className="ctl">
      <Toggle on={s.curbs} onChange={(v) => setParam("curbs", v)}>
        Emergency FX curbs <span className="text-text-3">(FERR, $5M limit, NDF ban)</span>
      </Toggle>
    </div>
  );
  if (compact) return <div className="lever-strip">{[brent, fpi, rbi, fed, repo, curbs]}</div>;
  return (
    <>
      <div className="ctl-sec">EXTERNAL SHOCKS</div>
      {brent}{fed}{fpi}{food}
      <div className="ctl-sec">POLICY RESPONSE</div>
      {rbi}{repo}{curbs}
      <div className="ctl-sec">STRUCTURE</div>
      <div className="ctl">
        <div className="ctl-top">
          <span className="ctl-label">Forward book size</span>
          <span className="text-10 text-text-3">BusinessLine · Ambit</span>
        </div>
        <Segmented<103 | 200> label="Forward book" value={s.book} onChange={(v) => setParam("book", v)} options={[{ v: 103, l: "$103B" }, { v: 200, l: "~$200B" }]} />
      </div>
      <div className="ctl">
        <div className="ctl-top"><span className="ctl-label">Horizon</span></div>
        <Segmented<1 | 4> label="Horizon" value={s.horizon} onChange={(v) => setParam("horizon", v)} options={[{ v: 1, l: "1 quarter" }, { v: 4, l: "4 quarters" }]} />
      </div>
    </>
  );
}

export function ScenarioInputs() {
  const preset = useStore((st) => st.preset);
  const applyPreset = useStore((st) => st.applyPreset);
  return (
    <div className="col">
      <Panel letter="a" title="Scenario presets" flush right={<span className="mono text-10 text-text-3">{preset === "custom" ? "CUSTOM" : ""}</span>}>
        <div role="listbox" aria-label="Presets">
          {PRESETS.map((p, i) => (
            <Tip key={p.id} side="right" content={<><div className="text-text mb-0.5">{p.label}</div>{p.note}</>}>
              <button className="preset" role="option" aria-selected={preset === p.id} data-active={preset === p.id} data-tone={p.tone} onClick={() => applyPreset(p.id)}>
                <span className="idx">{i + 1}</span>
                <span className="truncate">{p.label}</span>
                {p.tone === "warn" && <span className="ml-auto tag watch">Not to do</span>}
                {p.tone === "ours" && <span className="ml-auto tag brand">Ours</span>}
              </button>
            </Tip>
          ))}
        </div>
      </Panel>
      <Panel letter="b" title="Levers" flush source="Team scenario assumptions" stamp="Per-quarter flows" right={
        <button className="btn h-[22px] text-11 px-2" onClick={() => applyPreset("base")}><RotateCcw size={11} /> Base</button>
      }>
        <Levers />
      </Panel>
    </div>
  );
}
