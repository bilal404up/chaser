import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Create an account | Chaser" };

export default function Signup() {
  return (
    <main className="mx-auto max-w-[400px] px-4 py-16">
      <a href="/" className="font-display text-[24px] font-semibold">chaser</a>
      <h1 className="mt-8 text-[28px] leading-[34px]">Create an account</h1>
      <p className="mt-2 text-[14px] leading-5 text-ink-muted">This is a demo. Accounts skip email confirmation, and everything is sample data. Use a throwaway password.</p>
      <AuthForm mode="signup" />
      <p className="mt-6 text-[14px] leading-5 text-ink-muted">
        Already have one? <a href="/login" className="font-semibold text-ink underline underline-offset-4">Log in</a>
      </p>
    </main>
  );
}
