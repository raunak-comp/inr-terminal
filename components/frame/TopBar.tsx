"use client";
import * as DM from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Command, MonitorPlay, Radio, Search, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNow } from "@/lib/hooks";
import { PRESETS, presetById } from "@/lib/model/presets";
import { useStore } from "@/lib/store";
import { Tip } from "@/components/ui/Tip";
import { shortDate } from "@/lib/format";
import { SNAPSHOT_DATE } from "@/lib/data/deck";

function StatusBadge() {
  const feeds = useStore((s) => s.feeds);
  const loading = useStore((s) => s.telemetry.loading);
  const list = Object.values(feeds);
  const live = list.filter((f) => f.status === "live").length;
  const cached = list.filter((f) => f.status === "cached").length;
  const state = loading ? "loading" : live > 0 ? "live" : cached > 0 ? "cached" : "snapshot";
  const dot = state === "live" ? "bg-pos" : state === "cached" ? "bg-warn" : "bg-text-3";
  const label =
    state === "loading" ? "CONNECTING" : state === "live" ? `LIVE ${live}/4` : state === "cached" ? "CACHED" : `DECK SNAPSHOT ${shortDate(SNAPSHOT_DATE).toUpperCase()}`;
  return (
    <Tip
      content={
        <div className="min-w-[260px]">
          <div className="text-text mb-1.5">Data feeds</div>
          {list.map((f) => (
            <div key={f.id} className="grid grid-cols-[86px_1fr_auto] gap-2 py-0.5 text-11">
              <span className="text-text-2">{f.label}</span>
              <span className="text-text-3 truncate">{f.source}</span>
              <span className={`mono ${f.status === "live" ? "c-pos" : f.status === "cached" ? "c-warn" : "text-text-3"}`}>{f.status.toUpperCase()}</span>
            </div>
          ))}
          <div className="mt-1.5 pt-1.5 border-t border-border text-11 text-text-3">
            Stress Engine always uses the deck baseline of {shortDate(SNAPSHOT_DATE)}. Repo, CPI, reserves, REER and flows come from the deck snapshot.
          </div>
        </div>
      }
    >
      <button className="btn mono text-11 h-[26px]" aria-label="Data status">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {label}
      </button>
    </Tip>
  );
}

function Clock() {
  const now = useNow();
  const t = now ? now.toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour12: false }) : "--:--:--";
  return (
    <span className="mono text-12 text-text-2 hide-sm" suppressHydrationWarning>
      {t} <span className="text-text-3">IST</span>
    </span>
  );
}

function WireToggle() {
  const on = useStore((s) => s.wire.enabled);
  const setWire = useStore((s) => s.setWire);
  const canUndo = useStore((s) => s.history.length > 0);
  const undo = useStore((s) => s.undo);
  return (
    <>
      <Tip content={on ? "Simulated news wire is ON. Click to pause." : "Simulated news wire is paused. Click to resume."}>
        <button className={`btn h-[26px] mono text-11 ${on ? "" : "opacity-60"}`} onClick={() => setWire(!on)} aria-pressed={on}>
          <Radio size={13} strokeWidth={1.5} className={on ? "c-warn" : ""} />
          WIRE {on ? "ON" : "OFF"}
        </button>
      </Tip>
      <Tip content="Undo last scenario change (Ctrl+Z)">
        <button className="btn h-[26px] px-2" onClick={undo} disabled={!canUndo} aria-label="Undo" style={{ opacity: canUndo ? 1 : 0.35 }}>
          <Undo2 size={13} strokeWidth={1.5} />
        </button>
      </Tip>
    </>
  );
}

export function TopBar() {
  const router = useRouter();
  const preset = useStore((s) => s.preset);
  const applyPreset = useStore((s) => s.applyPreset);
  const setPalette = useStore((s) => s.setPalette);
  const present = useStore((s) => s.present);
  const setPresent = useStore((s) => s.setPresent);
  const current = preset === "custom" ? "Custom scenario" : presetById(preset)!.label;

  return (
    <header className="topbar">
      <div className="flex items-center gap-3 min-w-0 shrink-0">
        <span className="w-2 h-4 bg-brand" aria-hidden />
        <span className="mono text-13 font-medium tracking-[0.06em] text-text">INR STRESS TERMINAL</span>
        <span className="w-px h-4 bg-border-2 hide-sm" />
        <span className="text-11 text-text-3 tracking-[0.04em] hide-sm whitespace-nowrap">THE BLACK SWANS · MacroMinds 3.0</span>
      </div>

      <button onClick={() => setPalette(true)} className="mx-auto flex items-center gap-2 h-[28px] w-full min-w-0 max-w-[420px] px-2.5 border border-border rounded-sm bg-panel text-text-3 text-12 hover:border-border-2 transition-colors duration-150 hide-sm">
        <Search size={14} strokeWidth={1.5} />
        <span className="truncate whitespace-nowrap">Search or press /</span>
        <span className="ml-auto flex items-center gap-1 mono text-10">
          <Command size={11} strokeWidth={1.5} />K
        </span>
      </button>

      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <StatusBadge />
        <WireToggle />
        <Clock />
        <DM.Root>
          <DM.Trigger asChild>
            <button className="btn h-[26px] max-w-[200px]" aria-label="Scenario">
              <span className="text-text-3 text-11">SCENARIO</span>
              <span className="truncate text-text">{current}</span>
              <ChevronDown size={12} strokeWidth={1.5} />
            </button>
          </DM.Trigger>
          <DM.Portal>
            <DM.Content align="end" sideOffset={6} className="tip p-1 min-w-[240px] max-w-none">
              {PRESETS.map((p, i) => (
                <DM.Item
                  key={p.id}
                  onSelect={() => {
                    applyPreset(p.id);
                    router.push(`/?preset=${p.id}`);
                  }}
                  className={`flex items-center gap-2 h-8 px-2 rounded-xs outline-none cursor-pointer data-[highlighted]:bg-bg ${p.tone === "ours" ? "c-brand" : "text-text-2"} data-[highlighted]:text-text`}
                >
                  <span className="mono text-10 text-text-3 w-3">{i + 1}</span>
                  {p.label}
                  {preset === p.id && <span className="ml-auto mono text-10 text-text-3">ACTIVE</span>}
                </DM.Item>
              ))}
            </DM.Content>
          </DM.Portal>
        </DM.Root>
        <button
          className={`btn h-[26px] ${present ? "primary" : ""}`}
          onClick={() => {
            if (!present) router.push("/");
            setPresent(!present);
          }}
          aria-pressed={present}
        >
          <MonitorPlay size={14} strokeWidth={1.5} />
          {present ? "Exit" : "Present"}
          <span className="mono text-10 opacity-60">F</span>
        </button>
      </div>
    </header>
  );
}
