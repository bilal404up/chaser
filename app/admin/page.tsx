import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { service } from "@/lib/supabase/service";
import { AppHeader } from "@/components/AppHeader";
import { formatUsd } from "@/lib/money";
import { PRO_PRICE_CENTS } from "@/lib/plan";
import { todayIso } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin | Chaser" };

export default async function Admin() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.profile.is_admin) redirect("/dashboard"); // checked on the server, from the database, every request

  const db = service();
  const today = todayIso();
  const [profiles, pro, invoices, overdue, recent] = await Promise.all([
    db.from("ch_profiles").select("id", { count: "exact", head: true }),
    db.from("ch_profiles").select("id", { count: "exact", head: true }).eq("plan", "pro"),
    db.from("ch_invoices").select("id", { count: "exact", head: true }),
    db.from("ch_invoices").select("id", { count: "exact", head: true }).eq("status", "open").lt("due_on", today),
    db.from("ch_profiles").select("display_name, plan, subscription_status, created_at").order("created_at", { ascending: false }).limit(10),
  ]);
  const proCount = pro.count ?? 0;

  return (
    <>
      <AppHeader name={user.profile.display_name} plan={user.profile.plan} admin current="admin" />
      <main className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-[30px] leading-9">Admin</h1>
        <p className="mb-6 max-w-[62ch] text-[15px] leading-[22px] text-ink-muted">Counts come straight from the database. Monthly recurring revenue is the number of Pro accounts times $9, and it includes the demo accounts.</p>
        <dl className="grid gap-px overflow-hidden rounded-md border border-ink bg-ink sm:grid-cols-5">
          {[
            ["Accounts", String(profiles.count ?? 0)],
            ["Pro accounts", String(proCount)],
            ["Monthly recurring revenue", formatUsd(proCount * PRO_PRICE_CENTS)],
            ["Invoices logged", String(invoices.count ?? 0)],
            ["Overdue right now", String(overdue.count ?? 0)],
          ].map(([k, v]) => (
            <div key={k} className="bg-paper-raised px-4 py-3">
              <dt className="text-[13px] leading-[18px] text-ink-muted">{k}</dt>
              <dd className="num mt-1 text-[26px] leading-8">{v}</dd>
            </div>
          ))}
        </dl>
        <h2 className="mb-3 mt-8 text-[20px] leading-7">Newest accounts</h2>
        <div className="overflow-x-auto rounded-md border border-ink bg-paper-raised">
          <table className="w-full text-left text-[15px]">
            <thead>
              <tr className="border-b border-ink text-[13px] text-ink-muted">
                <th className="px-4 py-2 font-semibold">Name</th>
                <th className="px-4 py-2 font-semibold">Plan</th>
                <th className="px-4 py-2 font-semibold">Subscription</th>
                <th className="px-4 py-2 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(recent.data ?? []).map((r, i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  <td className="px-4 py-2">{r.display_name}</td>
                  <td className="px-4 py-2 capitalize">{r.plan}</td>
                  <td className="px-4 py-2 text-ink-muted">{r.subscription_status ?? "none"}</td>
                  <td className="num px-4 py-2 text-[14px]">{String(r.created_at).slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] leading-[18px] text-ink-subtle">Email addresses are not shown here on purpose.</p>
      </main>
    </>
  );
}
