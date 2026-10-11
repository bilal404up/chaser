import type { CSSProperties } from "react"
import Link from "next/link"
import AuthForm from "@/components/AuthForm"

export const metadata = { title: "Create an account | Chaser" }

export default function SignupPage() {
  return (
    <>
      <header className="header">
        <div className="wrap flex min-h-[var(--header-h)] items-center justify-between gap-4">
          <Link href="/" className="wordmark text-tape">
            Chaser
          </Link>
          <Link href="/login" className="btn btn-small btn-secondary">
            Log in
          </Link>
        </div>
      </header>
      <main id="main" className="wrap relative pb-16 pt-12 md:pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-6 hidden md:block" aria-hidden="true">
          <i className="spill-piece" style={{ left: "4%", top: "60px", width: "32%", "--r": "6deg" } as CSSProperties} />
          <i className="spill-piece" style={{ left: "64%", top: "140px", width: "30%", "--r": "-7deg" } as CSSProperties} />
        </div>
        <section aria-labelledby="signup-title" className="pad relative mx-auto max-w-[26rem]">
          <i className="tape-piece tape-piece--tl" aria-hidden="true" />
          <i className="tape-piece tape-piece--tr" aria-hidden="true" />
          <h1 id="signup-title" className="t-title">
            Create account
          </h1>
          <p className="t-small mt-3 text-ink-muted">
            Accounts skip email confirmation in this demo. Use a throwaway password, not one you use anywhere else.
          </p>
          <div className="mt-6">
            <AuthForm mode="signup" />
          </div>
          <p className="t-small mt-6 text-ink-muted">
            Already have an account?{" "}
            <Link href="/login" className="link">
              Log in
            </Link>
            .
          </p>
        </section>
      </main>
    </>
  )
}
