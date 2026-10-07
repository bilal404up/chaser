import { useId } from "react";
import { safeId } from "./util";

type Props = {
  tone?: "paper" | "blotter";
  /** 0 to 1 alpha of the speckle layer; 0.3 paper, 0.12 blotter are the defaults */
  intensity?: number;
  seed?: number;
  className?: string;
};

/** Live-filter grain for illustrations and the hero only. Strips use the cheaper CSS tile. */
export function Grain({ tone = "paper", intensity, seed = 7, className = "" }: Props) {
  const fid = safeId(useId(), "grain");
  const paper = tone === "paper";
  const alpha = intensity ?? (paper ? 0.3 : 0.12);
  const rgb = paper ? "0" : "1";
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ mixBlendMode: paper ? "multiply" : "screen" }}
    >
      <defs>
        <filter id={fid} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency={paper ? 0.9 : 0.55} numOctaves={paper ? 2 : 3} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="matrix" values={`0 0 0 0 ${rgb}  0 0 0 0 ${rgb}  0 0 0 0 ${rgb}  0 0 0 ${alpha} 0`} />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter={`url(#${fid})`} />
    </svg>
  );
}
