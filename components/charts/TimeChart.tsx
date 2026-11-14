"use client";
import { useEffect, useRef, useState } from "react";
import {
  AreaSeries, ColorType, createChart, createSeriesMarkers, CrosshairMode, LineSeries, LineStyle,
  type IChartApi, type ISeriesApi, type LineWidth, type MouseEventParams, type SeriesMarker, type Time, type UTCTimestamp,
} from "lightweight-charts";
import { useStore } from "@/lib/store";
import { COLORS, alpha, fontFamily } from "./theme";
import { dayMonth, num } from "@/lib/format";

export type TimePoint = [string, number];
export type EventMark = { date: string; label: string };
export type RefLine = { price: number; label: string; color?: string };

type Props = {
  data: TimePoint[];
  color?: string;
  area?: boolean;
  height: number;
  events?: EventMark[];
  refLines?: RefLine[];
  band?: { from: number; to: number; label: string };
  from?: string; // visible range start (ISO)
  decimals?: number;
  unit?: string;
  anchors?: boolean;
};

const ts = (iso: string) => (Date.parse(iso + "T00:00:00Z") / 1000) as UTCTimestamp;

export function TimeChart({ data, color = COLORS.brandSoft, area = true, height, events = [], refLines = [], band, from, decimals = 2, unit = "", anchors }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const series = useRef<ISeriesApi<"Area"> | ISeriesApi<"Line"> | null>(null);
  const bandSeries = useRef<ISeriesApi<"Line">[]>([]);
  const [tip, setTip] = useState<{ x: number; y: number; date: string; v: number; ev?: string } | null>(null);
  const [ready, setReady] = useState(false);
  const present = useStore((s) => s.present);
  const lw = (present ? 2 : 1.5) as LineWidth;

  useEffect(() => {
    if (!el.current) return;
    const c = createChart(el.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: COLORS.text3, fontFamily: fontFamily("mono"), fontSize: 11, attributionLogo: false },
      grid: { vertLines: { color: COLORS.grid }, horzLines: { color: COLORS.grid } },
      rightPriceScale: { borderColor: COLORS.border, scaleMargins: { top: 0.12, bottom: 0.08 } },
      timeScale: { borderColor: COLORS.border, fixLeftEdge: true, fixRightEdge: true, timeVisible: false },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: "#3A3A44", width: 1, style: LineStyle.Dashed, labelBackgroundColor: COLORS.panel2 },
        horzLine: { color: "#3A3A44", width: 1, style: LineStyle.Dashed, labelBackgroundColor: COLORS.panel2 },
      },
      handleScroll: false,
      handleScale: false,
    });
    chart.current = c;
    setReady(true);
    return () => {
      c.remove();
      chart.current = null;
      series.current = null;
      bandSeries.current = [];
    };
  }, []);

  useEffect(() => {
    const c = chart.current;
    if (!c || !ready) return;
    if (series.current) c.removeSeries(series.current);
    bandSeries.current.forEach((s) => c.removeSeries(s));
    bandSeries.current = [];

    const pts = data.map(([d, v]) => ({ time: ts(d), value: v }));
    const fmt = { type: "price" as const, precision: decimals, minMove: 1 / 10 ** decimals };
    const s = area
      ? c.addSeries(AreaSeries, { lineColor: color, topColor: alpha(color, 0.09), bottomColor: alpha(color, 0.09), lineWidth: lw, priceFormat: fmt, lastValueVisible: true, priceLineVisible: false, crosshairMarkerRadius: 3, crosshairMarkerBorderColor: COLORS.bg, pointMarkersVisible: anchors, pointMarkersRadius: 2.5 })
      : c.addSeries(LineSeries, { color, lineWidth: lw, priceFormat: fmt, lastValueVisible: true, priceLineVisible: false, crosshairMarkerRadius: 3, pointMarkersVisible: anchors, pointMarkersRadius: 2.5 });
    s.setData(pts);
    series.current = s;

    refLines.forEach((r) => s.createPriceLine({ price: r.price, color: r.color ?? COLORS.text3, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: r.label }));

    if (band && pts.length) {
      [band.from, band.to].forEach((v, i) => {
        const b = c.addSeries(LineSeries, { color: alpha(COLORS.brand, 0.9), lineWidth: 1, lineStyle: LineStyle.Solid, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false, title: i === 1 ? band.label : "" });
        b.setData(pts.map((p) => ({ time: p.time, value: v })));
        bandSeries.current.push(b);
      });
    }

    if (events.length && pts.length) {
      const first = pts[0].time as number;
      const last = pts[pts.length - 1].time as number;
      const markers: SeriesMarker<Time>[] = events
        .map((e, i) => ({ e, i, t: ts(e.date) as number }))
        .filter(({ t }) => t >= first && t <= last)
        .map(({ t, i }) => {
          // snap to nearest data point
          let best = pts[0].time as number;
          for (const p of pts) if (Math.abs((p.time as number) - t) < Math.abs(best - t)) best = p.time as number;
          return { time: best as UTCTimestamp, position: "aboveBar" as const, color: COLORS.text2, shape: "circle" as const, text: String(i + 1), size: 0.6 };
        });
      createSeriesMarkers(s, markers);
    }

    if (from && pts.length) {
      const f = Math.max(ts(from), pts[0].time as number);
      c.timeScale().setVisibleRange({ from: f as UTCTimestamp, to: pts[pts.length - 1].time });
    } else c.timeScale().fitContent();
  }, [data, color, area, events, refLines, band, from, decimals, ready, lw, anchors]);

  useEffect(() => {
    const c = chart.current;
    if (!c || !ready) return;
    const handler = (p: MouseEventParams<Time>) => {
      const s = series.current;
      if (!s || !p.point || !p.time || p.point.x < 0 || p.point.y < 0) return setTip(null);
      const d = p.seriesData.get(s) as { value?: number } | undefined;
      if (!d || d.value === undefined) return setTip(null);
      const t = p.time as number;
      const ev = events.find((e) => Math.abs(ts(e.date) - t) <= 4 * 86400);
      const iso = new Date(t * 1000).toISOString().slice(0, 10);
      setTip({ x: p.point.x, y: p.point.y, date: iso, v: d.value, ev: ev ? `${events.indexOf(ev) + 1}. ${ev.label}` : undefined });
    };
    c.subscribeCrosshairMove(handler);
    return () => c.unsubscribeCrosshairMove(handler);
  }, [events, ready]);

  return (
    <div className="relative" style={{ height }}>
      {!ready && <div className="skeleton absolute inset-0" />}
      <div ref={el} className="absolute inset-0" />
      {tip && (
        <div className="chart-tip" style={{ left: Math.min(tip.x + 12, (el.current?.clientWidth ?? 400) - 190), top: Math.max(4, tip.y - 44) }}>
          <div>
            {dayMonth(tip.date)} {tip.date.slice(0, 4)} · <b>{unit}{num(tip.v, decimals)}</b>
          </div>
          {tip.ev && <div className="c-warn mt-0.5">{tip.ev}</div>}
        </div>
      )}
    </div>
  );
}
