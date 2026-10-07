import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import Stripe from "stripe";
import { isDemoMode, isDemoWho, proSwitchAvailable } from "../lib/demo";

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:9";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "dummy";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "dummy";
  process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_unit_test_secret_value_long_enough";
  process.env.DEMO_PASSWORD = "a-long-demo-password";
  delete process.env.DEMO_MODE;
  delete process.env.CRON_SECRET;
});

const fakeKey = (kind: "live" | "test") => ["sk", kind, "a".repeat(26)].join("_"); // built at runtime: not a real key, and no key-shaped literal in source

const req = (path: string, method: string, body?: unknown, headers: Record<string, string> = {}) =>
  new NextRequest(`http://localhost${path}`, {
    method,
    headers: { host: "localhost", origin: "http://localhost", "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
const evil = { origin: "https://evil.example" };
const ID = "00000000-0000-0000-0000-000000000000";
const goodInvoice = { client_name: "Acme", amount_cents: 5000, issued_on: "2024-03-01", due_on: "2024-03-15" };

// ---- signed out: every data route says 401 ----
test("signed-out requests are refused on every data route", async () => {
  const inv = await import("../app/api/invoices/route");
  const one = await import("../app/api/invoices/[id]/route");
  const exp = await import("../app/api/invoices/export/route");
  const checkout = await import("../app/api/billing/checkout/route");
  const portal = await import("../app/api/billing/portal/route");
  assert.equal((await inv.POST(req("/api/invoices", "POST", goodInvoice))).status, 401);
  assert.equal((await one.PATCH(req(`/api/invoices/${ID}`, "PATCH", { status: "paid" }), { params: { id: ID } })).status, 401);
  assert.equal((await one.DELETE(req(`/api/invoices/${ID}`, "DELETE"), { params: { id: ID } })).status, 401);
  assert.equal((await exp.GET()).status, 401);
  assert.equal((await checkout.POST(req("/api/billing/checkout", "POST", {}))).status, 401);
  assert.equal((await portal.POST(req("/api/billing/portal", "POST", {}))).status, 401);
});

test("cross-site writes are refused before anything else", async () => {
  const inv = await import("../app/api/invoices/route");
  const one = await import("../app/api/invoices/[id]/route");
  const checkout = await import("../app/api/billing/checkout/route");
  const signup = await import("../app/api/auth/signup/route");
  const logout = await import("../app/api/auth/logout/route");
  assert.equal((await inv.POST(req("/api/invoices", "POST", goodInvoice, evil))).status, 403);
  assert.equal((await one.PATCH(req(`/api/invoices/${ID}`, "PATCH", { status: "paid" }, evil), { params: { id: ID } })).status, 403);
  assert.equal((await one.DELETE(req(`/api/invoices/${ID}`, "DELETE", undefined, evil), { params: { id: ID } })).status, 403);
  assert.equal((await checkout.POST(req("/api/billing/checkout", "POST", {}, evil))).status, 403);
  assert.equal((await signup.POST(req("/api/auth/signup", "POST", { email: "a@b.co", password: "x".repeat(12), display_name: "A" }, evil))).status, 403);
  assert.equal((await logout.POST(req("/api/auth/logout", "POST", {}, evil))).status, 403);
});

test("invoice ids must be real ids", async () => {
  const one = await import("../app/api/invoices/[id]/route");
  assert.equal((await one.PATCH(req("/api/invoices/not-an-id", "PATCH", { status: "paid" }), { params: { id: "not-an-id" } })).status, 400);
  assert.equal((await one.DELETE(req("/api/invoices/1%20or%201=1", "DELETE"), { params: { id: "1 or 1=1" } })).status, 400);
});

// ---- signup ----
test("signup rejects bad input before touching the database", async () => {
  const { POST } = await import("../app/api/auth/signup/route");
  const ok = { email: "new@example.com", password: "a-good-long-password", display_name: "New" };
  assert.equal((await POST(req("/api/auth/signup", "POST", "not json"))).status, 400);
  assert.equal((await POST(req("/api/auth/signup", "POST", { ...ok, email: "nope" }))).status, 400);
  assert.equal((await POST(req("/api/auth/signup", "POST", { ...ok, email: "a b@c.de" }))).status, 400);
  assert.equal((await POST(req("/api/auth/signup", "POST", { ...ok, password: "short" }))).status, 400);
  assert.equal((await POST(req("/api/auth/signup", "POST", { ...ok, password: "x".repeat(73) }))).status, 400);
  assert.equal((await POST(req("/api/auth/signup", "POST", { ...ok, display_name: "" }))).status, 400);
  assert.equal((await POST(req("/api/auth/signup", "POST", { ...ok, display_name: "n".repeat(61) }))).status, 400);
});

// ---- demo routes ----
test("demo routes are 404 unless DEMO_MODE is exactly true", async () => {
  const login = await import("../app/api/demo/login/route");
  const pro = await import("../app/api/demo/pro/route");
  assert.equal((await login.POST(req("/api/demo/login", "POST", { who: "admin" }))).status, 404);
  assert.equal((await pro.POST(req("/api/demo/pro", "POST", { on: true }))).status, 404);
  process.env.DEMO_MODE = "yes";
  assert.equal((await login.POST(req("/api/demo/login", "POST", { who: "admin" }))).status, 404);
  assert.equal(isDemoMode({ DEMO_MODE: "TRUE" }), false);
  assert.equal(isDemoMode({ DEMO_MODE: "true" }), true);
});

test("demo login refuses cross-site requests and unknown users", async () => {
  const login = await import("../app/api/demo/login/route");
  process.env.DEMO_MODE = "true";
  assert.equal((await login.POST(req("/api/demo/login", "POST", { who: "admin" }, evil))).status, 403);
  for (const who of ["root", "constructor", "__proto__", "", 1, null]) {
    assert.equal((await login.POST(req("/api/demo/login", "POST", { who }))).status, 400, String(who));
  }
  assert.equal(isDemoWho("toString"), false, "inherited property names are not demo users");
  delete process.env.DEMO_PASSWORD;
  assert.equal((await login.POST(req("/api/demo/login", "POST", { who: "free" }))).status, 500);
});

test("the try-Pro switch disappears once Stripe is configured", async () => {
  assert.equal(proSwitchAvailable({ DEMO_MODE: "true", STRIPE_SECRET_KEY: "sk_test_placeholder" }), true);
  assert.equal(proSwitchAvailable({ DEMO_MODE: "true", STRIPE_SECRET_KEY: fakeKey("test") }), false);
  assert.equal(proSwitchAvailable({ DEMO_MODE: "false", STRIPE_SECRET_KEY: "sk_test_placeholder" }), false);
  const pro = await import("../app/api/demo/pro/route");
  process.env.DEMO_MODE = "true";
  process.env.STRIPE_SECRET_KEY = fakeKey("test");
  assert.equal((await pro.POST(req("/api/demo/pro", "POST", { on: true }))).status, 404, "route gone with real keys");
});

test("the try-Pro switch needs a signed-in user and a same-site request", async () => {
  const pro = await import("../app/api/demo/pro/route");
  process.env.DEMO_MODE = "true";
  assert.equal((await pro.POST(req("/api/demo/pro", "POST", { on: true }, evil))).status, 403);
  assert.equal((await pro.POST(req("/api/demo/pro", "POST", { on: true }))).status, 401);
});

// ---- webhook route ----
test("the webhook route rejects forged, unsigned and mis-signed requests", async () => {
  const { POST } = await import("../app/api/stripe/webhook/route");
  const payload = JSON.stringify({ id: "evt_f", object: "event", type: "customer.subscription.deleted", data: { object: { customer: "cus_x" } } });
  const hook = (headers: Record<string, string>) => new NextRequest("http://localhost/api/stripe/webhook", { method: "POST", headers, body: payload });
  assert.equal((await POST(hook({}))).status, 400, "no signature");
  assert.equal((await POST(hook({ "stripe-signature": "t=1,v1=forged" }))).status, 400, "forged");
  const other = new Stripe("sk_test_unit_test_key_value_12345").webhooks.generateTestHeaderString({ payload, secret: "whsec_a_different_secret_value_here" });
  assert.equal((await POST(hook({ "stripe-signature": other }))).status, 400, "signed with another secret");
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_placeholder";
  const sameSecret = new Stripe("sk_test_unit_test_key_value_12345").webhooks.generateTestHeaderString({ payload, secret: "whsec_placeholder" });
  assert.equal((await POST(hook({ "stripe-signature": sameSecret }))).status, 400, "placeholder secret is never accepted");
});

// ---- cron ----
test("maintenance cron needs a real secret", async () => {
  const { GET } = await import("../app/api/cron/maintain/route");
  const call = (auth?: string) => GET(new NextRequest("http://localhost/api/cron/maintain", { headers: auth ? { authorization: auth } : {} }));
  assert.equal((await call()).status, 401);
  assert.equal((await call("Bearer undefined")).status, 401);
  process.env.CRON_SECRET = "a-real-cron-secret-value";
  assert.equal((await call("Bearer nope")).status, 401);
  process.env.CRON_SECRET = "";
  assert.equal((await call("Bearer ")).status, 401);
});
