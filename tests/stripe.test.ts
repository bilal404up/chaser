import { test } from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { applyStripeEvent, type EventStore, type ProfilePatch } from "../lib/stripe-events";
import { verifyWebhook, billingConfigured, getStripe } from "../lib/stripe";

const fakeKey = (kind: "live" | "test") => ["sk", kind, "a".repeat(26)].join("_"); // built at runtime: not a real key, and no key-shaped literal in source
const SECRET = "whsec_test_secret_for_unit_tests_only";
const stripe = new Stripe("sk_test_unit_test_key_value_12345");

function signed(payload: object, secret = SECRET) {
  const body = JSON.stringify(payload);
  const header = stripe.webhooks.generateTestHeaderString({ payload: body, secret });
  return { body, header };
}

function memoryStore(failOnce = false) {
  const claimed = new Set<string>();
  const log: Array<{ by: string; id: string; patch: ProfilePatch }> = [];
  let failed = false;
  const store: EventStore = {
    async claim(id) {
      if (claimed.has(id)) return false;
      claimed.add(id);
      return true;
    },
    async release(id) {
      claimed.delete(id);
    },
    async updateByUserId(id, patch) {
      if (failOnce && !failed) {
        failed = true;
        throw new Error("database down");
      }
      log.push({ by: "user", id, patch });
    },
    async updateByCustomerId(id, patch) {
      log.push({ by: "customer", id, patch });
    },
  };
  return { store, log, claimed };
}

const evt = (type: string, object: object, id = "evt_1") => ({ id, type, object: "event", data: { object } }) as unknown as Stripe.Event;

// ---- signatures ----
test("a correctly signed event verifies", () => {
  const { body, header } = signed({ id: "evt_ok", object: "event", type: "customer.subscription.deleted", data: { object: {} } });
  assert.equal(verifyWebhook(body, header, SECRET).id, "evt_ok");
});

test("a forged, missing or wrong-secret signature is rejected", () => {
  const { body } = signed({ id: "evt_x", object: "event", type: "x", data: { object: {} } });
  assert.throws(() => verifyWebhook(body, "t=1,v1=deadbeef", SECRET));
  assert.throws(() => verifyWebhook(body, null, SECRET));
  const other = signed({ id: "evt_x", object: "event", type: "x", data: { object: {} } }, "whsec_a_different_secret_entirely");
  assert.throws(() => verifyWebhook(other.body, other.header, SECRET), "signed with another secret");
  assert.throws(() => verifyWebhook(body, "anything", ""), "no secret configured");
  assert.throws(() => verifyWebhook(body, "anything", "whsec_placeholder"), "placeholder secret");
});

test("a tampered body fails verification", () => {
  const { body, header } = signed({ id: "evt_t", object: "event", type: "x", data: { object: { amount: 1 } } });
  assert.throws(() => verifyWebhook(body.replace('"amount":1', '"amount":2'), header, SECRET));
});

test("live Stripe keys are refused and placeholders count as unconfigured", () => {
  assert.equal(billingConfigured({ STRIPE_SECRET_KEY: "sk_test_placeholder" }), false);
  assert.equal(billingConfigured({}), false);
  assert.equal(billingConfigured({ STRIPE_SECRET_KEY: fakeKey("live") }), false);
  assert.equal(billingConfigured({ STRIPE_SECRET_KEY: fakeKey("test") }), true);
  assert.throws(() => getStripe({ STRIPE_SECRET_KEY: fakeKey("live") }), /Live Stripe keys/);
});

// ---- plan changes ----
test("a completed checkout sets the user to pro and stores the Stripe ids", async () => {
  const { store, log } = memoryStore();
  const out = await applyStripeEvent(evt("checkout.session.completed", { mode: "subscription", client_reference_id: "user-1", customer: "cus_1", subscription: "sub_1" }), store);
  assert.equal(out.handled, true);
  assert.deepEqual(log[0], { by: "user", id: "user-1", patch: { plan: "pro", stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1", subscription_status: "active" } });
});

test("a checkout without a user or that is not a subscription changes nothing", async () => {
  const { store, log } = memoryStore();
  assert.equal((await applyStripeEvent(evt("checkout.session.completed", { mode: "subscription", customer: "cus_1" }, "e1"), store)).handled, false);
  assert.equal((await applyStripeEvent(evt("checkout.session.completed", { mode: "payment", client_reference_id: "u", customer: "c" }, "e2"), store)).handled, false);
  assert.equal(log.length, 0);
});

test("subscription status decides the plan", async () => {
  const cases: Array<[string, string]> = [["active", "pro"], ["trialing", "pro"], ["past_due", "pro"], ["canceled", "free"], ["unpaid", "free"], ["incomplete_expired", "free"]];
  for (const [status, plan] of cases) {
    const { store, log } = memoryStore();
    await applyStripeEvent(evt("customer.subscription.updated", { id: "sub_1", customer: "cus_1", status, current_period_end: 1893456000 }, `e-${status}`), store);
    assert.equal(log[0].patch.plan, plan, status);
    assert.equal(log[0].patch.subscription_status, status);
  }
});

test("a deleted subscription drops the user back to free", async () => {
  const { store, log } = memoryStore();
  await applyStripeEvent(evt("customer.subscription.deleted", { id: "sub_1", customer: "cus_1" }), store);
  assert.equal(log[0].patch.plan, "free");
  assert.equal(log[0].patch.stripe_subscription_id, null);
});

test("a failed payment marks the account past due without changing the plan", async () => {
  const { store, log } = memoryStore();
  await applyStripeEvent(evt("invoice.payment_failed", { customer: "cus_1" }), store);
  assert.deepEqual(log[0].patch, { subscription_status: "past_due" });
});

test("unrelated events are ignored", async () => {
  const { store, log } = memoryStore();
  const out = await applyStripeEvent(evt("charge.succeeded", {}), store);
  assert.equal(out.handled, false);
  assert.equal(log.length, 0);
});

// ---- idempotency ----
test("the same event delivered twice is applied once", async () => {
  const { store, log } = memoryStore();
  const e = evt("customer.subscription.deleted", { id: "sub_1", customer: "cus_1" }, "evt_dup");
  const first = await applyStripeEvent(e, store);
  const second = await applyStripeEvent(e, store);
  assert.equal(first.handled, true);
  assert.equal(second.duplicate, true);
  assert.equal(log.length, 1);
});

test("if applying fails, the claim is released so Stripe's retry works", async () => {
  const { store, log, claimed } = memoryStore(true);
  const e = evt("checkout.session.completed", { mode: "subscription", client_reference_id: "user-1", customer: "cus_1", subscription: "sub_1" }, "evt_retry");
  await assert.rejects(applyStripeEvent(e, store), /database down/);
  assert.equal(claimed.has("evt_retry"), false, "claim released");
  const again = await applyStripeEvent(e, store);
  assert.equal(again.handled, true);
  assert.equal(log.length, 1);
});
