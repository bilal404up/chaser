/**
 * The name to show and to sign with. Stored names are left alone; this only drops a trailing plan label such as
 * "Alex (free plan)" -> "Alex", so the plan is shown once, by the badge, and never signs a reminder.
 */
export function cleanName(name: string | null | undefined): string {
  const raw = String(name ?? "").trim();
  const clean = raw.replace(/\s*\((?:free|pro)(?:\s+plan)?\)\s*$/i, "").trim();
  return clean || raw;
}
