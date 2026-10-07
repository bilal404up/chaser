export type Tier = "due" | "t1" | "t2" | "t3" | "paid";

/** Shared mapping from data to tier. Thresholds match the reminder tones: 1 to 7, 8 to 29, 30 and up. */
export function tierFor(daysLate: number, paid: boolean): Tier {
  if (paid) return "paid";
  if (daysLate < 1) return "due";
  if (daysLate < 8) return "t1";
  if (daysLate < 30) return "t2";
  return "t3";
}

/** The loud figure. Negative daysLate means not yet due. */
export function figureFor(daysLate: number, paid: boolean): string {
  if (paid) return "paid";
  if (daysLate === 0) return "today";
  if (daysLate < 0) return `${Math.abs(daysLate)}d`;
  return `+${daysLate}d`;
}

/** Screen-reader text for the figure. */
export function figureLabel(daysLate: number, paid: boolean): string {
  if (paid) return "Paid";
  if (daysLate === 0) return "Due today";
  if (daysLate < 0) {
    const n = Math.abs(daysLate);
    return `Due in ${n} ${n === 1 ? "day" : "days"}`;
  }
  return `${daysLate} ${daysLate === 1 ? "day" : "days"} late`;
}

/** Colour and size classes for the figure, by tier. */
export function figureClass(tier: Tier): string {
  switch (tier) {
    case "due":
      return "fig-md text-ink-muted";
    case "t1":
      return "fig-lg text-ink";
    case "t2":
      return "fig-lg text-ochre";
    case "t3":
      return "fig-lg fig-bleed text-stamp";
    case "paid":
      return "fig-md text-carbon";
  }
}
