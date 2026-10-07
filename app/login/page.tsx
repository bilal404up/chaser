import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Log in | Chaser" };

export default function Login() {
  return (
    <main className="mx-auto max-w-[400px] px-4 py-16">
      <a href="/" className="font-display text-[24px] font-semibold">chaser</a>
      <h1 className="mt-8 text-[28px] leading-[34px]">Log in</h1>
      <AuthForm mode="login" />
      <p className="mt-6 text-[14px] leading-5 text-ink-muted">
        New here? <a href="/signup" className="font-semibold text-ink underline underline-offset-4">Create an account</a>
      </p>
    </main>
  );
}
