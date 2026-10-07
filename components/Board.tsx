"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatUsd, parseAmountToCents } from "@/lib/money";
import { daysOverdue, formatDay, todayIso } from "@/lib/dates";
import { reminderText, suggestedTone, TONES, type Tone } from "@/lib/reminders";
import { FREE_OPEN_LIMIT, type Plan } from "@/lib/plan";

export interface InvoiceRow {
  id: string;
  client_name: string;
  amount_cents: number;
  issued_on: string;
  due_on: string;
  status: "open" | "paid";
  paid_on: string | null;
  notes: string;
}

function severity(days: number): { label: string; box: string } {
  if (days >= 30) return { label: "bg-severe-50 text-severe border-severe", box: "text-severe" };
  if (days >= 8) return { label: "bg-late-50 text-late border-late", box: "text-late" };
  return { label: "bg-amber-50 text-amber border-amber", box: "text-amber" };
}

async function call(path: string, method: string, body?: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true } : { ok: false, error: data.error ?? "Something went wrong." };
  } catch {
    return { ok: false, error: "Could not reach the server. Try again." };
  }
}

export function Board({ invoices, plan, senderName }: { invoices: InvoiceRow[]; plan: Plan; senderName: string }) {
  const router = useRouter();
  const today = todayIso();
  const [reminderFor, setReminderFor] = useState<InvoiceRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const open = useMemo(() => invoices.filter((i) => i.status === "open"), [invoices]);
  const late = open.filter((i) => daysOverdue(i.due_on, today) > 0).sort((a, b) => daysOverdue(b.due_on, today) - daysOverdue(a.due_on, today));
  const upcoming = open.filter((i) => daysOverdue(i.due_on, today) <= 0).sort((a, b) => a.due_on.localeCompare(b.due_on));
  const paid = invoices.filter((i) => i.status === "paid").sort((a, b) => (b.paid_on ?? "").localeCompare(a.paid_on ?? ""));
  const sum = (rows: InvoiceRow[]) => rows.reduce((s, r) => s + r.amount_cents, 0);
  const month = today.slice(0, 7);
  const paidThisMonth = paid.filter((i) => (i.paid_on ?? "").startsWith(month));

  async function setStatus(i: InvoiceRow, status: "paid" | "open") {
    setMessage(null);
    const r = await call(`/api/invoices/${i.id}`, "PATCH", { status });
    if (!r.ok) return setMessage(r.error ?? "Failed");
    router.refresh();
  }
  async function remove(i: InvoiceRow) {
    if (!window.confirm(`Delete the invoice for ${i.client_name}?`)) return;
    const r = await call(`/api/invoices/${i.id}`, "DELETE");
    if (!r.ok) return setMessage(r.error ?? "Failed");
    router.refresh();
  }

  return (
    <div>
      <dl className="grid gap-px overflow-hidden rounded-md border border-ink bg-ink sm:grid-cols-3">
        <Stat label="Overdue" value={formatUsd(sum(late))} note={`${late.length} ${late.length === 1 ? "invoice" : "invoices"}`} tone={late.length ? "text-late" : ""} />
        <Stat label="Open, not due yet" value={formatUsd(sum(upcoming))} note={`${upcoming.length} ${upcoming.length === 1 ? "invoice" : "invoices"}`} />
        <Stat label="Paid this month" value={formatUsd(sum(paidThisMonth))} note={`${paidThisMonth.length} ${paidThisMonth.length === 1 ? "invoice" : "invoices"}`} tone="text-teal" />
      </dl>

      {plan === "free" && (
        <p className="mt-4 rounded-sm border border-line-strong bg-paper-raised px-3 py-2 text-[14px] leading-5 text-ink-muted">
          Free plan: <span className="num text-ink">{open.length} of {FREE_OPEN_LIMIT}</span> open invoices used.{" "}
          <a href="/dashboard/billing" className="font-semibold text-ink underline underline-offset-4">See Pro</a>
        </p>
      )}
      {message && (
        <p role="alert" className="mt-4 rounded-sm border border-error bg-paper-raised px-3 py-2 text-[14px] leading-5 text-error">
          {message}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <Section title="Overdue" empty="Nothing is overdue. Nice." rows={late}>
            {(i) => {
              const d = daysOverdue(i.due_on, today);
              const sev = severity(d);
              return (
                <Strip key={i.id} i={i} lead={<span className={`num text-[28px] leading-8 ${sev.box}`}>+{d}d</span>} sub={`Due ${formatDay(i.due_on)}`}>
                  <button type="button" className="btn-small" onClick={() => setReminderFor(i)}>Write reminder</button>
                  <button type="button" className="btn-small" onClick={() => setStatus(i, "paid")}>Mark paid</button>
                  <button type="button" className="text-[13px] text-ink-subtle underline underline-offset-4" onClick={() => remove(i)}>Delete</button>
                </Strip>
              );
            }}
          </Section>
          <Section title="Open, not due yet" empty="No upcoming invoices." rows={upcoming}>
            {(i) => {
              const d = -daysOverdue(i.due_on, today);
              return (
                <Strip key={i.id} i={i} lead={<span className="num text-[28px] leading-8 text-ink-muted">{d === 0 ? "today" : `${d}d`}</span>} sub={`Due ${formatDay(i.due_on)}`}>
                  <button type="button" className="btn-small" onClick={() => setStatus(i, "paid")}>Mark paid</button>
                  <button type="button" className="text-[13px] text-ink-subtle underline underline-offset-4" onClick={() => remove(i)}>Delete</button>
                </Strip>
              );
            }}
          </Section>
          <Section title="Paid" empty="Paid invoices appear here." rows={paid.slice(0, 8)}>
            {(i) => (
              <Strip key={i.id} i={i} lead={<span className="num text-[28px] leading-8 text-teal">paid</span>} sub={i.paid_on ? `Paid ${formatDay(i.paid_on)}` : "Paid"}>
                <button type="button" className="btn-small" onClick={() => setStatus(i, "open")}>Reopen</button>
                <button type="button" className="text-[13px] text-ink-subtle underline underline-offset-4" onClick={() => remove(i)}>Delete</button>
              </Strip>
            )}
          </Section>
        </div>

        <AddInvoice onError={setMessage} />
      </div>

      {reminderFor && <ReminderDrawer invoice={reminderFor} senderName={senderName} onClose={() => setReminderFor(null)} />}
    </div>
  );
}

function Stat({ label, value, note, tone = "" }: { label: string; value: string; note: string; tone?: string }) {
  return (
    <div className="bg-paper-raised px-5 py-4">
      <dt className="text-[14px] leading-5 text-ink-muted">{label}</dt>
      <dd className={`num mt-1 text-[32px] leading-[38px] ${tone}`}>{value}</dd>
      <p className="text-[13px] leading-[18px] text-ink-subtle">{note}</p>
    </div>
  );
}

function Section({ title, empty, rows, children }: { title: string; empty: string; rows: InvoiceRow[]; children: (i: InvoiceRow) => React.ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="mb-3 text-[20px] leading-7">
        {title} <span className="num text-[15px] text-ink-subtle">{rows.length}</span>
      </h2>
      {rows.length === 0 ? <p className="text-[15px] leading-[22px] text-ink-muted">{empty}</p> : <ul className="space-y-3">{rows.map(children)}</ul>}
    </section>
  );
}

function Strip({ i, lead, sub, children }: { i: InvoiceRow; lead: React.ReactNode; sub: string; children: React.ReactNode }) {
  return (
    <li className="tape border-x border-t border-line px-4 pt-4">
      <div className="flex items-start gap-4">
        <div className="w-20 shrink-0">{lead}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[18px] font-semibold leading-6">{i.client_name}</p>
          <p className="text-[14px] leading-5 text-ink-muted">
            <span className="num text-ink">{formatUsd(i.amount_cents)}</span> {sub}
          </p>
          {i.notes && <p className="mt-0.5 truncate text-[13px] leading-[18px] text-ink-subtle">{i.notes}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 pb-3">{children}</div>
    </li>
  );
}

function AddInvoice({ onError }: { onError: (m: string | null) => void }) {
  const router = useRouter();
  const today = todayIso();
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState("");
  const [issued, setIssued] = useState(today);
  const [due, setDue] = useState(() => new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    onError(null);
    const cents = parseAmountToCents(amount);
    if (cents === null) return setError("Enter an amount like 1,250.00 (between $0.01 and $1,000,000).");
    setBusy(true);
    const r = await call("/api/invoices", "POST", { client_name: client, amount_cents: cents, issued_on: issued, due_on: due, notes });
    setBusy(false);
    if (!r.ok) return setError(r.error ?? "Failed");
    setClient("");
    setAmount("");
    setNotes("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="h-fit space-y-3 rounded-md border border-ink bg-paper-raised p-4 lg:sticky lg:top-6" aria-label="Add an invoice">
      <h2 className="text-[20px] leading-7">Add an invoice</h2>
      <div>
        <label htmlFor="client" className="mb-1 block text-[14px] font-semibold">Client</label>
        <input id="client" value={client} onChange={(e) => setClient(e.target.value)} maxLength={120} className="field h-10" />
      </div>
      <div>
        <label htmlFor="amount" className="mb-1 block text-[14px] font-semibold">Amount (USD)</label>
        <input id="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1,250.00" className="field num h-10" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="issued" className="mb-1 block text-[14px] font-semibold">Issued</label>
          <input id="issued" type="date" value={issued} onChange={(e) => setIssued(e.target.value)} className="field h-10" />
        </div>
        <div>
          <label htmlFor="due" className="mb-1 block text-[14px] font-semibold">Due</label>
          <input id="due" type="date" value={due} onChange={(e) => setDue(e.target.value)} className="field h-10" />
        </div>
      </div>
      <div>
        <label htmlFor="notes" className="mb-1 block text-[14px] font-semibold">Note (optional)</label>
        <input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} className="field h-10" />
      </div>
      {error && (
        <p role="alert" className="text-[13px] leading-[18px] text-error">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || client.trim().length === 0 || amount.trim().length === 0} className="btn-primary w-full">
        {busy ? "Saving" : "Add invoice"}
      </button>
    </form>
  );
}

function ReminderDrawer({ invoice, senderName, onClose }: { invoice: InvoiceRow; senderName: string; onClose: () => void }) {
  const d = daysOverdue(invoice.due_on, todayIso());
  const [tone, setTone] = useState<Tone>(suggestedTone(d));
  const [copied, setCopied] = useState(false);
  const text = reminderText({ tone, clientName: invoice.client_name, amountCents: invoice.amount_cents, dueOn: invoice.due_on, daysOverdue: d, senderName });
  const full = `Subject: ${text.subject}\n\n${text.body}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink/40" onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-label="Reminder" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.key === "Escape" && onClose()} className="flex h-full w-full max-w-[460px] flex-col gap-4 overflow-y-auto border-l border-ink bg-paper-raised p-5 shadow-pop">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[22px] leading-7">Reminder for {invoice.client_name}</h2>
            <p className="text-[14px] leading-5 text-ink-muted">
              <span className="num text-ink">{formatUsd(invoice.amount_cents)}</span>, {d > 0 ? `${d} ${d === 1 ? "day" : "days"} overdue` : "due today"}
            </p>
          </div>
          <button type="button" className="btn-small" onClick={onClose} autoFocus>Close</button>
        </div>
        <div role="group" aria-label="Tone" className="flex gap-2">
          {TONES.map((t) => (
            <button key={t} type="button" aria-pressed={tone === t} onClick={() => setTone(t)} className={`btn-small capitalize ${tone === t ? "!bg-ink !text-white" : ""}`}>
              {t}
            </button>
          ))}
        </div>
        <div>
          <p className="text-[13px] leading-[18px] text-ink-subtle">Subject</p>
          <p className="font-semibold">{text.subject}</p>
        </div>
        <pre className="whitespace-pre-wrap rounded-sm border border-line bg-paper p-3 font-sans text-[15px] leading-[22px]">{text.body}</pre>
        <div className="flex items-center gap-3">
          <button type="button" className="btn-primary" onClick={copy}>Copy message</button>
          <span aria-live="polite" className="text-[14px] text-teal">{copied ? "Copied" : ""}</span>
        </div>
        <p className="text-[13px] leading-[18px] text-ink-subtle">Chaser does not send email. Paste this into your own email. It never mentions late fees, interest or legal action.</p>
      </aside>
    </div>
  );
}
