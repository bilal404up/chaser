/**
 * Proves the security model against the real database, using only the PUBLIC key for the user actions.
 * Run with `npm run check:isolation`. Creates three throwaway users (iso-*@chaser.test) and removes their rows.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const password = process.env.DEMO_PASSWORD!;
if (!url || !anonKey || !serviceKey || !password) {
  console.error("Set the Supabase keys and DEMO_PASSWORD in .env.local first.");
  process.exit(2);
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(url, serviceKey, opts);
let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${!ok && detail ? "  [" + detail + "]" : ""}`);
  if (!ok) failures++;
};

async function ensureUser(email: string, plan: "free" | "pro"): Promise<string> {
  const { data } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  let id = data?.user?.id;
  if (!id) {
    const list = await service.auth.admin.listUsers({ page: 1, perPage: 200 });
    id = list.data.users.find((u) => u.email === email)?.id;
  }
  if (!id) throw new Error(`could not create ${email}`);
  await service.from("ch_profiles").upsert({ id, display_name: email.split("@")[0], plan });
  await service.from("ch_invoices").delete().eq("user_id", id);
  return id;
}

async function signIn(email: string): Promise<SupabaseClient> {
  const sb = createClient(url, anonKey, opts);
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return sb;
}

const inv = (extra: object = {}) => ({ client_name: "Isolation Co", amount_cents: 10000, issued_on: "2024-01-01", due_on: "2024-01-15", ...extra });

async function main() {
  const aId = await ensureUser("iso-a@chaser.test", "free");
  const bId = await ensureUser("iso-b@chaser.test", "free");
  const proId = await ensureUser("iso-pro@chaser.test", "pro");
  const a = await signIn("iso-a@chaser.test");
  const b = await signIn("iso-b@chaser.test");
  const pro = await signIn("iso-pro@chaser.test");
  const anon = createClient(url, anonKey, opts);

  // --- the public key can do nothing ---
  const anonRead = await anon.from("ch_invoices").select("id").limit(1);
  check("public key cannot read invoices", !!anonRead.error || (anonRead.data?.length ?? 0) === 0);
  const anonWrite = await anon.from("ch_invoices").insert({ ...inv(), user_id: aId });
  check("public key cannot insert invoices", !!anonWrite.error);
  const anonProfiles = await anon.from("ch_profiles").select("id").limit(1);
  check("public key cannot read profiles", !!anonProfiles.error || (anonProfiles.data?.length ?? 0) === 0);

  // --- user A creates data; user B cannot touch it ---
  const created = await a.from("ch_invoices").insert(inv({ client_name: "Only A" })).select("id, user_id").single();
  check("A can create an invoice, owned by A", !created.error && created.data?.user_id === aId, created.error?.message);
  const invId = created.data!.id as string;

  const bList = await b.from("ch_invoices").select("id");
  check("B sees none of A's invoices", !bList.error && (bList.data ?? []).every((r) => r.id !== invId));
  const bRead = await b.from("ch_invoices").select("id").eq("id", invId);
  check("B cannot read A's invoice by id", (bRead.data?.length ?? 0) === 0);
  const bUpdate = await b.from("ch_invoices").update({ client_name: "Hacked" }).eq("id", invId).select("id");
  check("B cannot update A's invoice", (bUpdate.data?.length ?? 0) === 0);
  const bDelete = await b.from("ch_invoices").delete().eq("id", invId).select("id");
  check("B cannot delete A's invoice", (bDelete.data?.length ?? 0) === 0);
  const bForge = await b.from("ch_invoices").insert({ ...inv(), user_id: aId });
  check("B cannot create an invoice owned by A", !!bForge.error);
  const bSteal = await a.from("ch_invoices").update({ user_id: bId }).eq("id", invId).select("id");
  check("A cannot hand an invoice to B", !!bSteal.error || (bSteal.data?.length ?? 0) === 0);
  const still = await service.from("ch_invoices").select("client_name, user_id").eq("id", invId).single();
  check("A's invoice is unchanged", still.data?.client_name === "Only A" && still.data?.user_id === aId);

  // --- profiles: a user can rename themselves but never change plan ---
  const bProfileOfA = await b.from("ch_profiles").select("id").eq("id", aId);
  check("B cannot read A's profile", (bProfileOfA.data?.length ?? 0) === 0);
  const rename = await a.from("ch_profiles").update({ display_name: "Alice" }).eq("id", aId).select("display_name").single();
  check("A can change their own display name", !rename.error && rename.data?.display_name === "Alice", rename.error?.message);
  const upgrade = await a.from("ch_profiles").update({ plan: "pro" }).eq("id", aId).select("plan");
  check("A cannot upgrade themselves to pro", !!upgrade.error, "update was allowed");
  const stripeIds = await a.from("ch_profiles").update({ stripe_customer_id: "cus_fake" }).eq("id", aId).select("id");
  check("A cannot write Stripe ids", !!stripeIds.error);
  const adminFlag = await a.from("ch_profiles").update({ is_admin: true }).eq("id", aId).select("id");
  check("A cannot make themselves admin", !!adminFlag.error);
  const planNow = await service.from("ch_profiles").select("plan, is_admin").eq("id", aId).single();
  check("A is still free and not admin", planNow.data?.plan === "free" && planNow.data?.is_admin === false);
  const insertProfile = await b.from("ch_profiles").insert({ id: bId, plan: "pro" });
  check("a user cannot insert a profile row", !!insertProfile.error);
  const events = await a.from("ch_stripe_events").select("id").limit(1);
  check("a user cannot read Stripe events", !!events.error || (events.data?.length ?? 0) === 0);
  const eventWrite = await a.from("ch_stripe_events").insert({ id: "evt_forged", type: "x" });
  check("a user cannot write Stripe events", !!eventWrite.error);

  // --- the free plan limit is enforced by the database ---
  await service.from("ch_invoices").delete().eq("user_id", aId);
  let accepted = 0;
  for (let i = 0; i < 5; i++) if (!(await a.from("ch_invoices").insert(inv({ client_name: `Open ${i}` }))).error) accepted++;
  check("free plan accepts 5 open invoices", accepted === 5, `accepted ${accepted}`);
  const sixth = await a.from("ch_invoices").insert(inv({ client_name: "Open 6" }));
  check("free plan refuses the 6th open invoice", !!sixth.error && /free_plan_limit/.test(sixth.error.message), sixth.error?.message);
  const first = await a.from("ch_invoices").select("id").eq("client_name", "Open 0").single();
  const markPaid = await a.from("ch_invoices").update({ status: "paid", paid_on: "2024-02-01" }).eq("id", first.data!.id).select("id");
  check("marking one paid frees a slot", !markPaid.error && (markPaid.data?.length ?? 0) === 1, markPaid.error?.message);
  const sixthAgain = await a.from("ch_invoices").insert(inv({ client_name: "Open 6" }));
  check("then a new invoice is accepted", !sixthAgain.error, sixthAgain.error?.message);
  const reopen = await a.from("ch_invoices").update({ status: "open", paid_on: null }).eq("id", first.data!.id).select("id");
  check("re-opening past the limit is refused", !!reopen.error, "reopen was allowed");

  let proAccepted = 0;
  for (let i = 0; i < 8; i++) if (!(await pro.from("ch_invoices").insert(inv({ client_name: `Pro ${i}` }))).error) proAccepted++;
  check("pro plan has no limit (8 of 8 accepted)", proAccepted === 8, `accepted ${proAccepted}`);

  // --- data rules ---
  const negative = await pro.from("ch_invoices").insert(inv({ amount_cents: -5 }));
  check("negative amounts are refused", !!negative.error);
  const backwards = await pro.from("ch_invoices").insert(inv({ due_on: "2023-12-01" }));
  check("due date before issue date is refused", !!backwards.error);
  const paidNoStatus = await pro.from("ch_invoices").insert(inv({ paid_on: "2024-01-20" }));
  check("an open invoice cannot have a paid date", !!paidNoStatus.error);

  // clean up: deleting the auth users removes their profiles and invoices too
  for (const id of [aId, bId, proId]) await service.auth.admin.deleteUser(id);
  console.log(failures === 0 ? "\nAll isolation checks passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
