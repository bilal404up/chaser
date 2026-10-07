"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { browserClient } from "@/lib/supabase/browser";

type Props = { mode: "login" | "signup" };

async function errorText(res: Response) {
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    return String(data.error ?? data.message ?? text);
  } catch {
    return text || `Request failed (${res.status}).`;
  }
}

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const signup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = email.trim() !== "" && password !== "" && (!signup || name.trim() !== "");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (signup) {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, display_name: name }),
        });
        if (!res.ok) {
          setError(await errorText(res));
          return;
        }
      }
      const { error: signInError } = await browserClient().auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      {signup ? (
        <div>
          <label htmlFor="name" className="label">
            Name
          </label>
          <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </div>
      ) : null}
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" required />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input id="password" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={signup ? "new-password" : "current-password"} required />
      </div>
      <p role="alert" className={error ? "hint hint--error" : "sr-only"}>
        {error}
      </p>
      <button type="submit" className="btn btn-primary w-full" disabled={!ready || busy} data-busy={busy || undefined}>
        {busy ? "One moment" : signup ? "Create account" : "Log in"}
      </button>
    </form>
  );
}
