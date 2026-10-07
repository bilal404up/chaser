export const MAX_AMOUNT_CENTS = 100_000_000; // $1,000,000.00

export function formatUsd(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rest = String(abs % 100).padStart(2, "0");
  return `${sign}$${dollars}.${rest}`;
}

/** "1,234.50", "$99" and "99.5" become cents. Anything else (negative, 3 decimals, text, zero) is null. */
export function parseAmountToCents(input: string): number | null {
  const s = input.trim().replace(/^\$/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [d, c = ""] = s.split(".");
  const cents = Number(d) * 100 + Number(c.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents < 1 || cents > MAX_AMOUNT_CENTS) return null;
  return cents;
}
