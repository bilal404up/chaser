import { useId } from "react"
import { safeId } from "./util"

type Props = { className?: string; size?: number }

/** One faint coffee ring. Decorative, used once on the landing page. */
export function CoffeeRing({ className = "", size = 180 }: Props) {
  const fid = safeId(useId(), "ring")
  const r = size / 2
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={`pointer-events-none absolute ${className}`}>
      <defs>
        <filter id={fid} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="5" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter={`url(#${fid})`} fill="none" stroke="var(--c-ochre)" style={{ mixBlendMode: "multiply" }}>
        <circle cx={r} cy={r} r={r - 10} strokeWidth="7" opacity="0.14" />
        <circle cx={r} cy={r} r={r - 7} strokeWidth="1.5" opacity="0.22" />
        <path d={`M${r - 40} ${r + 60} q30 18 70 2`} strokeWidth="3" opacity="0.1" />
      </g>
    </svg>
  )
}
