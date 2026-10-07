type Props = { className?: string };

/** The drawn check for the drawer's "Copied" state. */
export function Check({ className = "" }: Props) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20" width="18" height="18" className={className}>
      <path d="M4 10.5l4 4 8-9" className="check-draw" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
