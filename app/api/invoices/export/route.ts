import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { userClient } from "@/lib/supabase/server";
import { canExport } from "@/lib/plan";
import { toCsv } from "@/lib/csv";
import { formatUsd } from "@/lib/money";
import { daysOverdue, todayIso } from "@/lib/dates";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  if (!canExport(auth.user.profile.plan)) {
    return NextResponse.json({ error: "CSV export is part of the Pro plan.", code: "pro_required" }, { status: 402 });
  }
  const { data, error } = await userClient().from("ch_invoices").select("client_name, amount_cents, issued_on, due_on, status, paid_on, notes").order("due_on");
  if (error) return NextResponse.json({ error: "Could not load invoices." }, { status: 500 });

  const today = todayIso();
  const csv = toCsv(
    ["Client", "Amount", "Issued", "Due", "Status", "Days overdue", "Paid on", "Notes"],
    (data ?? []).map((r) => [
      r.client_name,
      formatUsd(r.amount_cents).replace("$", ""),
      r.issued_on,
      r.due_on,
      r.status,
      r.status === "open" ? Math.max(0, daysOverdue(r.due_on, today)) : 0,
      r.paid_on ?? "",
      r.notes,
    ])
  );
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="chaser-invoices.csv"', "Cache-Control": "no-store" },
  });
}
