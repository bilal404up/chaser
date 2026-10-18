"use client"

import { useEffect, useState } from "react"
import { countStyle } from "./tier"

type Props = {
  value: number
  prefix?: string
  suffix?: string
  /** ms before counting starts, so it can follow the strip feed */
  delay?: number
  duration?: number
  /** screen-reader text for the final value */
  label: string
  className?: string
  /** the count gets louder as it ticks: weight and width follow the current value */
  vary?: boolean
}

/** Renders the final value on the server; counts 0 to value once on mount unless motion is reduced. */
export function TickFigure({ value, prefix = "", suffix = "", delay = 0, duration = 700, label, className = "", vary = false }: Props) {
  const [n, setN] = useState(value)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    const start = performance.now() + delay
    setN(0)
    const step = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - start) / duration))
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(eased * value))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, delay, duration])

  return (
    <>
      <span className={className} style={vary ? countStyle(n) : undefined} aria-hidden="true">
        {prefix}
        {n}
        {suffix}
      </span>
      <span className="sr-only">{label}</span>
    </>
  )
}
