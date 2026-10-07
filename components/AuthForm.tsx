"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/browser";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, display_name: name }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Could not create the account.");
      }
      const { error: signInError } = await browserClient().auth.signInWithPassword({ email, password });
      if (signInError) throw new Error(mode === "login" ? "That email and password do not match." : "Account created, but sign-in failed. Try logging in.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const bad = error ? true : undefined;
  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      {mode === "signup" && (
        <div>
          <label htmlFor="name" className="mb-1 block text-[14px] font-semibold">Your name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" className="field h-10" />
        </div>
      )}
      <div>
        <label htmlFor="email" className="mb-1 block text-[14px] font-semibold">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="field h-10" aria-invalid={bad} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-[14px] font-semibold">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} className="field h-10" aria-invalid={bad} aria-describedby={error ? "auth-error" : mode === "signup" ? "pw-help" : undefined} />
        {mode === "signup" && !error && <p id="pw-help" className="mt-1 text-[13px] leading-[18px] text-ink-subtle">At least 10 characters.</p>}
      </div>
      {error && (
        <p id="auth-error" role="alert" className="text-[14px] leading-5 text-error">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || !email || !password || (mode === "signup" && !name)} className="btn-primary w-full">
        {busy ? "One moment" : mode === "login" ? "Log in" : "Create account"}
      </button>
    </form>
  );
}
