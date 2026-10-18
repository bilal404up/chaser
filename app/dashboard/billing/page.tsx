import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import BillingActions from "@/components/BillingActions";
import PlanReceipt from "@/components/PlanReceipt";
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
      <main id="main" className="wrap-app pb-24 pt-10 md:pt-14">
        <h1 className="t-title">Plan</h1>
        <p className="mt-3 text-chalk">
          {pro ? "You are on Pro." : "You are on Free."}
          {renews ? ` Renews ${renews}.` : ""}
        </p>

        {searchParams.checkout === "success" ? (
          <p role="status" className="paper mt-6 max-w-copy rounded px-4 py-3 text-ink">
            Thanks. Your plan updates as soon as Stripe confirms the payment. Reload in a few seconds if it still says Free.
          </p>
        ) : null}
        {searchParams.checkout === "cancelled" ? (
          <p role="status" className="paper mt-6 max-w-copy rounded px-4 py-3 text-ink">
            Checkout was cancelled. Nothing was charged.
          </p>
        ) : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <section aria-label="Plans" className="grid gap-6 sm:grid-cols-2">
            <PlanReceipt plan="free" current={!pro} />
            <PlanReceipt plan="pro" current={pro}>
              {pro ? (
                <a href="/api/invoices/export" className="btn btn-secondary w-full">
                  Download CSV
                </a>
              ) : null}
            </PlanReceipt>
          </section>

          <section aria-labelledby="billing-title" className="rounded border border-[color:var(--c-desk-rule-strong)] bg-desk-2 p-6 lg:sticky lg:top-[calc(var(--header-h)+24px)]">
            <h2 id="billing-title" className="t-section">
              Billing
            </h2>
            <div className="mt-5">
              <BillingActions plan={p.plan} hasCustomer={!!p.stripe_customer_id} billingReady={billingConfigured()} proSwitch={proSwitchAvailable()} />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
