import type { CSSProperties } from "react";

/** CSSProperties that also accepts custom properties like --i or --stamp-rot. */
export type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

/** useId() output contains characters that are awkward inside url(#...) fragments. */
export function safeId(raw: string, prefix: string) {
  return `${prefix}-${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
