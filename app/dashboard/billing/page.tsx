import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import BillingActions from "@/components/BillingActions";
import { SeverityLadder } from "@/components/ink";
import { formatDay } from "@/lib/dates";
import { currentUser } from "@/lib/auth";
import { billingConfigured } from "@/lib/stripe";
import { proSwitchAvailable } from "@/lib/demo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Plan | Chaser" };

type Search = { checkout?: string };

export default async function BillingPage({ searchParams }: { searchParams: Search }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const p = user.profile;
  const pro = p.plan === "pro";
  const renews = pro && p.current_period_end ? formatDay(p.current_period_end.slice(0, 10)) : null;

  return (
    <>
      <AppHeader name={p.display_name} plan={p.plan} admin={p.is_admin} current="billing" />
      <main id="main" className="wrap pb-16 pt-8">
        <h1 className="t-title text-tape">Plan</h1>
        <p className="mt-3 text-chalk">
          {pro ? "You are on Pro." : "You are on Free."}
          {renews ? ` Renews ${renews}.` : ""}
        </p>

        {searchParams.checkout === "success" ? (
          <p role="status" className="paper mt-6 max-w-copy p-4 text-ink">
            Thanks. Your plan updates as soon as Stripe confirms the payment. Reload in a few seconds if it still says Free.
          </p>
        ) : null}
        {searchParams.checkout === "cancelled" ? (
          <p role="status" className="paper mt-6 max-w-copy p-4 text-ink">
            Checkout was cancelled. Nothing was charged.
          </p>
        ) : null}

        <section aria-label="Plans" className="mt-10 grid gap-8 md:grid-cols-[minmax(0,22rem)_minmax(0,26rem)] md:items-start md:gap-0">
          <div className="plan-strip md:mt-16">
            <div className="flex items-center justify-between gap-3">
              <p className="t-strong">Free</p>
              {!pro ? <span className="t-micro rounded-cut bg-ink px-2 py-1 text-tape">Current plan</span> : null}
            </div>
            <p className="fig-md mt-2">$0</p>
            <ul className="mt-6 space-y-2">
              <li>Up to 5 open invoices</li>
              <li>Overdue list and reminder writer</li>
              <li>No CSV export</li>
            </ul>
          </div>

          <div className="plan-strip plan-strip--pro relative z-10 md:-ml-4">
            <div className="flex items-center justify-between gap-3">
              <p className="t-strong">Pro</p>
              {pro ? <span className="t-micro rounded-cut bg-carbon px-2 py-1 text-tape">Current plan</span> : null}
            </div>
            <p className="fig-md mt-2">
              $9 <span className="t-small font-body text-ink-muted">a month</span>
            </p>
            <ul className="mt-6 space-y-2">
              <li>Unlimited open invoices</li>
              <li>CSV export of every invoice</li>
              <li>Overdue list and reminder writer</li>
            </ul>
            {pro ? (
              <a href="/api/invoices/export" className="btn btn-secondary mt-6">
                Download CSV
              </a>
            ) : null}
          </div>
        </section>

        <section aria-labelledby="billing-title" className="pad mt-10 max-w-[40rem]">
          <h2 id="billing-title" className="t-section">
            Billing
          </h2>
          <div className="mt-5">
            <BillingActions plan={p.plan} hasCustomer={!!p.stripe_customer_id} billingReady={billingConfigured()} proSwitch={proSwitchAvailable()} />
          </div>
        </section>

        <section aria-labelledby="legend-title" className="mt-16 grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 id="legend-title" className="t-section text-tape">
              How a strip reads
            </h2>
            <p className="mt-3 max-w-[30ch] text-chalk">Paper ages, the tear gets rougher, and the number gets louder. The stamp tells you which tone the reminder will take.</p>
          </div>
          <SeverityLadder className="[--list-gap:12px]" />
        </section>
      </main>
    </>
  );
}
