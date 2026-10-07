import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { service } from "@/lib/supabase/service";
import { sameOrigin } from "@/lib/http";
import { billingConfigured, getStripe } from "@/lib/stripe";
import { PRO_PRICE_CENTS } from "@/lib/plan";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });
  const auth = await requireUser();
  if (auth.error) return auth.error;
  if (!billingConfigured()) {
    return NextResponse.json({ error: "Billing is not connected in this demo yet. Stripe test keys are needed.", code: "billing_not_configured" }, { status: 503 });
  }
  if (auth.user.profile.plan === "pro") return NextResponse.json({ error: "You are already on Pro." }, { status: 409 });

  try {
    const stripe = getStripe();
    let customer = auth.user.profile.stripe_customer_id;
    if (!customer) {
      const created = await stripe.customers.create({ email: auth.user.email, metadata: { user_id: auth.user.id } });
      customer = created.id;
      await service().from("ch_profiles").update({ stripe_customer_id: customer }).eq("id", auth.user.id);
    }
    const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer,
      client_reference_id: auth.user.id,
      line_items: [
        {
          quantity: 1,
          price_data: { currency: "usd", unit_amount: PRO_PRICE_CENTS, recurring: { interval: "month" }, product_data: { name: "Chaser Pro (demo, test mode)" } },
        },
      ],
      success_url: `${base}/dashboard/billing?checkout=success`,
      cancel_url: `${base}/dashboard/billing?checkout=cancelled`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("checkout failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not start checkout. Try again." }, { status: 502 });
  }
}
