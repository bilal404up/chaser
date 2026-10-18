"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cleanName } from "@/lib/names";

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
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded focus:bg-paper focus:px-4 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <header className="header">
        <div className="wrap-app flex flex-wrap items-center gap-x-8 md:min-h-[var(--header-h)]">
          <Link href="/dashboard" className="wordmark flex min-h-[var(--header-h)] items-center">
            Chaser
          </Link>

          <nav aria-label="Main" className="order-3 -mt-2 flex basis-full items-center gap-6 md:order-none md:mt-0 md:basis-auto">
            {items.map((it) => (
              <Link key={it.key} href={it.href} aria-current={current === it.key ? "page" : undefined} className="nav-tab">
                {it.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-3">
            <span className="t-small min-w-0 max-w-[8rem] truncate font-medium sm:max-w-[14rem]">{cleanName(name)}</span>
            <span className={`badge ${plan === "pro" ? "badge--pro" : ""}`}>{plan === "pro" ? "Pro" : "Free"}</span>
            <button type="button" className="btn btn-small btn-secondary" onClick={signOut} disabled={busy} data-busy={busy || undefined}>
              Sign out
            </button>
          </div>

          {error ? (
            <p role="alert" className="chip-error order-4 mb-2 basis-full">
              {error}
            </p>
          ) : null}
        </div>
      </header>
    </>
  );
}
