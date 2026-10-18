"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { plan: "free" | "pro"; hasCustomer: boolean; billingReady: boolean; proSwitch: boolean };
type Busy = "checkout" | "portal" | "switch" | null;

const NOT_CONNECTED = "Stripe checkout is not connected yet.";

async function post(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function Status({ children }: { children: string }) {
  return (
    <p className="flex items-start gap-2.5 text-[0.9375rem] leading-snug text-chalk">
      <span aria-hidden="true" className="mt-[0.4em] block h-2 w-2 shrink-0 rounded-full bg-chalk" />
      {children}
    </p>
  );
}

/**
 * Real Stripe Checkout and Portal when test keys are set. Without keys, in demo mode, a demo switch flips the plan
 * so visitors can see Pro; no money moves either way.
 */
export default function BillingActions({ plan, hasCustomer, billingReady, proSwitch }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState("");
  const pro = plan === "pro";

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
      const { res, data } = await post("/api/demo/pro", { on: !pro });
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
    <div className="grid gap-5">
      {billingReady ? (
        <>
          <Status>Stripe Checkout in test mode. No card is charged.</Status>
          {!pro ? (
            <div className="grid gap-3">
              <button type="button" className="btn btn-carbon w-full" onClick={() => go("checkout")} disabled={busy !== null} data-busy={busy === "checkout" || undefined}>
                Upgrade to Pro, $9 a month
              </button>
              <Link href="/dashboard" className="link t-small self-center justify-self-center text-chalk">
                Stay on Free
              </Link>
            </div>
          ) : (
            <div className="grid gap-2">
              <button type="button" className="btn btn-primary w-full" onClick={() => go("portal")} disabled={!hasCustomer || busy !== null} data-busy={busy === "portal" || undefined}>
                Manage subscription
              </button>
              {!hasCustomer ? <p className="hint">No Stripe customer is attached to this account yet.</p> : null}
            </div>
          )}
        </>
      ) : proSwitch ? (
        <>
          <Status>Stripe checkout is off in this demo. Use the demo switch below to try Pro.</Status>
          <section aria-labelledby="demo-switch-title" className="grid gap-3 border-t border-[color:var(--c-desk-rule)] pt-5">
            <div className="flex items-center gap-3">
              <span className="badge badge--demo">Demo</span>
              <h3 id="demo-switch-title" className="t-strong">
                Demo upgrade
              </h3>
            </div>
            <p className="t-small text-chalk">Flips this account between Free and Pro. No card, no charge, no real money moves.</p>
            <button type="button" className={`btn w-full ${pro ? "btn-secondary" : "btn-primary"}`} onClick={toggle} disabled={busy !== null} data-busy={busy === "switch" || undefined}>
              {busy === "switch" ? "Switching" : pro ? "Switch back to Free (demo)" : "Try Pro (demo)"}
            </button>
          </section>
        </>
      ) : (
        <Status>{NOT_CONNECTED}</Status>
      )}

      {error ? (
        <p role="alert" className="chip-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
