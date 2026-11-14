"use client";
import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { BarChart, CustomChart, EffectScatterChart, GaugeChart, GraphChart, HeatmapChart, LineChart, LinesChart, PieChart, RadarChart, SankeyChart, ScatterChart, SunburstChart, TreemapChart } from "echarts/charts";
import { GridComponent, MarkAreaComponent, MarkLineComponent, MarkPointComponent, RadarComponent, TooltipComponent, VisualMapComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsCoreOption } from "echarts/core";
import { COLORS, fontFamily } from "./theme";

echarts.use([LineChart, BarChart, GaugeChart, GraphChart, PieChart, HeatmapChart, ScatterChart, CustomChart, EffectScatterChart, LinesChart, RadarChart, SankeyChart, SunburstChart, TreemapChart, RadarComponent, GridComponent, TooltipComponent, MarkLineComponent, MarkAreaComponent, MarkPointComponent, VisualMapComponent, CanvasRenderer]);

export type EOption = EChartsCoreOption;

type Props = { option: EOption; height: number | string; className?: string; onClick?: (p: { name?: string; dataIndex?: number; seriesIndex?: number }) => void };

export function EChart({ option, height, className, onClick }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);
  const [ready, setReady] = useState(false);
  const click = useRef(onClick);
  click.current = onClick;

  useEffect(() => {
    if (!el.current) return;
    const c = echarts.init(el.current, undefined, { renderer: "canvas" });
    chart.current = c;
    c.on("click", (p) => click.current?.(p as never));
    const ro = new ResizeObserver(() => c.resize());
    ro.observe(el.current);
    setReady(true);
    return () => {
      ro.disconnect();
      c.dispose();
      chart.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chart.current) return;
    const ff = fontFamily("mono");
    chart.current.setOption(
      {
        animation: true,
        animationDuration: 0,
        animationDurationUpdate: 180,
        animationEasingUpdate: "cubicOut",
        textStyle: { fontFamily: ff, color: COLORS.text3, fontSize: 11 },
        ...option,
      },
      { notMerge: false, lazyUpdate: true, replaceMerge: ["series"] }
    );
  }, [option, ready]);

  return (
    <div className={className} style={{ height, position: "relative" }}>
      {!ready && <div className="skeleton absolute inset-0" />}
      <div ref={el} className="absolute inset-0" />
    </div>
  );
}

// Shared option fragments
export const axisBase = {
  axisLine: { lineStyle: { color: COLORS.border } },
  axisTick: { show: false },
  axisLabel: { color: COLORS.text3, fontSize: 11 },
  splitLine: { lineStyle: { color: COLORS.grid } },
};

export const tooltipBase = {
  backgroundColor: COLORS.panel2,
  borderColor: COLORS.border2,
  borderWidth: 1,
  padding: [6, 8],
  textStyle: { color: COLORS.text2, fontSize: 11 },
  extraCssText: "border-radius:4px;box-shadow:none;",
};
