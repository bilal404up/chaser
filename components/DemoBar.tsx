"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Who = "free" | "pro" | "admin";
const WHO: { who: Who; label: string }[] = [
  { who: "free", label: "Free user" },
  { who: "pro", label: "Pro user" },
  { who: "admin", label: "Admin" },
];

/** Slim ribbon above the header. It sits in the page flow and scrolls away, so it never covers content. */
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
    <div className="demo-ribbon" role="region" aria-label="Demo controls">
      <div className="wrap flex flex-wrap items-center gap-x-4 gap-y-0 py-1 sm:min-h-[40px]">
        <p className="flex min-w-0 flex-1 items-center gap-3 py-1 text-[0.8125rem] leading-tight">
          <span className="badge badge--demo">Demo</span>
          <span className="min-w-0">Sample data. No real money moves.</span>
        </p>
        <div className="-ml-2.5 flex basis-full items-center gap-1 sm:ml-0 sm:basis-auto" role="group" aria-label="Sign in as">
          <span className="t-label hidden pr-1 sm:inline">Sign in as</span>
          {WHO.map(({ who, label }) => (
            <button key={who} type="button" className="ribbon-btn" onClick={() => signIn(who)} disabled={busy !== null} aria-busy={busy === who || undefined}>
              {busy === who ? "Signing in" : label}
            </button>
          ))}
        </div>
        {error ? (
          <p role="alert" className="chip-error mb-2 basis-full">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
