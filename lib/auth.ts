import { NextResponse } from "next/server";
import { userClient } from "./supabase/server";
import { service } from "./supabase/service";
import type { Plan } from "./plan";

export interface Profile {
  id: string;
  display_name: string;
  is_admin: boolean;
  plan: Plan;
  stripe_customer_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
}

const COLUMNS = "id, display_name, is_admin, plan, stripe_customer_id, subscription_status, current_period_end";

/** The signed-in user and their profile, or null. Creates the profile on first visit. */
export async function currentUser(): Promise<{ id: string; email: string; profile: Profile } | null> {
  let sb: ReturnType<typeof userClient>;
  let user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = null;
  try {
    sb = userClient();
    user = (await sb.auth.getUser()).data.user;
  } catch {
    return null; // no request context or no session: treat as signed out
  }
  if (!user) return null;
  let { data: profile } = await sb.from("ch_profiles").select(COLUMNS).eq("id", user.id).maybeSingle();
  if (!profile) {
    const name = String(user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "Freelancer").slice(0, 60);
    await service().from("ch_profiles").upsert({ id: user.id, display_name: name }, { onConflict: "id", ignoreDuplicates: true });
    ({ data: profile } = await sb.from("ch_profiles").select(COLUMNS).eq("id", user.id).maybeSingle());
  }
  if (!profile) return null;
  return { id: user.id, email: user.email ?? "", profile: profile as Profile };
}

type SignedIn = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

/** For route handlers: the user or a ready 401 response. */
export async function requireUser(): Promise<{ error: NextResponse; user?: never } | { user: SignedIn; error?: never }> {
  const u = await currentUser();
  if (!u) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  return { user: u };
}
