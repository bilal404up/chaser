import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="wrap flex min-h-[80dvh] flex-col justify-center py-16">
      <Link href="/" className="wordmark self-start">
        Chaser
      </Link>
      <div className="sheet sheet--shadow mt-10 max-w-[30rem] px-6 pb-9 pt-7 md:px-8">
        <p className="t-meta text-ink-2">Error 404</p>
        <h1 className="t-title mt-2">That page is not here.</h1>
        <p className="mt-3 text-ink-2">The address may be wrong, or the page has moved.</p>
        <Link href="/" className="btn btn-primary mt-7">
          Back to the start
        </Link>
      </div>
    </main>
  );
}
