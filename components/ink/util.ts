import type { CSSProperties } from "react";

/** CSSProperties that also accepts custom properties like --i or --stamp-rot. */
export type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

/** useId() output contains characters that are awkward inside url(#...) fragments. */
export function safeId(raw: string, prefix: string) {
  return `${prefix}-${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/** A small, stable hash of a string (djb2-style). Same key, same number, every render. */
export function hashKey(key: string): number {
  let h = 5381;
  for (let i = 0; i < key.length; i++) h = ((h * 33) ^ key.charCodeAt(i)) >>> 0;
  return h;
}

/** A hand-stamped tilt between -9 and 5 degrees, stable for one invoice or client. */
export function stampAngle(key: string): number {
  return -9 + (hashKey(key) % 15);
}

/** Which ink-wear pattern a stamp gets, stable for one invoice or client. */
export function stampSeed(key: string): number {
  return 1 + (hashKey(key) % 50);
}
