import type { CSSVars } from "./util";

export type Tier = "due" | "t1" | "t2" | "t3" | "paid";

/** Shared mapping from data to tier. Thresholds match the reminder tones: 1 to 7, 8 to 29, 30 and up. */
export function tierFor(daysLate: number, paid: boolean): Tier {
  if (paid) return "paid";
  if (daysLate < 1) return "due";
  if (daysLate < 8) return "t1";
  if (daysLate < 30) return "t2";
  return "t3";
}

/** The count gets louder with age, clamped at 45 days. 0 is light and narrow, 1 is black and wide. */
export const AGE_CAP = 45;
export function ageFor(daysLate: number): number {
  if (daysLate <= 0) return 0;
  return Math.pow(Math.min(daysLate, AGE_CAP) / AGE_CAP, 0.7);
}

/** Inline weight and width for the count. Archivo: wght 300 to 900, wdth 75 to 125. */
export function countStyle(daysLate: number, paid = false): CSSVars {
  if (paid) return { "--age": 0, fontVariationSettings: '"wght" 560, "wdth" 88' };
  const age = ageFor(daysLate);
  const wght = Math.round(300 + 600 * age);
  const wdth = Math.round(75 + 50 * age);
  return { "--age": Number(age.toFixed(3)), fontVariationSettings: `"wght" ${wght}, "wdth" ${wdth}` };
}

/**
 * The figure on a strip. Open: "+12d" late, "9d" until due, "today". Paid: how late it was when it was paid,
 * struck through, or "on time".
 */
export function countText(daysLate: number, paid: boolean, paidLate?: number | null): string {
  if (paid) return paidLate && paidLate > 0 ? `+${paidLate}d` : "on time";
  if (daysLate === 0) return "today";
  if (daysLate < 0) return `${Math.abs(daysLate)}d`;
  return `+${daysLate}d`;
}

/** The small mono line on a paid strip, under the "paid" caption. Late payments are the only red ones. */
export function paidLineText(paidLate?: number | null): string {
  if (paidLate && paidLate > 0) return `Paid ${paidLate}d late`;
  if (paidLate && paidLate < 0) return "Paid early";
  return "Paid on time";
}

/** Class names for the count element. */
export function countClass(tier: Tier, text: string): string {
  const word = !/\d/.test(text);
  const long = !word && text.length > 4;
  return ["count", `count--${tier}`, word ? "count--word" : "", long ? "count--long" : ""].filter(Boolean).join(" ");
}

/** Screen-reader text for the figure. */
export function figureLabel(daysLate: number, paid: boolean, paidLate?: number | null): string {
  if (paid) {
    if (paidLate && paidLate > 0) return `Paid, ${paidLate} ${paidLate === 1 ? "day" : "days"} late`;
    return "Paid on time";
  }
  if (daysLate === 0) return "Due today";
  if (daysLate < 0) {
    const n = Math.abs(daysLate);
    return `Due in ${n} ${n === 1 ? "day" : "days"}`;
  }
  return `${daysLate} ${daysLate === 1 ? "day" : "days"} late`;
}
