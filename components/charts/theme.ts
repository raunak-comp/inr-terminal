export const COLORS = {
  bg: "#0A0A0B", panel: "#111113", panel2: "#16161A", border: "#24242A", border2: "#2E2E36",
  text: "#EDEDEF", text2: "#A3A3AD", text3: "#6C6C76",
  brand: "#B31B1A", brandSoft: "#ED8989", neg: "#F0555A", pos: "#3FB68B", warn: "#E0A84F", s2: "#6E9BD1", grid: "#1C1C21",
} as const;

export const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const MONO = "var(--font-plex-mono), ui-monospace, monospace";

/** Resolve the actual font family names at runtime for canvas renderers. */
export function fontFamily(kind: "mono" | "sans" = "mono") {
  if (typeof window === "undefined") return kind === "mono" ? "monospace" : "sans-serif";
  const v = getComputedStyle(document.documentElement).getPropertyValue(kind === "mono" ? "--font-plex-mono" : "--font-plex-sans").trim();
  return v || (kind === "mono" ? "monospace" : "sans-serif");
}
