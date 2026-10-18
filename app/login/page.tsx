import Link from "next/link"
import AuthForm from "@/components/AuthForm"
import SiteHeader from "@/components/SiteHeader"

export const metadata = { title: "Log in | Chaser" }

export default function LoginPage() {
  return (
    <>
      <SiteHeader show="signup" />
      <main id="main" className="wrap pb-24 pt-12 md:pt-20">
        <section aria-labelledby="login-title" className="sheet sheet--shadow mx-auto max-w-[26rem] px-6 pb-9 pt-8 md:px-8">
          <p className="t-meta text-ink-2">Chaser</p>
          <h1 id="login-title" className="t-title mt-2">
            Log in
          </h1>
          <p className="t-small mt-3 text-ink-2">Your invoices are where you left them.</p>
          <div className="mt-7">
            <AuthForm mode="login" />
          </div>
          <p className="t-small mt-7 border-t border-dashed border-[color:var(--c-ink-rule)] pt-5 text-ink-2">
            New here?{" "}
            <Link href="/signup" className="link font-semibold">
              Create an account
            </Link>
            .
          </p>
        </section>
      </main>
    </>
  )
}
