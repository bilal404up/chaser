import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { userClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { Board, type InvoiceRow } from "@/components/Board";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoices | Chaser" };

export default async function Dashboard() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { data, error } = await userClient()
    .from("ch_invoices")
    .select("id, client_name, amount_cents, issued_on, due_on, status, paid_on, notes")
    .order("due_on");

  return (
    <>
      <AppHeader name={user.profile.display_name} plan={user.profile.plan} admin={user.profile.is_admin} current="dashboard" />
      <main className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-[30px] leading-9">Invoices</h1>
        <p className="mb-6 max-w-[60ch] text-[15px] leading-[22px] text-ink-muted">What you are owed, oldest first. Write a reminder for anything overdue, then mark it paid when the money lands.</p>
        {error ? (
          <p role="alert" className="rounded-md border border-error bg-paper-raised p-4 text-[15px] text-error">Could not load your invoices. Reload the page.</p>
        ) : (
          <Board invoices={(data ?? []) as InvoiceRow[]} plan={user.profile.plan} senderName={user.profile.display_name} />
        )}
      </main>
    </>
  );
}
