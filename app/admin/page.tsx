import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { formatUsd } from "@/lib/money";
import { PRO_PRICE_CENTS } from "@/lib/plan";
import { currentUser } from "@/lib/auth";
import { service } from "@/lib/supabase/service";
import { formatDay, todayIso } from "@/lib/dates";
import { DEMO_USERS, isDemoMode } from "@/lib/demo";
import { cleanName } from "@/lib/names";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin | Chaser" };

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div className="ledger-cell">
      <p className="t-label text-chalk">{label}</p>
      <p className="fig-md mt-3">{value}</p>
    </div>
  );
}

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.profile.is_admin) redirect("/dashboard"); // checked on the server, from the database, every request

  const db = service();
  const today = todayIso();
  // The demo admin is public, so in demo mode the table lists only the demo accounts, never a real sign-up.
  let newestQuery = db.from("ch_profiles").select("id, display_name, plan, subscription_status, created_at");
  if (isDemoMode()) newestQuery = newestQuery.in("display_name", Object.values(DEMO_USERS).map((u) => u.name));
  const [accounts, pro, invoices, overdue, recent] = await Promise.all([
    db.from("ch_profiles").select("id", { count: "exact", head: true }),
    db.from("ch_profiles").select("id", { count: "exact", head: true }).eq("plan", "pro"),
    db.from("ch_invoices").select("id", { count: "exact", head: true }),
    db.from("ch_invoices").select("id", { count: "exact", head: true }).eq("status", "open").lt("due_on", today),
    newestQuery.order("created_at", { ascending: false }).limit(10),
  ]);
  const accountCount = accounts.count ?? 0;
  const proCount = pro.count ?? 0;
  const invoiceCount = invoices.count ?? 0;
  const overdueCount = overdue.count ?? 0;
  const newest = recent.data ?? [];

  return (
    <>
      <AppHeader name={user.profile.display_name} plan={user.profile.plan} admin current="admin" />
      <main id="main" className="wrap-app pb-24 pt-10 md:pt-14">
        <h1 className="t-title">Admin</h1>

        <section aria-label="Figures" className="mt-8">
          <div className="ledger-cell">
            <p className="t-label text-chalk">Monthly recurring revenue</p>
            <p className="fig-xl mt-3">{formatUsd(proCount * PRO_PRICE_CENTS)}</p>
            <p className="t-small mt-2 text-chalk">Pro accounts times $9 a month. Includes the demo accounts.</p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4 md:gap-x-8">
            <Figure label="Accounts" value={accountCount} />
            <Figure label="Pro accounts" value={proCount} />
            <Figure label="Invoices logged" value={invoiceCount} />
            <Figure label="Overdue right now" value={overdueCount} />
          </div>
        </section>

        <section aria-labelledby="newest-title" className="mt-16">
          <div className="group-head">
            <h2 id="newest-title" className="t-section">
              Newest accounts
            </h2>
            <span className="fill" aria-hidden="true" />
          </div>
          <p className="t-small text-chalk">Email addresses are not shown here on purpose.</p>
          <div className="sheet sheet--shadow mt-5 overflow-x-auto">
            <table className="w-full sm:min-w-[34rem] border-collapse text-left text-[0.9375rem]">
              <thead>
                <tr className="border-b border-[color:var(--c-ink-rule)]">
                  <th scope="col" className="t-meta px-3 py-3.5 sm:px-5 font-medium text-ink-2">
                    Name
                  </th>
                  <th scope="col" className="t-meta px-3 py-3.5 sm:px-5 font-medium text-ink-2">
                    Plan
                  </th>
                  <th scope="col" className="t-meta hidden px-3 py-3.5 sm:px-5 font-medium text-ink-2 sm:table-cell">
                    Subscription
                  </th>
                  <th scope="col" className="t-meta px-3 py-3.5 sm:px-5 text-right font-medium text-ink-2">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr+tr]:border-t [&_tr+tr]:border-dashed [&_tr+tr]:border-[color:var(--c-ink-rule)]">
                {newest.map((a) => (
                  <tr key={a.id}>
                    <td className="px-3 py-3.5 sm:px-5 font-semibold">{cleanName(a.display_name)}</td>
                    <td className="px-3 py-3.5 sm:px-5">
                      <span className={`badge ${a.plan === "pro" ? "badge--pro" : ""}`}>{a.plan === "pro" ? "Pro" : "Free"}</span>
                    </td>
                    <td className="hidden px-3 py-3.5 sm:px-5 text-ink-2 sm:table-cell">{a.subscription_status ?? "none"}</td>
                    <td className="num px-3 py-3.5 sm:px-5 text-right">{formatDay(String(a.created_at).slice(0, 10))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
