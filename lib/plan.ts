export const FREE_OPEN_LIMIT = 5;
export const PRO_PRICE_CENTS = 900;

export type Plan = "free" | "pro";

/** The same rule the database trigger enforces. The trigger is the one that counts. */
export function canAddOpenInvoice(plan: Plan, openCount: number): boolean {
  return plan === "pro" || openCount < FREE_OPEN_LIMIT;
}

export function canExport(plan: Plan): boolean {
  return plan === "pro";
}
