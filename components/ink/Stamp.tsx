import { useId } from "react";
import { safeId, type CSSVars } from "./util";

type Ink = "stamp" | "carbon" | "ochre";

export type StampProps = {
  text: string;
  ink?: Ink;
  shape?: "box" | "ring";
  /** degrees; the CSS rotates the whole stamp by this */
  angle?: number;
  /** changes the ink-wear pattern so two stamps never match */
  seed?: number;
  width?: number;
  height?: number;
  /** second, smaller line (PaidStamp uses it for the paid date) */
  sub?: string;
  /** plays the stamp-slap animation on mount */
  fresh?: boolean;
  /** accessible name; omit to mark the stamp decorative */
  label?: string;
  className?: string;
};

/** Rubber stamp with uneven ink. The caller positions it with className (.stamp is position: absolute). */
export function Stamp({
  text,
  ink = "stamp",
  shape = "box",
  angle = -6,
  seed = 11,
  width = 116,
  height = 40,
  sub,
  fresh = false,
  label,
  className = "",
}: StampProps) {
  const fid = safeId(useId(), "wear");
  const color = `var(--c-${ink})`;
  const w = width;
  const h = height;
  const upper = text.toUpperCase();

  const mainSize = shape === "ring" ? Math.round(w * 0.22) : Math.round(Math.min(h * 0.5, ((w - 32) / Math.max(upper.length, 1)) * 1.3));
  const mainLength = shape === "ring" ? Math.round(w * 0.56) : w - 32;
  const mainY = sub ? h * 0.42 : h / 2;

  const style: CSSVars = { "--stamp-rot": `${angle}deg` };

  return (
    <svg
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
      focusable="false"
      className={`stamp ${className}`}
      data-fresh={fresh ? "true" : undefined}
      style={style}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
    >
      <defs>
        <filter id={fid} x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.7 1.3" result="w" />
          <feComposite in="d" in2="w" operator="in" />
        </filter>
      </defs>

      <g filter={`url(#${fid})`} fill="none" stroke={color} strokeLinejoin="round">
        {shape === "box" ? (
          <>
            <rect x={2} y={2} width={w - 4} height={h - 4} strokeWidth={3} />
            <rect x={7.5} y={7.5} width={w - 15} height={h - 15} strokeWidth={1.25} />
          </>
        ) : (
          <>
            <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) / 2 - 2} strokeWidth={2.5} />
            <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) / 2 - 6.5} strokeWidth={1} />
          </>
        )}

        <text
          x={w / 2}
          y={mainY}
          className="stamp-text"
          fill={color}
          stroke="none"
          fontSize={mainSize}
          textAnchor="middle"
          dominantBaseline="central"
          textLength={mainLength}
          lengthAdjust="spacingAndGlyphs"
        >
          {upper}
        </text>

        {sub ? (
          <text x={w / 2} y={h - 13} className="num" fill={color} stroke="none" fontSize={10} textAnchor="middle" dominantBaseline="central">
            {sub}
          </text>
        ) : null}
      </g>
    </svg>
  );
}

type PresetProps = Pick<StampProps, "fresh" | "className" | "seed" | "label">;

/** 8 to 29 days late. Mirrors the drawer's pre-selected Firm tone. */
export function FirmRing(props: PresetProps) {
  return <Stamp text="Firm" ink="ochre" shape="ring" angle={-4} width={56} height={56} label="Firm reminder" {...props} />;
}

/** 30 days late or more. Mirrors the drawer's pre-selected Final tone. */
export function FinalBox(props: PresetProps) {
  return <Stamp text="Final" ink="stamp" shape="box" angle={-5} width={104} height={38} label="Final notice" {...props} />;
}

/** Paid. `paidOn` is the already formatted date from the shared helper ("Sep 4, 2026"). */
export function PaidStamp({ paidOn, width = 136, height = 50, angle = -8, ...props }: PresetProps & { paidOn?: string; width?: number; height?: number; angle?: number }) {
  // The date line only fits on the full-size stamp; compact stamps leave the date to the strip's meta line.
  return (
    <Stamp text="Paid" ink="carbon" shape="box" angle={angle} width={width} height={height} sub={height >= 40 ? paidOn : undefined} label={paidOn ? `Paid on ${paidOn}` : "Paid"} {...props} />
  );
}
