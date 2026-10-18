import Link from "next/link";

type Props = { show?: "both" | "login" | "signup" };

/** Header for the public pages: wordmark left, account links right. */
export default function SiteHeader({ show = "both" }: Props) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded focus:bg-paper focus:px-4 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <header className="header">
        <div className="wrap flex min-h-[var(--header-h)] items-center justify-between gap-6">
          <Link href="/" className="wordmark">
            Chaser
          </Link>
          <nav aria-label="Account" className="flex items-center gap-2">
            {show !== "signup" ? (
              <Link href="/login" className="btn btn-small">
                Log in
              </Link>
            ) : null}
            {show !== "login" ? (
              <Link href="/signup" className="btn btn-small btn-secondary">
                Create account
              </Link>
            ) : null}
          </nav>
        </div>
      </header>
    </>
  );
}
