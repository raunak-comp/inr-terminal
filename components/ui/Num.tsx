"use client";
import { animate } from "framer-motion";
import { useEffect, useRef } from "react";

/** Number that tweens for 150 ms on change. No animation on first render. */
export function Num({ value, format, className }: { value: number; format: (v: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const fmt = useRef(format);
  fmt.current = format;

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value || !ref.current) {
      if (ref.current) ref.current.textContent = fmt.current(value);
      return;
    }
    const c = animate(from, value, {
      duration: 0.15,
      ease: "easeOut",
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = fmt.current(v);
      },
    });
    return () => c.stop();
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
