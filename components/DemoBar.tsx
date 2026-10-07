"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const WHO: Array<[string, string]> = [
  ["free", "Free user"],
  ["pro", "Pro user"],
  ["admin", "Admin"],
];

/** Fixed strip in demo mode: says the data is sample data and signs in as a sample user in one click. */
export function DemoBar() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function login(who: string) {
    if (busy) return;
    setBusy(who);
    setError(null);
    try {
      const res = await fetch("/api/demo/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ who }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not switch");
      router.push(data.redirect ?? "/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not switch");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div role="region" aria-label="Demo notice" className="fixed inset-x-0 bottom-0 z-50 flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-ink bg-paper-raised px-4 py-1.5 text-[13px] leading-[18px] text-ink-muted">
      <p>
        <span className="mr-2 rounded-xs bg-amber-solid px-1.5 py-0.5 font-semibold text-ink">Demo</span>
        <span className="hidden sm:inline">Sample data. Stripe test mode, no real money moves.</span>
        <span className="sm:hidden">Sample data. Test mode.</span>
      </p>
      <div className="flex items-center gap-2">
        <span>Sign in as</span>
        <div role="group" aria-label="Sign in as" className="flex overflow-hidden rounded-xs border border-ink">
          {WHO.map(([key, label]) => (
            <button key={key} type="button" disabled={busy !== null} onClick={() => login(key)} className="h-7 bg-paper-raised px-3 text-[13px] font-semibold text-ink hover:bg-paper-sunk disabled:opacity-60">
              {busy === key ? "Signing in" : label}
            </button>
          ))}
        </div>
        {error && (
          <span role="alert" className="text-error">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
