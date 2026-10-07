import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { userClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/http";
import { todayIso } from "@/lib/dates";
import { FREE_OPEN_LIMIT } from "@/lib/plan";

const UUID = /^[0-9a-f-]{36}$/;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const auth = await requireUser();
  if (auth.error) return auth.error;

  let status: unknown;
  try {
    status = (await req.json())?.status;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (status !== "paid" && status !== "open") return NextResponse.json({ error: "Status must be paid or open." }, { status: 400 });

  const { data, error } = await userClient()
    .from("ch_invoices")
    .update({ status, paid_on: status === "paid" ? todayIso() : null })
    .eq("id", params.id)
    .select("id");
  if (error) {
    if (/free_plan_limit/.test(error.message)) {
      return NextResponse.json({ error: `The free plan allows ${FREE_OPEN_LIMIT} open invoices. Mark another paid, or upgrade to Pro.`, code: "free_plan_limit" }, { status: 402 });
    }
    return NextResponse.json({ error: "Could not update the invoice." }, { status: 500 });
  }
  if (!data || data.length === 0) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { data, error } = await userClient().from("ch_invoices").delete().eq("id", params.id).select("id");
  if (error) return NextResponse.json({ error: "Could not delete the invoice." }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
