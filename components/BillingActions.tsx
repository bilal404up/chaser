"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { plan: "free" | "pro"; hasCustomer: boolean; billingReady: boolean; proSwitch: boolean };
type Busy = "checkout" | "portal" | "switch" | null;

const NOT_CONNECTED = "Billing is not connected in this demo yet. Stripe test keys are needed.";

async function post(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export default function BillingActions({ plan, hasCustomer, billingReady, proSwitch }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState("");

  async function go(kind: "checkout" | "portal") {
    setBusy(kind);
    setError("");
    try {
      const { res, data } = await post(kind === "checkout" ? "/api/billing/checkout" : "/api/billing/portal");
      if (!res.ok || !data.url) {
        setError(data.error ?? NOT_CONNECTED);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function toggle() {
    setBusy("switch");
    setError("");
    try {
      const { res, data } = await post("/api/demo/pro", { on: plan !== "pro" });
      if (!res.ok) {
        setError(data.error ?? "The demo switch did not work. Try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-4">
      {plan === "free" ? (
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className="btn btn-carbon" onClick={() => go("checkout")} disabled={busy !== null} data-busy={busy === "checkout" || undefined}>
            Upgrade to Pro, $9 a month
          </button>
          <Link href="/dashboard" className="link">
            Stay on Free
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className="btn btn-primary" onClick={() => go("portal")} disabled={!hasCustomer || busy !== null} data-busy={busy === "portal" || undefined}>
            Manage subscription
          </button>
          {!hasCustomer ? <p className="hint">No Stripe customer is attached to this account yet.</p> : null}
        </div>
      )}

      {!billingReady ? (
        <p className="hint">Stripe is not connected in this demo. Checkout and the signed webhook need Stripe test keys before the upgrade button does anything real.</p>
      ) : null}

      {error ? (
        <p role="alert" className="chip-error">
          {error}
        </p>
      ) : null}

      {proSwitch ? (
        <section aria-labelledby="demo-switch-title" className="mt-2 bg-tape-aged p-4 ring-[1.5px] ring-inset ring-ink">
          <div className="flex items-center gap-3">
            <span className="demo-tag">Demo</span>
            <h3 id="demo-switch-title" className="t-strong">
              Demo switch
            </h3>
          </div>
          <p className="t-small mt-2 text-ink-muted">Flips this account between Free and Pro without Stripe. For the demo only.</p>
          <button type="button" className="btn btn-secondary mt-3" onClick={toggle} disabled={busy !== null} data-busy={busy === "switch" || undefined}>
            {plan === "pro" ? "Switch to Free (demo)" : "Switch to Pro (demo)"}
          </button>
        </section>
      ) : null}
    </div>
  );
}
