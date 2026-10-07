import { useId } from "react";
import { TEARS, TEAR_LEFT, type Roughness } from "./tears";
import { safeId } from "./util";

type Props = {
  edge?: "top" | "bottom" | "left";
  roughness?: Roughness;
  /** any CSS colour; defaults to paper */
  fill?: string;
  className?: string;
};

/** SVG tear for places that are not CSS-masked. Decorative, always aria-hidden. */
export function TornEdge({ edge = "top", roughness = "fine", fill = "var(--c-tape)", className = "" }: Props) {
  const pid = safeId(useId(), "tear");

  if (edge === "left") {
    const { w, h, d } = TEAR_LEFT;
    return (
      <svg aria-hidden="true" focusable="false" className={className} width={w} height="100%" style={{ display: "block" }}>
        <defs>
          <pattern id={pid} width={w} height={h} patternUnits="userSpaceOnUse">
            <path d={d} fill={fill} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${pid})`} />
      </svg>
    );
  }

  const t = TEARS[roughness];
  const d = edge === "top" ? t.top : t.bottom;
  return (
    <svg aria-hidden="true" focusable="false" className={className} width="100%" height={t.h} style={{ display: "block" }}>
      <defs>
        <pattern id={pid} width={t.w} height={t.h} patternUnits="userSpaceOnUse">
          <path d={d} fill={fill} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${pid})`} />
    </svg>
  );
}
