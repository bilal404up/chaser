/**
 * Seed script: run once with `npm run seed` after applying supabase/schema.sql.
 * Creates three sample users (free, pro, admin) and fictional invoices dated relative to today,
 * so the overdue list always looks lived in. Set DEMO_PASSWORD (12+ characters) in .env.local first.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { DEMO_USERS } from "../lib/demo";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.DEMO_PASSWORD;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}
if (!password || password.length < 12) {
  console.error("Set DEMO_PASSWORD (12+ characters) in .env.local first.");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

// [client, amount in dollars, days from today the invoice is due (negative = overdue), paid after N days?]
// paid after: false = still open; a number = paid that many days after the due date (0 = on time, negative = early).
type Row = [string, number, number, false | number];
const FREE: Row[] = [
  ["Northwind Studio", 2400, -34, false],
  ["Harbor & Pine", 860, -12, false],
  ["Kestrel Labs", 1150, -3, false],
  ["Lumen Bakery", 480, 6, false],
  ["Oakridge Dental", 1900, 19, false],
  ["Fable Print Co.", 320, -20, 4],
  ["Bluebird Cafe", 275, -41, -1],
];
const PRO: Row[] = [
  ["Meridian Health", 5200, -47, false],
  ["Tallow & Thread", 1340, -31, false],
  ["Copperline Design", 760, -22, false],
  ["Ashgrove School", 2100, -15, false],
  ["Quill & Anchor", 980, -9, false],
  ["Delta Fabrication", 3450, -6, false],
  ["Greenhouse Labs", 640, -2, false],
  ["Foxglove Studio", 1220, 3, false],
  ["Ironbark Legal", 2750, 8, false],
  ["Salt Marsh Travel", 410, 12, false],
  ["Wren Analytics", 1890, 18, false],
  ["Postmark Films", 3100, 26, false],
  ["Cobalt Sound", 520, -25, 0],
  ["Ember Coffee", 215, -18, 6],
  ["Juniper Interiors", 1480, -11, 2],
  ["Alder & Finch", 905, -5, 0],
  ["Marlow Supply", 2600, -2, 1],
  ["Tidewater Co-op", 330, -1, -2],
];
const ADMIN: Row[] = [
  ["Sample Client A", 1200, -14, false],
  ["Sample Client B", 450, 9, false],
  ["Sample Client C", 780, -8, 4],
];

async function ensureUser(email: string, name: string, plan: "free" | "pro", admin: boolean): Promise<string> {
  const { data } = await sb.auth.admin.createUser({ email, password: password!, email_confirm: true, user_metadata: { display_name: name } });
  let id = data?.user?.id;
  if (!id) {
    const list = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
    id = list.data.users.find((u) => u.email === email)?.id;
  }
  if (!id) throw new Error(`could not create ${email}`);
  const { error } = await sb.from("ch_profiles").upsert({ id, display_name: name, plan, is_admin: admin, subscription_status: plan === "pro" ? "demo" : null });
  if (error) throw error;
  return id;
}

async function load(userId: string, rows: Row[]) {
  await sb.from("ch_invoices").delete().eq("user_id", userId);
  const records = rows.map(([client, dollars, dueOffset, paidAfter]) => ({
    user_id: userId,
    client_name: client,
    amount_cents: dollars * 100,
    issued_on: day(dueOffset - 14),
    due_on: day(dueOffset),
    status: paidAfter === false ? "open" : "paid",
    // Never later than today, so a paid invoice cannot show a future payment date.
    paid_on: paidAfter === false ? null : day(Math.min(dueOffset + paidAfter, 0)),
    notes: "",
  }));
  // Insert open invoices last so the free-plan trigger sees a consistent count.
  const { error } = await sb.from("ch_invoices").insert(records);
  if (error) throw error;
}

async function main() {
  for (const [who, spec] of Object.entries(DEMO_USERS)) {
    const id = await ensureUser(spec.email, spec.name, spec.plan, spec.admin);
    await load(id, who === "free" ? FREE : who === "pro" ? PRO : ADMIN);
    console.log(`seeded ${spec.email}`);
  }
  console.log("Done. Sample users: free@chaser.test, pro@chaser.test, admin@chaser.test (password is your DEMO_PASSWORD).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
