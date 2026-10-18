"use client"

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatUsd, parseAmountToCents } from "@/lib/money"
import { daysBetween, daysOverdue, formatDay, todayIso } from "@/lib/dates"
import { reminderText, suggestedTone, TONES } from "@/lib/reminders"
import { FREE_OPEN_LIMIT } from "@/lib/plan"
import { BlankRoll, Check, Count, StripFace, TierStamp, figureLabel, tierFor, type CSSVars } from "@/components/ink"

export type InvoiceRow = {
  id: string
  client_name: string
  amount_cents: number
  issued_on: string
  due_on: string
  status: "open" | "paid"
  paid_on: string | null
  notes: string
}

type Props = { invoices: InvoiceRow[]; plan: "free" | "pro"; senderName: string; loadError?: boolean }
type Row = InvoiceRow & { days: number }
type Tone = "friendly" | "firm" | "final"

const NETWORK_ERROR = "Could not reach the server. Check your connection and try again."
const TONE_RANGE: Record<Tone, string> = { friendly: "1 to 7 days", firm: "8 to 29 days", final: "30+ days" }

const countText = (n: number) => (n === 1 ? "1 invoice" : `${n} invoices`)
const sum = (rows: Row[]) => rows.reduce((s, r) => s + r.amount_cents, 0)
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

async function errorText(res: Response) {
  const text = await res.text()
  try {
    const data = JSON.parse(text)
    return String(data.error ?? data.message ?? text)
  } catch {
    return text || `Request failed (${res.status}).`
  }
}

function plusDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function Board({ invoices, plan, senderName, loadError = false }: Props) {
  const router = useRouter()
  const today = todayIso()
  const rows: Row[] = invoices.map((i) => ({ ...i, days: daysOverdue(i.due_on, today) }))
  const late = rows.filter((r) => r.status === "open" && r.days > 0).sort((a, b) => b.days - a.days)
  const upcoming = rows
    .filter((r) => r.status === "open" && r.days <= 0)
    .sort((a, b) => a.due_on.localeCompare(b.due_on))
  const paidAll = rows
    .filter((r) => r.status === "paid")
    .sort((a, b) => (b.paid_on ?? "").localeCompare(a.paid_on ?? ""))
  const paid = paidAll.slice(0, 8)
  const paidThisMonth = paidAll.filter((r) => (r.paid_on ?? "").startsWith(today.slice(0, 7)))
  const open = late.length + upcoming.length

  const [message, setMessage] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [leavingId, setLeavingId] = useState<string | null>(null)
  const [freshId, setFreshId] = useState<string | null>(null)
  const [reminderFor, setReminderFor] = useState<Row | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (leavingId && !invoices.some((i) => i.id === leavingId)) setLeavingId(null)
  }, [invoices, leavingId])

  useEffect(() => {
    if (!freshId) return
    const t = setTimeout(() => setFreshId(null), 1500)
    return () => clearTimeout(t)
  }, [freshId])

  async function setStatus(row: Row, status: "paid" | "open") {
    setBusyId(row.id)
    try {
      const res = await fetch(`/api/invoices/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        setMessage(await errorText(res))
        return
      }
      setMessage("")
      if (status === "paid") setFreshId(row.id)
      router.refresh()
    } catch {
      setMessage(NETWORK_ERROR)
    } finally {
      setBusyId(null)
    }
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete the invoice for ${row.client_name}?`)) return
    setBusyId(row.id)
    setLeavingId(row.id)
    try {
      const res = await fetch(`/api/invoices/${row.id}`, { method: "DELETE" })
      if (!res.ok) {
        setLeavingId(null)
        setMessage(await errorText(res))
        return
      }
      setMessage("")
      if (!reducedMotion()) await wait(620)
      router.refresh()
    } catch {
      setLeavingId(null)
      setMessage(NETWORK_ERROR)
    } finally {
      setBusyId(null)
    }
  }

  let index = 0
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
  )

  return (
    <div className="wrap-app">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pt-10 md:pt-14">
        <h1 className="t-title">Invoices</h1>
        <div className="flex items-center gap-2">
          {plan === "pro" ? (
            <a href="/api/invoices/export" className="btn btn-secondary btn-small">
              Export CSV
            </a>
          ) : null}
          <button type="button" className="btn btn-primary btn-small hidden md:inline-flex" onClick={() => setAdding(true)}>
            Add invoice
          </button>
        </div>
      </div>

      {loadError ? (
        <p role="alert" className="chip-error mt-6">
          Could not load your invoices. Reload the page.
        </p>
      ) : null}

      <section aria-label="Totals" className="ledger mt-8">
        <Figure lead label="Overdue, total" total={formatUsd(sum(late))} count={countText(late.length)} alarm={late.length > 0} />
        <Figure label="Open, not due yet" total={formatUsd(sum(upcoming))} count={countText(upcoming.length)} />
        <Figure label="Paid this month" total={formatUsd(sum(paidThisMonth))} count={countText(paidThisMonth.length)} />
      </section>

      {plan === "free" ? <Meter open={open} /> : null}

      <p role="alert" className={message ? "chip-error mt-6" : "sr-only"}>
        {message}
      </p>

      <div className="mt-14 grid gap-14 pb-8 md:pb-24">
        {invoices.length === 0 ? (
          <NoInvoices onAdd={() => setAdding(true)} />
        ) : (
          <>
            <Group title="Overdue" count={late.length} total={late.length ? formatUsd(sum(late)) : undefined}>
              {late.length ? late.map(strip) : <Empty title="Nothing is overdue." body="Everything open is still inside its due date." />}
            </Group>
            <Group title="Open, not due yet" count={upcoming.length} total={upcoming.length ? formatUsd(sum(upcoming)) : undefined}>
              {upcoming.length ? upcoming.map(strip) : <Empty title="Nothing waiting." body="Every open invoice is already past due, or paid." />}
            </Group>
            <Group title="Paid" count={paidAll.length} note={paidAll.length > 8 ? "Showing the 8 most recent." : undefined}>
              {paid.length ? paid.map(strip) : <Empty title="Nothing paid yet." body="Mark an invoice paid and it lands here." />}
            </Group>
          </>
        )}
      </div>

      <div className="dock md:hidden">
        <button type="button" className="btn btn-primary w-full" onClick={() => setAdding(true)}>
          Add invoice
        </button>
      </div>

      {reminderFor ? <ReminderDrawer row={reminderFor} senderName={senderName} onClose={() => setReminderFor(null)} /> : null}
      {adding ? <AddInvoice plan={plan} open={open} onClose={() => setAdding(false)} /> : null}
    </div>
  )
}

function Figure({ label, total, count, lead = false, alarm = false }: { label: string; total: string; count: string; lead?: boolean; alarm?: boolean }) {
  return (
    <div className={`ledger-cell ${lead ? "ledger-cell--lead" : ""}`}>
      <p className="t-label text-chalk">{label}</p>
      <p className={`${lead ? "fig-xl" : "fig-md"} mt-3 ${alarm ? "text-stamp-lit" : ""}`}>{total}</p>
      <p className="t-small mt-2 text-chalk">{count}</p>
    </div>
  )
}

function Meter({ open }: { open: number }) {
  const full = open >= FREE_OPEN_LIMIT
  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="meter" data-full={full || undefined} aria-hidden="true">
        {Array.from({ length: FREE_OPEN_LIMIT }, (_, i) => (
          <i key={i} data-on={i < open ? "true" : undefined} />
        ))}
      </div>
      <p className="t-small text-chalk">
        <span className="num font-semibold text-paper">{`${Math.min(open, FREE_OPEN_LIMIT)} of ${FREE_OPEN_LIMIT}`}</span> open invoices on Free. Pro
        has no limit.{" "}
        <Link href="/dashboard/billing" className="link text-paper">
          See Pro
        </Link>
      </p>
    </div>
  )
}

function Group({ title, count, total, note, children }: { title: string; count: number; total?: string; note?: string; children: ReactNode }) {
  const id = `group-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`
  return (
    <section aria-labelledby={id}>
      <div className="group-head">
        <h2 id={id} className="t-section">
          {title}
        </h2>
        <span className="num t-small text-chalk">{count}</span>
        <span className="fill" aria-hidden="true" />
        {total ? <span className="num t-small font-semibold text-chalk">{total}</span> : null}
      </div>
      {note ? <p className="t-small -mt-1 mb-3 text-chalk">{note}</p> : null}
      <ul className="m-0 list-none p-0">{children}</ul>
    </section>
  )
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <li className="empty-line">
      <span className="font-semibold text-paper">{title}</span> {body}
    </li>
  )
}

function NoInvoices({ onAdd }: { onAdd: () => void }) {
  return (
    <section aria-labelledby="none-title" className="grid gap-8 md:grid-cols-[15rem_minmax(0,1fr)] md:items-center">
      <BlankRoll className="max-w-[15rem]" />
      <div>
        <h2 id="none-title" className="t-section">
          Nothing to chase yet.
        </h2>
        <p className="mt-2 max-w-[38ch] text-chalk">Add your first invoice and Chaser starts counting from its due date.</p>
        <button type="button" className="btn btn-primary mt-6" onClick={onAdd}>
          Add invoice
        </button>
      </div>
    </section>
  )
}

type StripProps = {
  row: Row
  index: number
  busy: boolean
  leaving: boolean
  fresh: boolean
  onReminder: () => void
  onPaid: () => void
  onReopen: () => void
  onDelete: () => void
}

function Strip({ row, index, busy, leaving, fresh, onReminder, onPaid, onReopen, onDelete }: StripProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const paid = row.status === "paid"
  const paidLate = paid && row.paid_on ? daysBetween(row.due_on, row.paid_on) : null
  const tier = tierFor(row.days, paid)
  const paidOn = row.paid_on ? formatDay(row.paid_on) : undefined
  const style: CSSVars = { "--i": Math.min(index, 5), zIndex: menuOpen ? 5 : undefined }
  return (
    <li className={`strip-slot ${index < 6 ? "rise-in" : ""}`} style={style} data-leaving={leaving ? "true" : undefined}>
      <StripFace
        tier={tier}
        fresh={fresh}
        label={`${row.client_name}, ${formatUsd(row.amount_cents)}, ${figureLabel(row.days, paid, paidLate)}`}
        count={<Count daysLate={row.days} paid={paid} paidLate={paidLate} />}
        name={row.client_name}
        note={row.notes || undefined}
        amount={formatUsd(row.amount_cents)}
        meta={paid && paidOn ? `Paid ${paidOn}` : `Due ${formatDay(row.due_on)}`}
        stamp={<TierStamp tier={tier} paidOn={paidOn} fresh={fresh} />}
        actions={
          <>
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
            <MoreMenu label={`More actions for ${row.client_name}`} open={menuOpen} setOpen={setMenuOpen} disabled={busy} onDelete={onDelete} />
          </>
        }
      />
    </li>
  )
}

function MoreMenu({ label, open, setOpen, disabled, onDelete }: { label: string; open: boolean; setOpen: (v: boolean) => void; disabled: boolean; onDelete: () => void }) {
  const wrap = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const first = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    first.current?.focus()
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open, setOpen])

  return (
    <div
      ref={wrap}
      className="relative"
      onBlur={(e) => {
        if (open && !wrap.current?.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="btn-icon"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <circle cx="3.5" cy="9" r="1.6" />
          <circle cx="9" cy="9" r="1.6" />
          <circle cx="14.5" cy="9" r="1.6" />
        </svg>
      </button>
      {open ? (
        <div id={menuId} role="menu" aria-label={label} className="menu">
          <button
            ref={first}
            type="button"
            role="menuitem"
            className="menu-item menu-item--danger"
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
          >
            Delete invoice
          </button>
        </div>
      ) : null}
    </div>
  )
}

/** The paper drawer: a side panel on desktop, a 92dvh bottom sheet on mobile. Focus is kept inside while open. */
function Drawer({ title, eyebrow, sub, onClose, children, foot }: { title: string; eyebrow?: string; sub?: ReactNode; onClose: () => void; children: ReactNode; foot?: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const titleId = useId()

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeRef.current()
        return
      }
      if (e.key !== "Tab" || !panel.current) return
      const items = panel.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!items.length) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === firstEl || active === panel.current)) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
      opener?.focus()
    }
  }, [])

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className="drawer">
        <div className="drawer-head">
          <div className="min-w-0">
            {eyebrow ? <p className="t-meta text-ink-2">{eyebrow}</p> : null}
            <h2 id={titleId} className="t-section mt-1 [overflow-wrap:anywhere]">
              {title}
            </h2>
            {sub}
          </div>
          <button type="button" className="btn btn-small btn-secondary shrink-0" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {foot ? <div className="drawer-foot">{foot}</div> : null}
      </div>
    </>
  )
}

function AddInvoice({ plan, open, onClose }: { plan: "free" | "pro"; open: number; onClose: () => void }) {
  const router = useRouter()
  const today = todayIso()
  const [client, setClient] = useState("")
  const [amount, setAmount] = useState("")
  const [issued, setIssued] = useState(today)
  const [due, setDue] = useState(plusDays(today, 14))
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [amountBad, setAmountBad] = useState(false)
  const [busy, setBusy] = useState(false)
  const ready = client.trim() !== "" && amount.trim() !== ""
  const atLimit = plan === "free" && open >= FREE_OPEN_LIMIT

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const cents = parseAmountToCents(amount)
    if (cents === null) {
      setAmountBad(true)
      setError("Enter an amount like 1,250.00 (between $0.01 and $1,000,000).")
      return
    }
    setAmountBad(false)
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_name: client, amount_cents: cents, issued_on: issued, due_on: due, notes }),
      })
      if (!res.ok) {
        setError(await errorText(res))
        return
      }
      setClient("")
      setAmount("")
      setNotes("")
      onClose()
      router.refresh()
    } catch {
      setError(NETWORK_ERROR)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer
      title="Add an invoice"
      eyebrow="New strip"
      onClose={onClose}
      foot={
        <>
          <button type="submit" form="add-form" className="btn btn-primary w-full" disabled={!ready || busy} data-busy={busy || undefined}>
            {busy ? "Saving" : "Add invoice"}
          </button>
          <p className="hint text-center">Chaser starts counting from the due date.</p>
        </>
      }
    >
      {atLimit ? (
        <p className="mb-5 border-l-2 border-stamp pl-3 text-[0.9375rem] leading-snug">
          {`Free allows ${FREE_OPEN_LIMIT} open invoices and you have ${open}. Mark one paid, or `}
          <Link href="/dashboard/billing" className="link">
            see Pro
          </Link>
          , to add more.
        </p>
      ) : null}
      <form id="add-form" onSubmit={submit} noValidate className="grid gap-5">
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
            className="field"
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
            <input id="issued" type="date" className="field" value={issued} onChange={(e) => setIssued(e.target.value)} />
          </div>
          <div>
            <label htmlFor="due" className="label">
              Due
            </label>
            <input id="due" type="date" className="field" value={due} onChange={(e) => setDue(e.target.value)} />
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
      </form>
    </Drawer>
  )
}

function ReminderDrawer({ row, senderName, onClose }: { row: Row; senderName: string; onClose: () => void }) {
  const suggested = suggestedTone(row.days) as Tone
  const [tone, setTone] = useState<Tone>(suggested)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState("")

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  const { subject, body } = reminderText({
    tone,
    clientName: row.client_name,
    amountCents: row.amount_cents,
    dueOn: row.due_on,
    daysOverdue: row.days,
    senderName,
  })
  const lateText = row.days === 0 ? "due today" : `${row.days} ${row.days === 1 ? "day" : "days"} overdue`

  async function copy() {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
      setCopyError("")
      setCopied(true)
    } catch {
      setCopyError("Copy did not work in this browser. Select the text and copy it by hand.")
    }
  }

  return (
    <Drawer
      title={row.client_name}
      eyebrow="Reminder"
      onClose={onClose}
      sub={
        <p className="mt-2 flex flex-wrap items-baseline gap-x-3">
          <span className="fig-amount">{formatUsd(row.amount_cents)}</span>
          <span className="t-small text-ink-2">{lateText}</span>
        </p>
      }
      foot={
        <>
          <div className="flex min-h-[44px] flex-wrap items-center gap-3">
            <button type="button" className="btn btn-primary" onClick={copy} data-copied={copied || undefined}>
              {copied ? <Check /> : null}
              {copied ? "Copied" : "Copy message"}
            </button>
            <p role="status" aria-live="polite" className={copyError ? "t-small text-ink-2" : "sr-only"}>
              {copied ? "Copied" : copyError}
            </p>
          </div>
          <p className="hint">Chaser does not send email. Paste this into your own mail app.</p>
        </>
      }
    >
      <p id="tone-label" className="label">
        Tone
      </p>
      <div className="seg" role="group" aria-labelledby="tone-label">
        {TONES.map((t) => (
          <button key={t} type="button" className="seg-btn" aria-pressed={tone === t} onClick={() => setTone(t as Tone)}>
            <span className="capitalize">{t}</span>
            <span className="t-meta">{TONE_RANGE[t as Tone]}</span>
          </button>
        ))}
      </div>
      <p className="hint">
        {row.days > 0 ? `Set by the calendar: ${row.days} ${row.days === 1 ? "day" : "days"} late suggests ${suggested}.` : `Not late yet, so ${suggested} is suggested.`}
      </p>

      <dl className="letter-head t-small mt-6">
        <dt className="t-meta pt-0.5">To</dt>
        <dd>{row.client_name}</dd>
        <dt className="t-meta pt-0.5">Subject</dt>
        <dd className="font-semibold">{subject}</dd>
      </dl>
      <p className="mt-5 whitespace-pre-wrap text-[0.9875rem] leading-relaxed">{body}</p>
    </Drawer>
  )
}
