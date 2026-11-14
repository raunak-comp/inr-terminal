import { Activity, BookOpen, Building2, ChartLine, GitCompareArrows, Globe, History, Scale, Waypoints, type LucideIcon } from "lucide-react";

export type Group = "SIMULATE" | "MARKETS" | "POLICY" | "REFERENCE";
export const GROUPS: Group[] = ["SIMULATE", "MARKETS", "POLICY", "REFERENCE"];

export const NAV: { href: string; label: string; icon: LucideIcon; group: Group; cmd: string; desc: string }[] = [
  { href: "/", label: "Stress Engine", icon: Activity, group: "SIMULATE", cmd: "STRESS", desc: "Move a lever, see the economy react" },
  { href: "/transmission", label: "Transmission Lab", icon: Waypoints, group: "SIMULATE", cmd: "TRANSMISSION", desc: "How each shock travels" },
  { href: "/compare", label: "Scenario Compare", icon: GitCompareArrows, group: "SIMULATE", cmd: "COMPARE", desc: "All seven scenarios side by side" },
  { href: "/markets", label: "Markets", icon: ChartLine, group: "MARKETS", cmd: "MARKETS", desc: "Rupee, oil, rates, flows" },
  { href: "/macro", label: "Macro Pulse", icon: Globe, group: "MARKETS", cmd: "MACRO", desc: "Twin deficits and vulnerability" },
  { href: "/replay", label: "2026 Replay", icon: History, group: "MARKETS", cmd: "REPLAY", desc: "Replay the year, event by event" },
  { href: "/balance-sheets", label: "Balance Sheets", icon: Building2, group: "POLICY", cmd: "BALANCE", desc: "Corporate FX and bank funding" },
  { href: "/policy", label: "Policy Lab", icon: Scale, group: "POLICY", cmd: "POLICY", desc: "Ideal rupee, scorecard, roadmap" },
  { href: "/sources", label: "Sources & Assumptions", icon: BookOpen, group: "REFERENCE", cmd: "SOURCES", desc: "Data, coefficients, method" },
];
