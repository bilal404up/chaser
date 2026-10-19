"use client";

import { useEffect, useState } from "react";
import { useInView } from "./useInView";

/* Counts from `from` to `value` once, when it scrolls into view.
   Server render and reduced motion show the final value. `format` turns the number into display text. */
export function CountUp({
  value,
  from = 0,
  ms = 900,
  delay = 0,
  format,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  from?: number;
  ms?: number;
  delay?: number;
  /** a function cannot cross from a server component, so pass prefix and suffix instead when rendering from a server page */
  format?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const fmt = format ?? ((n: number) => `${prefix}${Math.round(n)}${suffix}`);
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [n, setN] = useState(value);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now() + delay;
    setN(from);
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - t0) / ms));
      const eased = 1 - Math.pow(1 - p, 3);
      setN(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, from, ms, delay]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      <span aria-hidden="true">{fmt(n)}</span>
      <span className="sr-only">{fmt(value)}</span>
    </span>
  );
}
