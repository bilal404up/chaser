import Link from 'next/link'
import { TryDemo } from '@/components/TryDemo'
import SiteHeader from '@/components/SiteHeader'
import PlanReceipt from '@/components/PlanReceipt'
import { Count, ExampleStrip, StripFace, TierStamp, tierFor, figureLabel, type CSSVars } from '@/components/ink'
import { reminderText, type Tone } from '@/lib/reminders'
import { formatUsd } from '@/lib/money'
import { billingConfigured } from '@/lib/stripe'
import { proSwitchAvailable } from '@/lib/demo'

export const dynamic = 'force-dynamic'

/* Fixed example data for the landing visual only. */
const EXAMPLES = [
  { client: 'Harbor & Co', amount: '$2,400.00', due: 'Sep 4, 2026', daysLate: 34, note: 'Second project phase, net 30' },
  { client: 'Nguyen Design', amount: '$870.00', due: 'Sep 26, 2026', daysLate: 12 },
  { client: 'Marlow LLC', amount: '$1,150.00', due: 'Oct 5, 2026', daysLate: 3, note: 'Brand guidelines, final files' },
  { client: 'Oak St Bakery', amount: '$640.00', due: 'Sep 20, 2026', daysLate: 0, paid: true, paidOn: 'Sep 18, 2026', paidLate: -2 },
] as const

/* The three tones, with subject lines produced by the real reminder writer (lib/reminders.ts). */
const TONE_ROWS: { tone: Tone; name: string; range: string; client: string; cents: number; dueOn: string; days: number }[] = [
  { tone: 'friendly', name: 'Friendly', range: '1 to 7 days late', client: 'Marlow LLC', cents: 115000, dueOn: '2026-10-05', days: 3 },
  { tone: 'firm', name: 'Firm', range: '8 to 29 days late', client: 'Nguyen Design', cents: 87000, dueOn: '2026-09-26', days: 12 },
  { tone: 'final', name: 'Final', range: '30 days late or more', client: 'Harbor & Co', cents: 240000, dueOn: '2026-09-04', days: 34 },
]

const BENEFITS = [
  { n: '01', title: 'You log the invoice once.', body: 'Client, amount, issue date, due date, a note if you want one. That is the whole form.' },
  { n: '02', title: 'It counts every day.', body: 'The oldest overdue invoice sits at the top. The count gets heavier as the days add up.' },
  {
    n: '03',
    title: 'You copy a reminder.',
    body: 'Friendly, firm or final, chosen by how late it is. You paste it into your own email and send it yourself.',
  },
]

function proHint() {
  if (billingConfigured()) return 'Upgrade on the Plan page through Stripe Checkout in test mode. No card is charged.'
  if (proSwitchAvailable()) return 'In this demo, use the Free and Pro switch on the Plan page. No card, no charge.'
  return 'Upgrading happens on the Plan page.'
}

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        {/* Hero: headline left, the printer slot and four fed strips right */}
        <section className="relative pb-20 pt-12 md:pt-16 lg:pb-28 lg:pt-24" aria-labelledby="hero-title">
          <div className="wrap grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
            <div className="lg:pt-4">
              <p className="t-meta text-chalk">Invoice tracker for freelancers</p>
              <h1 id="hero-title" className="t-display mt-6">
                <span>Late</span>
                <span>invoices,</span>
                <span>counted</span>
                <span>out loud.</span>
              </h1>
              <p className="t-lede mt-8 max-w-[34ch] text-chalk">
                Log the invoice. Chaser counts the days, sorts the oldest to the top, and writes a reminder you copy and
                send yourself.
              </p>
              <div className="mt-9 grid gap-3 sm:flex sm:flex-wrap">
                <TryDemo className="btn btn-primary w-full sm:w-auto" />
                <Link href="/signup" className="btn btn-secondary w-full sm:w-auto">
                  Create account
                </Link>
              </div>
              <p className="t-small mt-4 text-chalk">Sample data. Nothing is emailed.</p>
            </div>

            <div role="group" aria-label="Four example invoice strips with sample data" className="min-w-0">
              <div className="slot" aria-hidden="true" />
              <ul className="m-0 grid list-none gap-3 p-0">
                {EXAMPLES.map((e, i) => {
                  const style: CSSVars = { '--i': i }
                  return (
                    <li key={e.client}>
                      <ExampleStrip
                        client={e.client}
                        amount={e.amount}
                        due={e.due}
                        daysLate={e.daysLate}
                        paid={'paid' in e ? e.paid : false}
                        paidOn={'paidOn' in e ? e.paidOn : undefined}
                        paidLate={'paidLate' in e ? e.paidLate : undefined}
                        note={'note' in e ? e.note : undefined}
                        tickDelay={200 + i * 420 + 260}
                        className="feed-in"
                        style={style}
                      />
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </section>

        {/* Benefits: one paper ledger, three columns */}
        <section aria-labelledby="benefits-title" className="wrap">
          <h2 id="benefits-title" className="sr-only">
            What Chaser does
          </h2>
          <div className="sheet sheet--shadow grid md:grid-cols-3">
            {BENEFITS.map((b, i) => (
              <div
                key={b.n}
                className={`px-6 pb-10 pt-8 md:px-8 md:pb-12 md:pt-10 ${i > 0 ? 'border-t border-[color:var(--c-ink-rule)] md:border-l md:border-t-0' : ''}`}
              >
                <p className="t-meta text-ink-2">Step</p>
                <p className="fig-xl mt-2 text-ink" aria-hidden="true">
                  {b.n}
                </p>
                <h3 className="t-section mt-6">{b.title}</h3>
                <p className="mt-2 max-w-[34ch] text-ink-2">{b.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Three tones: static, real subject lines */}
        <section className="py-24 lg:py-32" aria-labelledby="tones-title">
          <div className="wrap grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-16">
            <div>
              <h2 id="tones-title" className="t-title">
                Three tones, set by the calendar
              </h2>
              <p className="mt-5 max-w-[34ch] text-chalk">
                1 to 7 days late: friendly. 8 to 29: firm. 30 or more: final. The stamp on each strip tells you which one you
                will get.
              </p>
            </div>
            <ol className="m-0 grid list-none gap-3 p-0" aria-label="Reminder tones">
              {TONE_ROWS.map((t) => {
                const tier = tierFor(t.days, false)
                const { subject } = reminderText({ tone: t.tone, clientName: t.client, amountCents: t.cents, dueOn: t.dueOn, daysOverdue: t.days, senderName: '' })
                return (
                  <li key={t.tone}>
                    <StripFace
                      tier={tier}
                      label={`${t.name} reminder, ${t.range}. ${figureLabel(t.days, false)}`}
                      count={<Count daysLate={t.days} />}
                      name={t.name}
                      note={
                        <>
                          <span className="block">{t.range}</span>
                          <span className="mt-2 block text-ink">
                            <span className="t-meta mr-2 text-ink-2">Subject</span>
                            {subject}
                          </span>
                        </>
                      }
                      amount={formatUsd(t.cents)}
                      meta={t.client}
                      stamp={<TierStamp tier={tier} />}
                    />
                  </li>
                )
              })}
            </ol>
          </div>
        </section>

        {/* Plans: two receipts, the same lists as the Plan page */}
        <section className="pb-24 lg:pb-32" aria-labelledby="plans-title">
          <div className="wrap">
            <div className="grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-16">
              <div>
                <h2 id="plans-title" className="t-title">
                  Plans
                </h2>
                <p className="mt-5 max-w-[34ch] text-chalk">{proHint()}</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <PlanReceipt plan="free">
                  <Link href="/signup" className="btn btn-secondary w-full">
                    Create a free account
                  </Link>
                </PlanReceipt>
                <PlanReceipt plan="pro">
                  <Link href="/signup" className="btn btn-carbon w-full">
                    Create account, then upgrade
                  </Link>
                </PlanReceipt>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer: a straight-cut paper band */}
      <footer className="paper">
        <div className="wrap flex flex-wrap items-end justify-between gap-x-10 gap-y-8 pb-10 pt-14">
          <div className="min-w-0">
            <p className="wordmark wordmark--big">Chaser</p>
            <p className="t-small mt-5 max-w-[40ch] text-ink-2">Portfolio demo with sample data. No real money moves.</p>
          </div>
          <nav aria-label="Footer" className="flex items-center gap-6">
            <Link href="/login" className="link font-semibold">
              Log in
            </Link>
            <Link href="/signup" className="link font-semibold">
              Create account
            </Link>
          </nav>
        </div>
      </footer>
    </>
  )
}
