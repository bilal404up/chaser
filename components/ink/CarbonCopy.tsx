import type { CSSProperties } from "react";
import { TEARS, type Roughness } from "./tears";

type Props = {
  roughness?: Roughness;
  offsetX?: number;
  offsetY?: number;
  tilt?: number;
  className?: string;
};

/** Offset duplicate behind any torn surface (the plan receipts, the hero). Strips use .strip--t3::after instead. */
export function CarbonCopy({ roughness = "ragged", offsetX = 4, offsetY = 6, tilt = 0, className = "" }: Props) {
  const t = TEARS[roughness];
  const mask = `var(--tear-${roughness}-top), var(--tear-${roughness}-bottom), linear-gradient(#000, #000)`;
  const size = `${t.w}px ${t.h}px, ${t.w}px ${t.h}px, 100% calc(100% - ${2 * t.h - 1}px)`;
  const position = `0 0, 0 100%, 0 ${t.h - 0.5}px`;
  const repeat = "repeat-x, repeat-x, no-repeat";

  const style: CSSProperties = {
    background: "var(--c-blotter-deep)",
    transform: `translate(${offsetX}px, ${offsetY}px) rotate(${tilt}deg)`,
    transformOrigin: "50% 50%",
    maskImage: mask,
    maskSize: size,
    maskPosition: position,
    maskRepeat: repeat,
    WebkitMaskImage: mask,
    WebkitMaskSize: size,
    WebkitMaskPosition: position,
    WebkitMaskRepeat: repeat,
  };

  return <div aria-hidden="true" className={`pointer-events-none absolute -inset-x-[3px] -inset-y-0.5 -z-20 ${className}`} style={style} />;
}
