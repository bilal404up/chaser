import { useId } from "react";
import { safeId } from "./util";

type Props = {
  orientation?: "horizontal" | "vertical";
  /** hole colour: the surface showing through */
  dot?: string;
  /** when true, announces as a separator; otherwise decorative */
  separator?: boolean;
  className?: string;
};

export function Perforation({ orientation = "horizontal", dot = "var(--c-ink-faint)", separator = false, className = "" }: Props) {
  const pid = safeId(useId(), "perf");
  const horizontal = orientation === "horizontal";
  return (
    <svg
      role={separator ? "separator" : undefined}
      aria-hidden={separator ? undefined : "true"}
      aria-orientation={separator ? orientation : undefined}
      focusable="false"
      className={className}
      width={horizontal ? "100%" : 10}
      height={horizontal ? 10 : "100%"}
      style={{ display: "block" }}
    >
      <defs>
        <pattern id={pid} width={10} height={10} patternUnits="userSpaceOnUse">
          <circle cx={5} cy={5} r={1.6} fill={dot} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${pid})`} />
    </svg>
  );
}
