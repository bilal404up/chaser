import { NextResponse, type NextRequest } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { service } from "@/lib/supabase/service";

/** Daily: prunes old processed webhook ids and touches the database so a free Supabase project does not pause. */
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString();
    const { data, error } = await service().from("ch_stripe_events").delete().lt("processed_at", cutoff).select("id");
    if (error) throw error;
    const { count } = await service().from("ch_profiles").select("id", { count: "exact", head: true });
    return NextResponse.json({ prunedEvents: data?.length ?? 0, profiles: count ?? 0 });
  } catch {
    return NextResponse.json({ error: "Maintenance failed" }, { status: 500 });
  }
}
