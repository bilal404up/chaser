import { NextResponse, type NextRequest } from "next/server";
import { service } from "@/lib/supabase/service";
import { verifyWebhook } from "@/lib/stripe";
import { applyStripeEvent, type EventStore, type ProfilePatch } from "@/lib/stripe-events";

export const runtime = "nodejs";

function dbStore(): EventStore {
  const db = service();
  const patch = (p: ProfilePatch) => ({ ...p });
  return {
    async claim(id, type) {
      const { error } = await db.from("ch_stripe_events").insert({ id, type });
      if (!error) return true;
      if (error.code === "23505") return false; // already claimed: a repeat delivery
      throw error;
    },
    async release(id) {
      await db.from("ch_stripe_events").delete().eq("id", id);
    },
    async updateByUserId(userId, p) {
      const { error } = await db.from("ch_profiles").update(patch(p)).eq("id", userId);
      if (error) throw error;
    },
    async updateByCustomerId(customerId, p) {
      const { error } = await db.from("ch_profiles").update(patch(p)).eq("stripe_customer_id", customerId);
      if (error) throw error;
    },
  };
}

/** The only place a plan can change. It needs a valid Stripe signature on the exact raw body. */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  let event;
  try {
    event = verifyWebhook(raw, req.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  try {
    const outcome = await applyStripeEvent(event, dbStore());
    return NextResponse.json({ received: true, ...outcome });
  } catch (e) {
    console.error("webhook failed", event.type, e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not apply the event" }, { status: 500 }); // Stripe retries
  }
}
