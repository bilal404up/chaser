"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Who = "free" | "pro" | "admin";
const WHO: { who: Who; label: string }[] = [
  { who: "free", label: "Free user" },
  { who: "pro", label: "Pro user" },
  { who: "admin", label: "Admin" },
];

export default function DemoBar() {
  const router = useRouter();
  const [busy, setBusy] = useState<Who | null>(null);
  const [error, setError] = useState("");

  async function signIn(who: Who) {
    setBusy(who);
    setError("");
    try {
      const res = await fetch("/api/demo/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ who }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Demo sign-in did not work. Try again.");
        return;
      }
      router.push(data.redirect ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="demo-bar" role="region" aria-label="Demo controls">
      <div className="wrap relative flex h-full flex-wrap items-center gap-x-4 gap-y-2 py-2">
        <span className="demo-tag">Demo</span>
        <p className="t-micro min-w-0 flex-1 leading-tight text-chalk">Sample data. Stripe test mode, no real money moves.</p>
        <div className="flex basis-full items-center gap-2 md:ml-auto md:basis-auto" role="group" aria-label="Sign in as">
          <span className="t-micro hidden text-chalk md:inline">Sign in as:</span>
          {WHO.map(({ who, label }) => (
            <button key={who} type="button" className="btn btn-small btn-secondary flex-1 md:flex-none" onClick={() => signIn(who)} disabled={busy !== null} data-busy={busy === who || undefined}>
              {busy === who ? "Signing in" : label}
            </button>
          ))}
        </div>
        {error ? (
          <p role="alert" className="chip-error absolute bottom-full left-4 right-4 mb-2 md:left-auto">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
