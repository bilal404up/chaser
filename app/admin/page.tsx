import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { formatUsd } from "@/lib/money";
import { PRO_PRICE_CENTS } from "@/lib/plan";
import { currentUser } from "@/lib/auth";
import { service } from "@/lib/supabase/service";
import { todayIso } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin | Chaser" };

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div className="strip strip--stat">
      <p className="t-small text-ink-muted">{label}</p>
      <p className="fig-md mt-1">{value}</p>
    </div>
  );
}

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.profile.is_admin) redirect("/dashboard"); // checked on the server, from the database, every request

  const db = service();
  const today = todayIso();
  const [accounts, pro, invoices, overdue, recent] = await Promise.all([
    db.from("ch_profiles").select("id", { count: "exact", head: true }),
    db.from("ch_profiles").select("id", { count: "exact", head: true }).eq("plan", "pro"),
    db.from("ch_invoices").select("id", { count: "exact", head: true }),
    db.from("ch_invoices").select("id", { count: "exact", head: true }).eq("status", "open").lt("due_on", today),
    db.from("ch_profiles").select("id, display_name, plan, subscription_status, created_at").order("created_at", { ascending: false }).limit(10),
  ]);
  const accountCount = accounts.count ?? 0;
  const proCount = pro.count ?? 0;
  const invoiceCount = invoices.count ?? 0;
  const overdueCount = overdue.count ?? 0;
  const newest = recent.data ?? [];

  return (
    <>
      <AppHeader name={user.profile.display_name} plan={user.profile.plan} admin current="admin" />
      <main id="main" className="wrap pb-16 pt-8">
        <h1 className="t-title text-tape">Admin</h1>

        <section aria-label="Figures" className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] lg:items-end">
          <div>
            <p className="t-strong text-chalk">Monthly recurring revenue</p>
            <p className="fig-xl print-in mt-2 text-tape">{formatUsd(proCount * PRO_PRICE_CENTS)}</p>
            <p className="t-small mt-2 text-chalk">Pro accounts times $9 a month. Includes the demo accounts.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Figure label="Accounts" value={accountCount} />
            <Figure label="Pro accounts" value={proCount} />
            <Figure label="Invoices logged" value={invoiceCount} />
            <Figure label="Overdue right now" value={overdueCount} />
          </div>
        </section>

        <section aria-labelledby="newest-title" className="mt-12">
          <h2 id="newest-title" className="t-section text-tape">
            Newest accounts
          </h2>
          <p className="t-small mt-1 text-chalk">Email addresses are not shown here on purpose.</p>
          <div className="paper mt-4 overflow-x-auto p-2 shadow-stack">
            <table className="w-full min-w-[32rem] text-left text-ink">
              <thead>
                <tr className="t-small text-ink-muted">
                  <th scope="col" className="p-3 font-medium">
                    Name
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Plan
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Subscription
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr+tr]:border-t-2 [&_tr+tr]:border-dotted [&_tr+tr]:border-ink-faint">
                {newest.map((a) => (
                  <tr key={a.id}>
                    <td className="t-strong p-3">{a.display_name}</td>
                    <td className="p-3">{a.plan === "pro" ? "Pro" : "Free"}</td>
                    <td className="p-3">{a.subscription_status ?? "none"}</td>
                    <td className="num p-3">{String(a.created_at).slice(0, 10)}</td>
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
