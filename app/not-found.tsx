export default function NotFound() {
  return (
    <main className="mx-auto max-w-[480px] px-4 py-24">
      <h1 className="text-[32px] leading-[38px]">That page is not here.</h1>
      <p className="mt-2 text-[15px] leading-[22px] text-ink-muted">The link may be old, or the page moved.</p>
      <p className="mt-6">
        <a href="/" className="btn-secondary">Back to the start</a>
      </p>
    </main>
  );
}
