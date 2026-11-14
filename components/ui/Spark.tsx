import { COLORS } from "@/components/charts/theme";

/** Tiny SVG sparkline. Flat area fill, 1.25 px line. */
export function Spark({ data, width = 40, height = 14, color = COLORS.text2, fill = false }: { data: number[]; width?: number; height?: number; color?: string; fill?: boolean }) {
  if (data.length < 2) return <svg width={width} height={height} aria-hidden><line x1="0" x2={width} y1={height / 2} y2={height / 2} stroke={COLORS.border2} strokeDasharray="2 2" /></svg>;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * width, height - 1 - ((v - min) / span) * (height - 2)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
  return (
    <svg width={width} height={height} aria-hidden className="shrink-0">
      {fill && <path d={`${d}L${width},${height}L0,${height}Z`} fill={color} opacity={0.1} />}
      <path d={d} fill="none" stroke={color} strokeWidth={1.25} strokeLinejoin="round" />
    </svg>
  );
}
