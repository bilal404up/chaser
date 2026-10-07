import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { service } from "@/lib/supabase/service";
import { sameOrigin } from "@/lib/http";
import { proSwitchAvailable } from "@/lib/demo";

/**
 * Demo only: switch your own account between free and pro without Stripe, so visitors can see the Pro features.
 * Answers 404 unless DEMO_MODE is "true" AND Stripe is not configured. With Stripe test keys set, this route is gone
 * and the only way to become Pro is a completed Checkout confirmed by the signed webhook.
 */
export async function POST(req: NextRequest) {
  if (!proSwitchAvailable()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!sameOrigin(req)) return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });
  const auth = await requireUser();
  if (auth.error) return auth.error;

  let on: unknown;
  try {
    on = (await req.json())?.on;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof on !== "boolean") return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { error } = await service()
    .from("ch_profiles")
    .update({ plan: on ? "pro" : "free", subscription_status: on ? "demo" : null })
    .eq("id", auth.user.id);
  if (error) return NextResponse.json({ error: "Could not change the plan" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
