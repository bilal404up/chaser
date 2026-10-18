import { useId } from "react";
import { safeId } from "./util";

type Props = { label?: string; className?: string };

/** Empty state for "no invoices yet": an unopened roll with a short loose end. */
export function BlankRoll({ label = "An unopened roll of receipt paper", className = "" }: Props) {
  const id = useId();
  const body = safeId(id, "body");
  const tail = safeId(id, "tail");
  return (
    <svg role="img" aria-label={label} focusable="false" viewBox="0 0 260 150" width="100%" className={className}>
      <defs>
        <linearGradient id={body} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#1B1F24" stopOpacity="0.16" />
          <stop offset="0.3" stopColor="#1B1F24" stopOpacity="0" />
          <stop offset="1" stopColor="#1B1F24" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id={tail} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1B1F24" stopOpacity="0.1" />
          <stop offset="0.35" stopColor="#1B1F24" stopOpacity="0" />
          <stop offset="1" stopColor="#1B1F24" stopOpacity="0.06" />
        </linearGradient>
      </defs>

      <ellipse cx="118" cy="134" rx="92" ry="7" fill="var(--c-desk-deep)" />

      <path d="M118 24H212L208 34 216 44 209 54 217 64 210 74 218 84 211 94 217 104 209 114 215 126H118Z" fill="var(--c-paper)" />
      <path d="M118 24H212L208 34 216 44 209 54 217 64 210 74 218 84 211 94 217 104 209 114 215 126H118Z" fill={`url(#${tail})`} />
      <line x1="134" y1="52" x2="196" y2="52" stroke="var(--c-ink-faint)" strokeWidth="2" strokeDasharray="2 6" />
      <line x1="134" y1="98" x2="196" y2="98" stroke="var(--c-ink-faint)" strokeWidth="2" strokeDasharray="2 6" />

      <rect x="44" y="24" width="78" height="102" fill="var(--c-paper)" />
      <rect x="44" y="24" width="78" height="102" fill={`url(#${body})`} />

      <ellipse cx="44" cy="75" rx="24" ry="51" fill="var(--c-paper-2)" />
      <ellipse cx="44" cy="75" rx="18" ry="39" fill="none" stroke="var(--c-ink-faint)" strokeWidth="1" />
      <ellipse cx="44" cy="75" rx="12" ry="26" fill="none" stroke="var(--c-ink-faint)" strokeWidth="1" />
      <ellipse cx="44" cy="75" rx="6" ry="13" fill="var(--c-desk-deep)" />
    </svg>
  );
}
