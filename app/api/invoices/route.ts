import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { userClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/http";
import { validateInvoice } from "@/lib/validate";
import { FREE_OPEN_LIMIT } from "@/lib/plan";

const LIMIT_MESSAGE = `The free plan allows ${FREE_OPEN_LIMIT} open invoices. Mark one paid, or upgrade to Pro.`;

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });
  const auth = await requireUser();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const v = validateInvoice(body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  // Runs as the user, so row-level security and the free-plan trigger apply. user_id comes from the session, never from the request.
  const { data, error } = await userClient().from("ch_invoices").insert({ ...v.value, user_id: auth.user.id }).select("id").single();
  if (error) {
    if (/free_plan_limit/.test(error.message)) return NextResponse.json({ error: LIMIT_MESSAGE, code: "free_plan_limit" }, { status: 402 });
    return NextResponse.json({ error: "Could not save the invoice." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
