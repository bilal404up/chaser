import { NextResponse, type NextRequest } from "next/server";
import { userClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/http";
import { DEMO_USERS, isDemoMode, isDemoWho } from "@/lib/demo";

/** Demo mode only: sign in as a sample user. A real sign-in with a server-side password, not a bypass. */
export async function POST(req: NextRequest) {
  if (!isDemoMode()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!sameOrigin(req)) return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });

  let who: unknown;
  try {
    who = (await req.json())?.who;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!isDemoWho(who)) return NextResponse.json({ error: "Unknown demo user" }, { status: 400 });

  const password = process.env.DEMO_PASSWORD;
  if (!password) return NextResponse.json({ error: "Demo users are not configured" }, { status: 500 });

  const sb = userClient();
  await sb.auth.signOut();
  const { error } = await sb.auth.signInWithPassword({ email: DEMO_USERS[who].email, password });
  if (error) return NextResponse.json({ error: "Could not sign in to the sample user" }, { status: 502 });
  return NextResponse.json({ ok: true, redirect: who === "admin" ? "/admin" : "/dashboard" });
}
