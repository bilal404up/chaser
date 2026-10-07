"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { name: string; plan: "free" | "pro"; admin: boolean; current: "dashboard" | "billing" | "admin" };

export default function AppHeader({ name, plan, admin, current }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const items: { href: string; label: string; key: Props["current"] }[] = [
    { href: "/dashboard", label: "Invoices", key: "dashboard" },
    { href: "/dashboard/billing", label: "Plan", key: "billing" },
    ...(admin ? [{ href: "/admin", label: "Admin", key: "admin" as const }] : []),
  ];

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      setError("Sign out did not go through. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="header">
      <div className="wrap flex flex-wrap items-center gap-x-6 gap-y-1 py-2">
        <Link href="/dashboard" className="wordmark text-tape">
          Chaser
        </Link>

        <nav aria-label="Main" className="order-3 -mx-2 flex basis-full items-center gap-1 md:order-none md:mx-0 md:basis-auto">
          {items.map((it) => (
            <Link key={it.key} href={it.href} aria-current={current === it.key ? "page" : undefined} className={`btn btn-small ${current === it.key ? "bg-blotter-raised" : ""}`}>
              {it.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="t-small max-w-[9rem] truncate md:max-w-none">{name}</span>
          <span className={`badge ${plan === "pro" ? "badge--pro" : ""}`}>{plan === "pro" ? "Pro" : "Free"}</span>
          <button type="button" className="btn btn-small" onClick={signOut} disabled={busy} data-busy={busy || undefined}>
            Sign out
          </button>
        </div>

        {error ? (
          <p role="alert" className="chip-error basis-full">
            {error}
          </p>
        ) : null}
      </div>
    </header>
  );
}
