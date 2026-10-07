import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="wrap flex min-h-[70dvh] flex-col justify-center py-16">
      <Link href="/" className="wordmark self-start text-tape">
        Chaser
      </Link>
      <div className="empty mt-8 max-w-[30rem]">
        <h1 className="t-title">That page is not here.</h1>
        <p className="text-ink-muted">The address may be wrong, or the page has moved.</p>
        <Link href="/" className="btn btn-primary mt-2">
          Back to the start
        </Link>
      </div>
    </main>
  );
}
