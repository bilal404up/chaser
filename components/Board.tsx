"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatUsd, parseAmountToCents } from "@/lib/money";
import { daysOverdue, formatDay, todayIso } from "@/lib/dates";
import { reminderText, suggestedTone, TONES } from "@/lib/reminders";
import { FREE_OPEN_LIMIT } from "@/lib/plan";
import {
  BlankRoll,
  Check,
  ClearSpike,
  FinalBox,
  FirmRing,
  PaidStamp,
  figureClass,
  figureFor,
  figureLabel,
  tierFor,
  type CSSVars,
} from "@/components/ink";

export type InvoiceRow = {
  id: string;
  client_name: string;
  amount_cents: number;
  issued_on: string;
  due_on: string;
  status: "open" | "paid";
  paid_on: string | null;
  notes: string;
};

type Props = { invoices: InvoiceRow[]; plan: "free" | "pro"; senderName: string };
type Row = InvoiceRow & { days: number };
type Tone = "friendly" | "firm" | "final";

const NETWORK_ERROR = "Could not reach the server. Check your connection and try again.";

const countText = (n: number) => (n === 1 ? "1 invoice" : `${n} invoices`);
const sum = (rows: Row[]) => rows.reduce((s, r) => s + r.amount_cents, 0);
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

async function errorText(res: Response) {
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    return String(data.error ?? data.message ?? text);
  } catch {
    return text || `Request failed (${res.status}).`;
  }
}

function plusDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function Board({ invoices, plan, senderName }: Props) {
  const router = useRouter();
  const today = todayIso();
  const rows: Row[] = invoices.map((i) => ({ ...i, days: daysOverdue(i.due_on, today) }));
  const late = rows.filter((r) => r.status === "open" && r.days > 0).sort((a, b) => b.days - a.days);
  const upcoming = rows.filter((r) => r.status === "open" && r.days <= 0).sort((a, b) => a.due_on.localeCompare(b.due_on));
  const paidAll = rows.filter((r) => r.status === "paid").sort((a, b) => (b.paid_on ?? "").localeCompare(a.paid_on ?? ""));
  const paid = paidAll.slice(0, 8);
  const paidThisMonth = paidAll.filter((r) => (r.paid_on ?? "").startsWith(today.slice(0, 7)));
  const open = late.length + upcoming.length;

  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [reminderFor, setReminderFor] = useState<Row | null>(null);

  useEffect(() => {
    if (leavingId && !invoices.some((i) => i.id === leavingId)) setLeavingId(null);
  }, [invoices, leavingId]);

  useEffect(() => {
    if (!freshId) return;
    const t = setTimeout(() => setFreshId(null), 1500);
    return () => clearTimeout(t);
  }, [freshId]);

  async function setStatus(row: Row, status: "paid" | "open") {
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/invoices/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setMessage(await errorText(res));
        return;
      }
      setMessage("");
      if (status === "paid") setFreshId(row.id);
      router.refresh();
    } catch {
      setMessage(NETWORK_ERROR);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete the invoice for ${row.client_name}?`)) return;
    setBusyId(row.id);
    setLeavingId(row.id);
    try {
      const res = await fetch(`/api/invoices/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        setLeavingId(null);
        setMessage(await errorText(res));
        return;
      }
      setMessage("");
      // slide-out 220ms, then the row collapses 240ms after a 160ms delay
      if (!reducedMotion()) await wait(620);
      router.refresh();
    } catch {
      setLeavingId(null);
      setMessage(NETWORK_ERROR);
    } finally {
      setBusyId(null);
    }
  }

  let index = 0;
  const strip = (row: Row) => (
    <Strip
      key={row.id}
      row={row}
      index={index++}
      busy={busyId === row.id}
      leaving={leavingId === row.id}
      fresh={freshId === row.id}
      onReminder={() => setReminderFor(row)}
      onPaid={() => setStatus(row, "paid")}
      onReopen={() => setStatus(row, "open")}
      onDelete={() => remove(row)}
    />
  );

  return (
    <div className="wrap pb-12">
      <section aria-label="Totals" className="grid gap-8 pt-8 lg:grid-cols-[minmax(0,1fr)_22.5rem]">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <p className="t-strong text-chalk">Overdue</p>
            <p className="fig-lg print-in mt-2 text-tape">{formatUsd(sum(late))}</p>
            <p className="t-small mt-2 text-chalk">{countText(late.length)}</p>
          </div>
          <Stat label="Open, not due yet" total={formatUsd(sum(upcoming))} count={countText(upcoming.length)} />
          <Stat label="Paid this month" total={formatUsd(sum(paidThisMonth))} count={countText(paidThisMonth.length)} />
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          {plan === "free" ? (
            <p className="tag t-small">
              <span>{`Free plan: ${open} of ${FREE_OPEN_LIMIT} open invoices used.`}</span>
              <Link href="/dashboard/billing" className="link">
                See Pro
              </Link>
            </p>
          ) : null}
          <p role="alert" className={message ? "chip-error" : "sr-only"}>
            {message}
          </p>
        </div>
      </section>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22.5rem] lg:gap-8">
        <div className="grid gap-12">
          {invoices.length === 0 ? (
            <NoInvoices />
          ) : (
            <>
              <Group title="Overdue" count={late.length} jump>
                {late.length ? late.map(strip) : <Empty title="Nothing is overdue." body="Everything open is still inside its due date." />}
              </Group>
              <Group title="Open, not due yet" count={upcoming.length}>
                {upcoming.length ? upcoming.map(strip) : <Empty title="Nothing waiting." body="Every open invoice is already past due, or paid." />}
              </Group>
              <Group title="Paid" count={paidAll.length} note={paidAll.length > 8 ? "Showing the 8 most recent." : undefined}>
                {paid.length ? (
                  paid.map(strip)
                ) : (
                  <Empty title="Nothing paid yet." body="Mark an invoice paid and it lands here." art={<ClearSpike className="w-16 shrink-0" />} />
                )}
              </Group>
            </>
          )}
        </div>
        <AddInvoice />
      </div>

      {reminderFor ? <ReminderDrawer row={reminderFor} senderName={senderName} onClose={() => setReminderFor(null)} /> : null}
    </div>
  );
}

function Stat({ label, total, count }: { label: string; total: string; count: string }) {
  return (
    <div className="strip strip--stat">
      <p className="t-small text-ink-muted">{label}</p>
      <p className="fig-md mt-1 !text-[1.5rem] md:!text-[1.625rem]">{total}</p>
      <p className="fig-sm mt-1 text-ink-muted">{count}</p>
    </div>
  );
}

function Group({ title, count, jump, note, children }: { title: string; count: number; jump?: boolean; note?: string; children: ReactNode }) {
  const id = `group-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-8">
      <div className="mb-4 flex items-baseline justify-between gap-4 lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:mb-0 lg:block lg:self-start">
        <h2 id={id} className="t-section text-tape">
          {title} <span className="fig-sm text-chalk">{count}</span>
        </h2>
        {note ? <p className="t-micro mt-1 text-chalk">{note}</p> : null}
        {jump ? (
          <a href="#add-invoice" className="link t-small lg:hidden">
            Add an invoice
          </a>
        ) : null}
      </div>
      <ul className="m-0 list-none p-0">{children}</ul>
    </section>
  );
}

function Empty({ title, body, art }: { title: string; body: string; art?: ReactNode }) {
  return (
    <li className="strip-slot">
      <div className="empty">
        <div className="flex items-center gap-5">
          {art}
          <div>
            <p className="t-strong">{title}</p>
            <p className="t-small text-ink-muted">{body}</p>
          </div>
        </div>
      </div>
    </li>
  );
}

function NoInvoices() {
  return (
    <section aria-labelledby="none-title" className="grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)] md:items-center">
      <BlankRoll className="max-w-[16rem]" />
      <div>
        <h2 id="none-title" className="t-section text-tape">
          No invoices yet.
        </h2>
        <p className="mt-2 max-w-[36ch] text-chalk">Log the first one with the form and it shows up here with its days counted.</p>
      </div>
    </section>
  );
}

type StripProps = {
  row: Row;
  index: number;
  busy: boolean;
  leaving: boolean;
  fresh: boolean;
  onReminder: () => void;
  onPaid: () => void;
  onReopen: () => void;
  onDelete: () => void;
};

function Strip({ row, index, busy, leaving, fresh, onReminder, onPaid, onReopen, onDelete }: StripProps) {
  const paid = row.status === "paid";
  const tier = tierFor(row.days, paid);
  const style: CSSVars = { "--i": Math.min(index, 5) };
  const label = figureLabel(row.days, paid);
  return (
    <li className={`strip-slot ${index < 6 ? "rise-in" : ""}`} style={style} data-leaving={leaving ? "true" : undefined}>
      <article className={`strip strip--${tier}`} aria-label={`${row.client_name}, ${formatUsd(row.amount_cents)}, ${label}`}>
        <div className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-1 md:grid-cols-[auto_1fr_auto]">
          <div className="row-span-3">
            {tier === "due" ? (
              <span className="t-small block text-ink-muted" aria-hidden="true">
                due in
              </span>
            ) : null}
            <span className={figureClass(tier)} aria-hidden="true">
              {figureFor(row.days, paid)}
            </span>
            <span className="sr-only">{label}</span>
          </div>

          <div className="min-w-0">
            <p className="t-strong truncate">{row.client_name}</p>
            {row.notes ? <p className="t-small text-ink-muted">{row.notes}</p> : null}
          </div>

          <div className="md:col-start-3 md:row-start-1 md:text-right">
            <p className="fig-amount">{formatUsd(row.amount_cents)}</p>
            <p className="fig-sm text-ink-muted">{paid && row.paid_on ? `Paid ${formatDay(row.paid_on)}` : `Due ${formatDay(row.due_on)}`}</p>
          </div>

          <div className="col-start-2 flex flex-wrap gap-x-4 md:col-span-2">
            {!paid && row.days > 0 ? (
              <button type="button" className="btn-text" onClick={onReminder} disabled={busy}>
                Write reminder
              </button>
            ) : null}
            {paid ? (
              <button type="button" className="btn-text" onClick={onReopen} disabled={busy}>
                Reopen
              </button>
            ) : (
              <button type="button" className="btn-text" onClick={onPaid} disabled={busy}>
                Mark paid
              </button>
            )}
            <button type="button" className="btn-text btn-text--danger" onClick={onDelete} disabled={busy}>
              Delete
            </button>
          </div>
        </div>

        {tier === "t2" ? <FirmRing className="right-4 top-3 md:bottom-3 md:right-5 md:top-auto" /> : null}
        {tier === "t3" ? <FinalBox className="right-4 top-3 md:bottom-3 md:right-5 md:top-auto" /> : null}
        {tier === "paid" ? <PaidStamp paidOn={row.paid_on ? formatDay(row.paid_on) : undefined} fresh={fresh} className="bottom-2 right-3 top-auto md:bottom-auto md:right-40 md:top-7" /> : null}
      </article>
    </li>
  );
}

function AddInvoice() {
  const router = useRouter();
  const today = todayIso();
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState("");
  const [issued, setIssued] = useState(today);
  const [due, setDue] = useState(plusDays(today, 14));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [amountBad, setAmountBad] = useState(false);
  const [busy, setBusy] = useState(false);
  const ready = client.trim() !== "" && amount.trim() !== "";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cents = parseAmountToCents(amount);
    if (cents === null) {
      setAmountBad(true);
      setError("Enter an amount like 1,250.00 (between $0.01 and $1,000,000).");
      return;
    }
    setAmountBad(false);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_name: client, amount_cents: cents, issued_on: issued, due_on: due, notes }),
      });
      if (!res.ok) {
        setError(await errorText(res));
        return;
      }
      setClient("");
      setAmount("");
      setNotes("");
      router.refresh();
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="add-invoice" aria-labelledby="add-title" className="pad lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:self-start">
      <h2 id="add-title" className="t-section">
        Add an invoice
      </h2>
      <form onSubmit={submit} noValidate className="mt-5 grid gap-4">
        <div>
          <label htmlFor="client" className="label">
            Client
          </label>
          <input id="client" className="field" value={client} onChange={(e) => setClient(e.target.value)} autoComplete="organization" required />
        </div>
        <div>
          <label htmlFor="amount" className="label">
            Amount (USD)
          </label>
          <input
            id="amount"
            className="field field-num"
            inputMode="decimal"
            placeholder="1,250.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={amountBad || undefined}
            aria-describedby={amountBad ? "add-error" : undefined}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="issued" className="label">
              Issued
            </label>
            <input id="issued" type="date" className="field field-num" value={issued} onChange={(e) => setIssued(e.target.value)} />
          </div>
          <div>
            <label htmlFor="due" className="label">
              Due
            </label>
            <input id="due" type="date" className="field field-num" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
        </div>
        <div>
          <label htmlFor="notes" className="label">
            Note (optional)
          </label>
          <textarea id="notes" className="field" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <p id="add-error" role="alert" className={error ? "hint hint--error" : "sr-only"}>
          {error}
        </p>
        <button type="submit" className="btn btn-primary w-full" disabled={!ready || busy} data-busy={busy || undefined}>
          {busy ? "Saving" : "Add invoice"}
        </button>
      </form>
    </section>
  );
}

function ReminderDrawer({ row, senderName, onClose }: { row: Row; senderName: string; onClose: () => void }) {
  const [tone, setTone] = useState<Tone>(suggestedTone(row.days) as Tone);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const { subject, body } = reminderText({
    tone,
    clientName: row.client_name,
    amountCents: row.amount_cents,
    dueOn: row.due_on,
    daysOverdue: row.days,
    senderName,
  });
  const lateText = row.days === 0 ? "due today" : `${row.days} ${row.days === 1 ? "day" : "days"} overdue`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      setCopyError("");
      setCopied(true);
    } catch {
      setCopyError("Copy did not work in this browser. Select the text and copy it by hand.");
    }
  }

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Reminder" className="drawer">
        <div className="drawer-body">
          <div className="flex items-start justify-between gap-4">
            <h2 className="t-section">Reminder</h2>
            <button type="button" className="btn btn-small btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
          <p className="t-strong mt-5">{row.client_name}</p>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-3">
            <span className="fig-amount">{formatUsd(row.amount_cents)}</span>
            <span className="t-small text-ink-muted">{lateText}</span>
          </p>

          <p id="tone-label" className="label mt-6">
            Tone
          </p>
          <div className="seg" role="group" aria-labelledby="tone-label">
            {TONES.map((t) => (
              <button key={t} type="button" className="seg-btn capitalize" aria-pressed={tone === t} onClick={() => setTone(t as Tone)}>
                {t}
              </button>
            ))}
          </div>

          <div className="perf my-6" aria-hidden="true" />

          <p className="label">Subject</p>
          <p className="t-strong">{subject}</p>
          <p className="label mt-5">Message</p>
          <p className="whitespace-pre-wrap font-body leading-relaxed">{body}</p>
        </div>

        <div className="drawer-foot">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-primary" onClick={copy} data-copied={copied || undefined}>
              {copied ? <Check /> : null}
              Copy message
            </button>
            <p role="status" aria-live="polite" className="t-small text-ink-muted">
              {copied ? "Copied" : copyError}
            </p>
          </div>
          <p className="hint mt-3">Chaser does not send email. Paste this into your own mail app.</p>
        </div>
      </div>
    </>
  );
}
