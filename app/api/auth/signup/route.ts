import { NextResponse, type NextRequest } from "next/server";
import { service } from "@/lib/supabase/service";
import { sameOrigin } from "@/lib/http";

const MAX_SIGNUPS_PER_HOUR = 30;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

/**
 * Demo signup: creates a confirmed account so the demo works without an email provider.
 * That skips email verification on purpose, and it is rate limited across the whole site.
 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });

  let body: { email?: unknown; password?: unknown; display_name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.display_name === "string" ? body.display_name.trim() : "";
  if (!EMAIL.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (password.length < 10 || password.length > 72) return NextResponse.json({ error: "Use a password of 10 to 72 characters." }, { status: 400 });
  if (name.length < 1 || name.length > 60) return NextResponse.json({ error: "Enter a name of up to 60 characters." }, { status: 400 });

  try {
    const since = new Date(Date.now() - 3_600_000).toISOString();
    const { count } = await service().from("ch_profiles").select("id", { count: "exact", head: true }).gte("created_at", since);
    if ((count ?? 0) >= MAX_SIGNUPS_PER_HOUR) return NextResponse.json({ error: "Too many sign-ups right now. Try again later." }, { status: 429 });

    const { data, error } = await service().auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: name } });
    if (error || !data.user) {
      const taken = /already|registered|exists/i.test(error?.message ?? "");
      return NextResponse.json({ error: taken ? "That email already has an account. Log in instead." : "Could not create the account." }, { status: taken ? 409 : 400 });
    }
    await service().from("ch_profiles").upsert({ id: data.user.id, display_name: name }, { onConflict: "id", ignoreDuplicates: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong on our side. Try again." }, { status: 500 });
  }
}
