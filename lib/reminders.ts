import { formatUsd } from "./money";
import { formatDay } from "./dates";

export type Tone = "friendly" | "firm" | "final";
export const TONES: Tone[] = ["friendly", "firm", "final"];

export interface ReminderInput {
  tone: Tone;
  clientName: string;
  amountCents: number;
  dueOn: string;
  daysOverdue: number;
  senderName: string;
}

const days = (n: number) => (n === 1 ? "1 day" : `${n} days`);

/** Plain reminder text. It never mentions late fees, interest or legal action, because the sender never promised any. */
export function reminderText(i: ReminderInput): { subject: string; body: string } {
  const amount = formatUsd(i.amountCents);
  const due = formatDay(i.dueOn);
  const late = i.daysOverdue > 0 ? `${days(i.daysOverdue)} past its due date` : "due today";
  const first = i.clientName.trim().split(/\s+/)[0] || "there";
  const sign = `Thanks,\n${i.senderName}`;

  if (i.tone === "friendly") {
    return {
      subject: `Quick reminder: invoice for ${amount}`,
      body: `Hi ${first},\n\nA quick note that my invoice for ${amount} was due on ${due} and is ${late}. It may have slipped through, so I wanted to check in.\n\nCould you let me know when I can expect payment? I'm happy to resend the invoice if that helps.\n\n${sign}`,
    };
  }
  if (i.tone === "firm") {
    return {
      subject: `Payment overdue: ${amount} due ${due}`,
      body: `Hi ${first},\n\nMy invoice for ${amount} was due on ${due} and is now ${late}. I haven't received payment or a reply to my earlier note.\n\nPlease arrange payment this week, or tell me the date it will be paid. If something is wrong with the invoice, let me know and I'll fix it right away.\n\n${sign}`,
    };
  }
  return {
    subject: `Final reminder: ${amount} overdue since ${due}`,
    body: `Hi ${first},\n\nThis is my final reminder about the invoice for ${amount}, due on ${due} and now ${late}.\n\nPlease pay within 7 days, or reply with a payment date. If I don't hear from you, I'll pause further work for your account until the invoice is settled.\n\n${sign}`,
  };
}

/** A sensible default tone for how late an invoice is. */
export function suggestedTone(daysOverdue: number): Tone {
  if (daysOverdue >= 30) return "final";
  if (daysOverdue >= 8) return "firm";
  return "friendly";
}
