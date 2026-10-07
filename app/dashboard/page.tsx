import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import Board, { type InvoiceRow } from "@/components/Board";
import { currentUser } from "@/lib/auth";
import { userClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoices | Chaser" };

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  // Runs as the signed-in user, so row-level security limits it to their own invoices.
  const { data, error } = await userClient()
    .from("ch_invoices")
    .select("id, client_name, amount_cents, issued_on, due_on, status, paid_on, notes")
    .order("due_on");

  return (
    <>
      <AppHeader name={user.profile.display_name} plan={user.profile.plan} admin={user.profile.is_admin} current="dashboard" />
      <main id="main" className="pb-16">
        <div className="wrap pt-8">
          <h1 className="t-section text-chalk">Invoices</h1>
          {error ? (
            <p role="alert" className="chip-error mt-4">
              Could not load your invoices. Reload the page.
            </p>
          ) : null}
        </div>
        <Board invoices={(data ?? []) as InvoiceRow[]} plan={user.profile.plan} senderName={user.profile.display_name} />
      </main>
    </>
  );
}
