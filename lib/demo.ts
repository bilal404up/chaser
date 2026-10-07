import { billingConfigured } from "./stripe";

export const DEMO_USERS = {
  free: { email: "free@chaser.test", name: "Alex (free plan)", plan: "free" as const, admin: false },
  pro: { email: "pro@chaser.test", name: "Sam (pro plan)", plan: "pro" as const, admin: false },
  admin: { email: "admin@chaser.test", name: "Demo admin", plan: "pro" as const, admin: true },
};
export type DemoWho = keyof typeof DEMO_USERS;

/** Demo mode is off unless DEMO_MODE is exactly "true". Only for deployments that hold sample data. */
export function isDemoMode(env: Record<string, string | undefined> = process.env): boolean {
  return env.DEMO_MODE === "true";
}

export function isDemoWho(v: unknown): v is DemoWho {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(DEMO_USERS, v);
}

/** The "try Pro" switch exists only in demo mode and only while Stripe is NOT configured. With real test keys, use Checkout. */
export function proSwitchAvailable(env: Record<string, string | undefined> = process.env): boolean {
  return isDemoMode(env) && !billingConfigured(env);
}
