"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { GROUPS, NAV } from "./nav";
import { Tip } from "@/components/ui/Tip";

export function Sidebar() {
  const path = usePathname();
  const tel = useStore((s) => s.telemetry);
  const feeds = useStore((s) => s.feeds);
  const live = Object.values(feeds).filter((f) => f.status === "live").length;
  return (
    <nav className="sidebar" aria-label="Main">
      {GROUPS.map((g) => (
        <div key={g}>
          <div className="nav-group">{g}</div>
          {NAV.filter((n) => n.group === g).map((n) => {
            const i = NAV.indexOf(n) + 1;
            const Icon = n.icon;
            return (
              <Tip key={n.href} content={`${n.label} · key ${i}`} side="right">
                <Link href={n.href} className="nav-item" data-active={path === n.href} aria-label={n.label}>
                  <Icon size={16} strokeWidth={1.5} className="shrink-0" />
                  <span className="nav-label truncate">{n.label}</span>
                  <span className="kbd">{i}</span>
                </Link>
              </Tip>
            );
          })}
        </div>
      ))}
      <div className="telemetry mt-auto m-2 border border-border rounded-sm">
        <div className="px-2.5 h-7 flex items-center text-10 tracking-[0.1em] uppercase text-text-3 border-b border-border">System telemetry</div>
        <dl className="px-2.5 py-2 grid grid-cols-[1fr_auto] gap-y-1.5 text-11">
          <dt className="text-text-3">API latency</dt>
          <dd className="mono text-text-2 text-right">{tel.latencyMs === null ? "—" : `${tel.latencyMs} ms`}</dd>
          <dt className="text-text-3">Live feeds</dt>
          <dd className="mono text-text-2 text-right">{live} / 4</dd>
          <dt className="text-text-3">Last refresh</dt>
          <dd className="mono text-text-2 text-right">
            {tel.lastRefresh ? new Date(tel.lastRefresh).toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour12: false }) : "—"}
          </dd>
          <dt className="text-text-3">Model</dt>
          <dd className="mono text-text-2 text-right">v1.0</dd>
        </dl>
      </div>
    </nav>
  );
}
