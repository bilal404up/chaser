import { FREE_OPEN_LIMIT, PRO_PRICE_CENTS, type Plan } from "./plan";

/** One plan list, shared by the landing page and the Plan page, so the two can never disagree. */
export const PLAN_COPY: Record<Plan, { name: string; price: string; per: string; features: string[] }> = {
  free: {
    name: "Free",
    price: "$0",
    per: "",
    features: [
      `${FREE_OPEN_LIMIT} open invoices at a time`,
      "Days late counted, oldest first",
      "Friendly, firm and final reminders",
      "Copy and send from your own email",
    ],
  },
  pro: {
    name: "Pro",
    price: `$${PRO_PRICE_CENTS / 100}`,
    per: "a month",
    features: [
      "Unlimited open invoices",
      "CSV export of every invoice",
      "Days late counted, oldest first",
      "Friendly, firm and final reminders",
      "Copy and send from your own email",
    ],
  },
};
