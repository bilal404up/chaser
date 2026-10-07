"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function post(path: string, body: unknown = {}) {
  try {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { error: "Could not reach the server. Try again." } };
  }
}

export function BillingActions({ plan, hasCustomer, billingReady, proSwitch }: { plan: "free" | "pro"; hasCustomer: boolean; billingReady: boolean; proSwitch: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function go(path: string) {
    setBusy(true);
    setMessage(null);
    const r = await post(path);
    if (r.ok && r.data.url) {
      window.location.href = r.data.url;
      return;
    }
    setMessage(r.data.error ?? "Something went wrong.");
    setBusy(false);
  }
  async function demoSwitch(on: boolean) {
    setBusy(true);
    setMessage(null);
    const r = await post("/api/demo/pro", { on });
    setBusy(false);
    if (!r.ok) return setMessage(r.data.error ?? "Could not change the plan");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {plan === "free" ? (
          <button type="button" className="btn-primary" disabled={busy} onClick={() => go("/api/billing/checkout")}>
            Upgrade to Pro, $9 a month
          </button>
        ) : (
          <button type="button" className="btn-secondary" disabled={busy || !hasCustomer} onClick={() => go("/api/billing/portal")}>
            Manage subscription
          </button>
        )}
        {plan === "free" && <a href="/dashboard" className="text-[15px] underline underline-offset-4">Stay on Free</a>}
      </div>
      {!billingReady && (
        <p className="max-w-[60ch] rounded-sm border border-line-strong bg-paper-raised px-3 py-2 text-[14px] leading-5 text-ink-muted">
          Stripe is not connected to this demo yet, so the button above will say so. Checkout and the signed webhook are built and tested, and need Stripe test keys to run.
        </p>
      )}
      {proSwitch && (
        <div className="max-w-[60ch] rounded-sm border border-amber bg-amber-50 px-3 py-3 text-[14px] leading-5">
          <p className="font-semibold text-ink">Demo switch</p>
          <p className="mb-2 text-ink-muted">Not real billing. It changes this sample account&apos;s plan so you can see both versions. It exists only while Stripe is not connected.</p>
          <button type="button" className="btn-small" disabled={busy} onClick={() => demoSwitch(plan !== "pro")}>
            {plan === "pro" ? "Switch to Free (demo)" : "Switch to Pro (demo)"}
          </button>
        </div>
      )}
      {message && (
        <p role="alert" className="text-[14px] leading-5 text-error">
          {message}
        </p>
      )}
    </div>
  );
}
