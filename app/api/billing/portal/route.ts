import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { sameOrigin } from "@/lib/http";
import { billingConfigured, getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });
  const auth = await requireUser();
  if (auth.error) return auth.error;
  if (!billingConfigured()) return NextResponse.json({ error: "Billing is not connected in this demo yet.", code: "billing_not_configured" }, { status: 503 });
  const customer = auth.user.profile.stripe_customer_id;
  if (!customer) return NextResponse.json({ error: "There is no subscription to manage yet." }, { status: 409 });
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const session = await getStripe().billingPortal.sessions.create({ customer, return_url: `${base}/dashboard/billing` });
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Could not open the billing portal. Try again." }, { status: 502 });
  }
}
