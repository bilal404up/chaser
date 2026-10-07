import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";
import { BillingActions } from "@/components/BillingActions";
import { billingConfigured } from "@/lib/stripe";
import { proSwitchAvailable } from "@/lib/demo";
import { FREE_OPEN_LIMIT } from "@/lib/plan";
import { formatDay } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Plan | Chaser" };

export default async function Billing({ searchParams }: { searchParams: { checkout?: string } }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const p = user.profile;

  return (
    <>
      <AppHeader name={p.display_name} plan={p.plan} admin={p.is_admin} current="billing" />
      <main className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-[30px] leading-9">Plan</h1>
        <p className="mb-6 text-[15px] leading-[22px] text-ink-muted">
          You are on <strong className="text-ink">{p.plan === "pro" ? "Pro" : "Free"}</strong>
          {p.plan === "pro" && p.current_period_end ? `. Renews ${formatDay(p.current_period_end.slice(0, 10))}.` : "."}
        </p>
        {searchParams.checkout === "success" && (
          <p role="status" className="mb-6 rounded-sm border border-teal bg-teal-50 px-3 py-2 text-[14px] text-teal">
            Thanks. Your plan updates as soon as Stripe confirms the payment. Reload in a few seconds if it still says Free.
          </p>
        )}
        {searchParams.checkout === "cancelled" && <p className="mb-6 text-[14px] text-ink-muted">Checkout was cancelled. Nothing was charged.</p>}

        <div className="mb-8 grid max-w-[760px] gap-4 sm:grid-cols-2">
          <section className={`rounded-md border bg-paper-raised p-5 ${p.plan === "free" ? "border-ink" : "border-line"}`} aria-label="Free plan">
            <h2 className="text-[22px] leading-7">Free</h2>
            <p className="num mt-1 text-[28px] leading-8">$0</p>
            <ul className="mt-3 space-y-1 text-[15px] leading-[22px] text-ink-muted">
              <li>Up to {FREE_OPEN_LIMIT} open invoices</li>
              <li>Overdue list and reminder writer</li>
              <li>No CSV export</li>
            </ul>
          </section>
          <section className={`rounded-md border bg-paper-raised p-5 ${p.plan === "pro" ? "border-ink" : "border-line"}`} aria-label="Pro plan">
            <h2 className="text-[22px] leading-7">Pro</h2>
            <p className="num mt-1 text-[28px] leading-8">$9<span className="text-[15px] text-ink-subtle"> a month</span></p>
            <ul className="mt-3 space-y-1 text-[15px] leading-[22px] text-ink-muted">
              <li>Unlimited open invoices</li>
              <li>CSV export of every invoice</li>
              <li>Everything in Free</li>
            </ul>
            {p.plan === "pro" && (
              <p className="mt-3">
                <a href="/api/invoices/export" className="btn-small">Download CSV</a>
              </p>
            )}
          </section>
        </div>

        <BillingActions plan={p.plan} hasCustomer={!!p.stripe_customer_id} billingReady={billingConfigured()} proSwitch={proSwitchAvailable()} />
      </main>
    </>
  );
}
