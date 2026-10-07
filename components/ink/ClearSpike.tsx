type Props = { label?: string; className?: string };

/** Empty state for "nothing paid yet": a receipt spike with nothing on it. */
export function ClearSpike({ label = "An empty receipt spike", className = "" }: Props) {
  return (
    <svg role="img" aria-label={label} focusable="false" viewBox="0 0 160 170" width="100%" className={className}>
      <ellipse cx="80" cy="152" rx="52" ry="9" fill="var(--c-blotter-deep)" />
      <path d="M36 142Q80 110 124 142Z" fill="var(--c-chalk)" />
      <ellipse cx="80" cy="142" rx="44" ry="9" fill="var(--c-chalk)" stroke="var(--c-blotter-deep)" strokeWidth="1" />
      <ellipse cx="80" cy="140" rx="10" ry="2.5" fill="var(--c-blotter-deep)" />
      <rect x="78.5" y="20" width="3" height="120" fill="var(--c-chalk)" />
      <path d="M78.5 20L80 6 81.5 20Z" fill="var(--c-tape)" />
    </svg>
  );
}
