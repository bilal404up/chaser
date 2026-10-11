import type { CSSProperties } from "react"
import Link from "next/link"
import AuthForm from "@/components/AuthForm"

export const metadata = { title: "Log in | Chaser" }

export default function LoginPage() {
  return (
    <>
      <header className="header">
        <div className="wrap flex min-h-[var(--header-h)] items-center justify-between gap-4">
          <Link href="/" className="wordmark text-tape">
            Chaser
          </Link>
          <Link href="/signup" className="btn btn-small btn-secondary">
            Create account
          </Link>
        </div>
      </header>
      <main id="main" className="wrap relative pb-16 pt-12 md:pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-6 hidden md:block" aria-hidden="true">
          <i className="spill-piece" style={{ left: "6%", top: "40px", width: "30%", "--r": "-8deg" } as CSSProperties} />
          <i className="spill-piece" style={{ left: "66%", top: "160px", width: "28%", "--r": "5deg" } as CSSProperties} />
        </div>
        <section aria-labelledby="login-title" className="pad relative mx-auto max-w-[26rem]">
          <i className="tape-piece tape-piece--tl" aria-hidden="true" />
          <i className="tape-piece tape-piece--tr" aria-hidden="true" />
          <h1 id="login-title" className="t-title">
            Log in
          </h1>
          <p className="t-small mt-2 text-ink-muted">Back to the tape.</p>
          <div className="mt-6">
            <AuthForm mode="login" />
          </div>
          <p className="t-small mt-6 text-ink-muted">
            New here?{" "}
            <Link href="/signup" className="link">
              Create an account
            </Link>
            .
          </p>
        </section>
      </main>
    </>
  )
}
