import Link from "next/link"
import AuthForm from "@/components/AuthForm"
import SiteHeader from "@/components/SiteHeader"

export const metadata = { title: "Create an account | Chaser" }

export default function SignupPage() {
  return (
    <>
      <SiteHeader show="login" />
      <main id="main" className="wrap pb-24 pt-12 md:pt-20">
        <section aria-labelledby="signup-title" className="sheet sheet--shadow mx-auto max-w-[26rem] px-6 pb-9 pt-8 md:px-8">
          <p className="t-meta text-ink-2">Chaser</p>
          <h1 id="signup-title" className="t-title mt-2">
            Create account
          </h1>
          <p className="t-small mt-3 text-ink-2">
            Accounts skip email confirmation in this demo. Use a throwaway password, not one you use anywhere else.
          </p>
          <div className="mt-7">
            <AuthForm mode="signup" />
          </div>
          <p className="t-small mt-7 border-t border-dashed border-[color:var(--c-ink-rule)] pt-5 text-ink-2">
            Already have an account?{" "}
            <Link href="/login" className="link font-semibold">
              Log in
            </Link>
            .
          </p>
        </section>
      </main>
    </>
  )
}
