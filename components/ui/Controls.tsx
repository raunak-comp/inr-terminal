"use client";
import { RotateCcw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

type SliderProps = {
  label: string; unit: string; value: number; min: number; max: number; step: number; def: number;
  onChange: (v: number) => void; scale?: [string, string]; decimals?: number;
};

export function Slider({ label, unit, value, min, max, step, def, onChange, scale, decimals = 0 }: SliderProps) {
  const [text, setText] = useState(value.toFixed(decimals));
  useEffect(() => setText(value.toFixed(decimals)), [value, decimals]);
  const pos = (v: number) => ((v - min) / (max - min)) * 100;
  const zero = Math.min(Math.max(def, min), max);
  const a = Math.min(pos(value), pos(zero));
  const b = Math.max(pos(value), pos(zero));
  const commit = () => {
    const v = Number(text.replace("−", "-"));
    if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)));
    else setText(value.toFixed(decimals));
  };
  return (
    <div className="ctl">
      <div className="ctl-top">
        <label className="ctl-label">{label}</label>
        <div className="flex items-center gap-1">
          <div className="ctl-input">
            <input aria-label={`${label} value`} value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()} inputMode="decimal" />
            <span>{unit}</span>
          </div>
          <button className="reset" aria-label={`Reset ${label}`} disabled={value === def} onClick={() => onChange(def)}>
            <RotateCcw size={12} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div className="range">
        <div className="track" />
        <div className="fill" style={{ left: `${a}%`, width: `${b - a}%` }} />
        <div className="tick" style={{ left: `calc(${pos(zero)}% - 0.5px)` }} title="Default" />
        <input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      </div>
      {scale && (
        <div className="range-scale">
          <span>{scale[0]}</span>
          <span>{scale[1]}</span>
        </div>
      )}
    </div>
  );
}

export function Segmented<T extends string | number>({ options, value, onChange, label }: { options: { v: T; l: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.v)} role="radio" aria-checked={o.v === value} data-active={o.v === value} onClick={() => onChange(o.v)}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <button className="toggle" role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span className="ctl-label whitespace-normal">{children}</span>
      <span className="switch" data-on={on} />
    </button>
  );
}

export function Tabs<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="tabs">
      {options.map((o) => (
        <button key={o} data-active={o === value} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}
