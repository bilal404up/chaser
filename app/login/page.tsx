import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Log in | Chaser" };

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
      <main id="main" className="wrap pb-16 pt-10 md:pt-16">
        <section aria-labelledby="login-title" className="pad mx-auto max-w-[26rem]">
          <h1 id="login-title" className="t-title">
            Log in
          </h1>
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
  );
}
