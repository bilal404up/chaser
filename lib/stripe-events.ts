import type Stripe from "stripe";

export interface ProfilePatch {
  plan?: "free" | "pro";
  stripe_customer_id?: string;
  stripe_subscription_id?: string | null;
  subscription_status?: string | null;
  current_period_end?: string | null;
}

/** What the webhook needs from the database. The route wires it to Supabase; tests use memory. */
export interface EventStore {
  /** Returns false if this event id was already claimed (so a repeat does nothing). */
  claim(eventId: string, type: string): Promise<boolean>;
  /** Frees a claim when applying failed, so Stripe's retry can try again. */
  release(eventId: string): Promise<void>;
  updateByUserId(userId: string, patch: ProfilePatch): Promise<void>;
  updateByCustomerId(customerId: string, patch: ProfilePatch): Promise<void>;
}

export interface Outcome {
  handled: boolean;
  duplicate?: boolean;
  note: string;
}

const ACTIVE = new Set(["active", "trialing", "past_due"]);

const iso = (unixSeconds?: number | null) => (unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null);
const idOf = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : v?.id);

/**
 * Applies one verified Stripe event. Plan changes happen here and nowhere else.
 * Idempotent: the same event id is applied once.
 */
export async function applyStripeEvent(event: Stripe.Event, store: EventStore): Promise<Outcome> {
  if (!(await store.claim(event.id, event.type))) return { handled: false, duplicate: true, note: "already processed" };
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.client_reference_id;
        const customer = idOf(s.customer as string | { id: string } | null);
        if (!userId || !customer || s.mode !== "subscription") return { handled: false, note: "not a subscription checkout for a user" };
        await store.updateByUserId(userId, {
          plan: "pro",
          stripe_customer_id: customer,
          stripe_subscription_id: idOf(s.subscription as string | { id: string } | null) ?? null,
          subscription_status: "active",
        });
        return { handled: true, note: "plan set to pro" };
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customer = idOf(sub.customer as string | { id: string });
        if (!customer) return { handled: false, note: "no customer" };
        await store.updateByCustomerId(customer, {
          plan: ACTIVE.has(sub.status) ? "pro" : "free",
          subscription_status: sub.status,
          stripe_subscription_id: sub.id,
          current_period_end: iso(sub.current_period_end),
        });
        return { handled: true, note: `subscription ${sub.status}` };
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customer = idOf(sub.customer as string | { id: string });
        if (!customer) return { handled: false, note: "no customer" };
        await store.updateByCustomerId(customer, { plan: "free", subscription_status: "canceled", stripe_subscription_id: null, current_period_end: null });
        return { handled: true, note: "plan set to free" };
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const customer = idOf(inv.customer as string | { id: string } | null);
        if (!customer) return { handled: false, note: "no customer" };
        await store.updateByCustomerId(customer, { subscription_status: "past_due" });
        return { handled: true, note: "marked past due" };
      }
      default:
        return { handled: false, note: `ignored ${event.type}` };
    }
  } catch (e) {
    await store.release(event.id);
    throw e;
  }
}
