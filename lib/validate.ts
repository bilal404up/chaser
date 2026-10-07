import { isIsoDate } from "./dates";
import { MAX_AMOUNT_CENTS } from "./money";

export interface InvoiceInput {
  client_name: string;
  amount_cents: number;
  issued_on: string;
  due_on: string;
  notes: string;
}

export type Validated = { ok: true; value: InvoiceInput } | { ok: false; error: string };

/** Rejects instead of coercing: a wrong type or an out-of-range value is an error, not a guess. */
export function validateInvoice(body: unknown): Validated {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Invalid request." };
  const b = body as Record<string, unknown>;
  const client = typeof b.client_name === "string" ? b.client_name.trim() : "";
  if (client.length < 1 || client.length > 120) return { ok: false, error: "Client name needs 1 to 120 characters." };
  const cents = b.amount_cents;
  if (typeof cents !== "number" || !Number.isInteger(cents) || cents < 1 || cents > MAX_AMOUNT_CENTS) {
    return { ok: false, error: "Amount must be between $0.01 and $1,000,000.00." };
  }
  if (!isIsoDate(b.issued_on) || !isIsoDate(b.due_on)) return { ok: false, error: "Use real dates in the form YYYY-MM-DD." };
  if (b.due_on < b.issued_on) return { ok: false, error: "The due date cannot be before the issue date." };
  const notes = b.notes === undefined || b.notes === null ? "" : b.notes;
  if (typeof notes !== "string" || notes.length > 500) return { ok: false, error: "Notes can be up to 500 characters." };
  return { ok: true, value: { client_name: client, amount_cents: cents, issued_on: b.issued_on, due_on: b.due_on, notes: notes.trim() } };
}
