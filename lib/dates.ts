const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDate(s: unknown): s is string {
  if (typeof s !== "string") return false;
  const m = ISO.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

const toUtcDay = (s: string) => {
  const m = ISO.exec(s)!;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86_400_000;
};

/** Whole days between two calendar dates (later minus earlier). */
export function daysBetween(earlier: string, later: string): number {
  return toUtcDay(later) - toUtcDay(earlier);
}

/** Positive when the due date has passed, 0 on the due date, negative before it. */
export function daysOverdue(dueOn: string, today: string): number {
  return daysBetween(dueOn, today);
}

export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function formatDay(iso: string): string {
  const m = ISO.exec(iso);
  if (!m) return iso;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
