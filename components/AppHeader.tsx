"use client";

import { useRouter } from "next/navigation";

export function AppHeader({ name, plan, admin, current }: { name: string; plan: "free" | "pro"; admin: boolean; current: "dashboard" | "billing" | "admin" }) {
  const router = useRouter();
  const link = (href: string, label: string, key: string) => (
    <a href={href} aria-current={current === key ? "page" : undefined} className={`px-1 py-1 text-[15px] ${current === key ? "font-semibold underline decoration-2 underline-offset-8" : "text-ink-muted hover:text-ink"}`}>
      {label}
    </a>
  );
  return (
    <header className="border-b border-ink bg-paper-raised">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <a href="/dashboard" className="font-display text-[24px] font-semibold leading-none">chaser</a>
          <nav aria-label="Main" className="flex items-center gap-4">
            {link("/dashboard", "Invoices", "dashboard")}
            {link("/dashboard/billing", "Plan", "billing")}
            {admin && link("/admin", "Admin", "admin")}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-[14px]">
          <span className="text-ink-muted">{name}</span>
          <span className={`rounded-xs border px-1.5 py-0.5 font-semibold ${plan === "pro" ? "border-teal bg-teal-50 text-teal" : "border-line-strong text-ink-muted"}`}>{plan === "pro" ? "Pro" : "Free"}</span>
          <button
            type="button"
            className="btn-small"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/");
              router.refresh();
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
