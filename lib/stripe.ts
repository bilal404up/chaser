import Stripe from "stripe";

/** Billing is only ever used with Stripe TEST keys. A live key is refused on purpose. */
export function billingConfigured(env: Record<string, string | undefined> = process.env): boolean {
  const key = env.STRIPE_SECRET_KEY;
  return !!key && key.startsWith("sk_test_") && key.length > 20 && !key.includes("placeholder");
}

export function getStripe(env: Record<string, string | undefined> = process.env): Stripe {
  if (env.STRIPE_SECRET_KEY?.startsWith("sk_live_")) throw new Error("Live Stripe keys are not allowed in this demo");
  if (!billingConfigured(env)) throw new Error("Billing is not configured");
  return new Stripe(env.STRIPE_SECRET_KEY!, { typescript: true });
}

/** Checks the signature on the raw body. Throws if it does not match. */
export function verifyWebhook(rawBody: string, signature: string | null, secret: string): Stripe.Event {
  if (!signature) throw new Error("Missing signature");
  if (!secret || secret.includes("placeholder")) throw new Error("Webhook secret is not configured");
  return new Stripe("sk_test_unused_for_verification").webhooks.constructEvent(rawBody, signature, secret);
}
