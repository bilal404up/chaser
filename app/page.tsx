import Link from 'next/link'
import { TryDemo } from '@/components/TryDemo'
import { CoffeeRing, ExampleStrip, PaidStamp, SeverityLadder, type CSSVars } from '@/components/ink'

export const dynamic = 'force-dynamic'

/* Fixed example data for the landing visual only. */
const EXAMPLES = [
  { client: 'Harbor & Co', amount: '$2,400.00', due: 'Sep 4, 2026', daysLate: 34, note: 'Second project phase, net 30' },
  { client: 'Nguyen Design', amount: '$870.00', due: 'Sep 26, 2026', daysLate: 12 },
  { client: 'Marlow LLC', amount: '$1,150.00', due: 'Oct 5, 2026', daysLate: 3, note: 'Brand guidelines, final files' },
  { client: 'Oak St Bakery', amount: '$640.00', due: 'Sep 20, 2026', daysLate: 0, paid: true, paidOn: 'Sep 18, 2026' },
] as const

const FEED_STEP = 520
const FEED_BASE = 160

const SPILL = [
  'relative z-[4] -mt-2 lg:w-[88%]',
  'relative z-[3] -mt-2.5 lg:ml-[7%] lg:w-[86%] lg:-mt-3',
  'relative z-[2] -mt-2.5 lg:ml-[14%] lg:w-[84%] lg:-mt-3',
  'relative z-[1] -mt-2.5 lg:ml-[22%] lg:w-[78%] lg:-mt-3',
]

/* blank tape spilled behind the plans: left, top, width, rotation */
const PLAN_SPILL: { l: string; t: string; w: string; r: string }[] = [
  { l: '-4%', t: '18%', w: '46%', r: '-9deg' },
  { l: '38%', t: '-6%', w: '40%', r: '4deg' },
  { l: '62%', t: '58%', w: '44%', r: '-3deg' },
]

function Benefit({ n, title, body, className = '' }: { n: string; title: string; body: string; className?: string }) {
  return (
    <div className={`max-w-[30ch] ${className}`}>
      <p className="fig-md print-on-view text-ink" aria-hidden="true">
        {n}
      </p>
      <h3 className="t-section mt-4">{title}</h3>
      <p className="mt-2 text-ink-muted">{body}</p>
    </div>
  )
}

export default function LandingPage() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-cut focus:bg-tape focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>

      <header className="header">
        <div className="wrap flex min-h-[var(--header-h)] items-center justify-between gap-6">
          <Link href="/" className="wordmark text-tape">
            Chaser
          </Link>
          <nav aria-label="Account" className="flex items-center gap-2">
            <Link href="/login" className="btn btn-small">
              Log in
            </Link>
            <Link href="/signup" className="btn btn-small btn-secondary">
              Create account
            </Link>
          </nav>
        </div>
      </header>

      <main id="main">
        {/* Hero: headline left, printer slot and the fed strips right */}
        <section className="relative z-10 pb-16 pt-10 lg:pb-0 lg:pt-14" aria-labelledby="hero-title">
          <div className="wrap grid gap-12 lg:grid-cols-hero lg:items-start lg:gap-10">
            <div className="max-w-copy lg:pt-6">
              <h1 id="hero-title" className="t-display">
                <span className="block">Late</span>
                <span className="block">invoices,</span>
                <span className="block">counted</span>
                <span className="block">out loud.</span>
              </h1>
              <p className="mt-8 max-w-[34ch] text-chalk">
                Log the invoice. Chaser counts the days, sorts the oldest to the top, and writes a reminder you copy and
                send yourself.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TryDemo className="btn btn-primary" />
                <Link href="/signup" className="btn btn-secondary">
                  Create account
                </Link>
              </div>
              <p className="t-micro mt-4 text-chalk">Sample data. Nothing is emailed.</p>
            </div>

            <div role="group" aria-label="Four example invoice strips with sample data" className="lg:-mb-8">
              <div className="slot" aria-hidden="true" />
              {EXAMPLES.map((e, i) => {
                const style: CSSVars = { '--i': i }
                return (
                  <ExampleStrip
                    key={e.client}
                    client={e.client}
                    amount={e.amount}
                    due={e.due}
                    daysLate={e.daysLate}
                    paid={'paid' in e ? e.paid : false}
                    paidOn={'paidOn' in e ? e.paidOn : undefined}
                    note={'note' in e ? e.note : undefined}
                    tickDelay={FEED_BASE + i * FEED_STEP + 240}
                    className={`feed-in ${SPILL[i]}`}
                    style={style}
                  />
                )
              })}
            </div>
          </div>
        </section>

        {/* Benefits: torn paper band, numbers print in as you scroll */}
        <section className="paper-band relative z-0" aria-labelledby="benefits-title">
          <CoffeeRing className="right-[6%] top-[-10px] hidden md:block" size={200} />
          <div className="wrap">
            <h2 id="benefits-title" className="sr-only">
              What Chaser does
            </h2>
            <div className="grid gap-10 md:grid-cols-[1fr_10px_1fr_10px_1fr] md:gap-8">
              <Benefit n="01" title="You log the invoice once." body="Client, amount, issue date, due date, a note if you want one. That is the whole form." />
              <div className="perf md:hidden" aria-hidden="true" />
              <div className="perf-v hidden md:block" aria-hidden="true" />
              <Benefit
                n="02"
                title="It counts every day."
                body="The oldest overdue invoice sits at the top with the days late printed large. Paper ages as the count grows."
                className="md:mt-8"
              />
              <div className="perf md:hidden" aria-hidden="true" />
              <div className="perf-v hidden md:block" aria-hidden="true" />
              <Benefit
                n="03"
                title="You copy a reminder."
                body="Friendly, firm or final, chosen by how late it is. You paste it into your own email and send it yourself."
                className="md:mt-16"
              />
            </div>
          </div>
        </section>

        {/* How a strip reads: rungs age as they scroll into view */}
        <section className="relative z-0 py-20 lg:py-28" aria-labelledby="reads-title">
          <div className="wrap grid gap-10 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-16">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <h2 id="reads-title" className="t-section">
                How a strip reads
              </h2>
              <p className="mt-3 max-w-[30ch] text-chalk">
                Paper ages, the tear gets rougher, and the number gets louder. The stamp tells you which tone the reminder
                will take before you open it.
              </p>
            </div>
            <SeverityLadder figures={{ t1: '+3d', t2: '+12d', t3: '+34d' }} scroll className="[--list-gap:12px]" />
          </div>
        </section>

        {/* Plans: receipts over spilled tape, paid stubs on the right */}
        <section className="relative overflow-x-clip pb-24 pt-4 lg:pb-32" aria-labelledby="plans-title">
          <div className="wrap">
            <h2 id="plans-title" className="t-section">
              Plans
            </h2>
          </div>
          <div className="relative mt-10">
            <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
              {PLAN_SPILL.map((p, i) => (
                <i key={i} className="spill-piece" style={{ left: p.l, top: p.t, width: p.w, '--r': p.r } as CSSVars} />
              ))}
            </div>
            <div className="wrap relative grid gap-8 md:grid-cols-[minmax(0,22rem)_minmax(0,26rem)_minmax(0,1fr)] md:items-start md:gap-0">
              <div className="plan-strip slide-on-view md:mt-16 [--from-y:40px]">
                <p className="t-strong">Free</p>
                <p className="fig-md mt-2">$0</p>
                <ul className="mt-6 space-y-2">
                  <li>5 open invoices at a time</li>
                  <li>Days late counted and sorted</li>
                  <li>Friendly, firm and final reminders</li>
                  <li>Copy to send from your own email</li>
                </ul>
                <Link href="/signup" className="btn btn-secondary mt-8 w-full">
                  Create a free account
                </Link>
              </div>

              <div className="plan-strip plan-strip--pro slide-on-view relative z-10 md:-ml-4 [--from-y:56px] [--view-start:entry_15%] [--view-end:entry_85%]">
                <p className="t-strong">Pro</p>
                <p className="fig-md mt-2">
                  $9 <span className="t-small font-body text-ink-muted">a month</span>
                </p>
                <ul className="mt-6 space-y-2">
                  <li>Unlimited open invoices</li>
                  <li>CSV export of everything you have logged</li>
                  <li>Days late counted and sorted</li>
                  <li>Friendly, firm and final reminders</li>
                  <li>Copy to send from your own email</li>
                </ul>
                <Link href="/signup" className="btn btn-primary mt-8 w-full">
                  Create account, then upgrade
                </Link>
                <p className="hint mt-3">Upgrading happens on the Plan page. Stripe runs in test mode, so no card is charged.</p>
              </div>

              {/* how it ends: a short pile of paid stubs */}
              <div className="relative hidden min-h-[18rem] md:block" aria-hidden="true">
                <div className="strip strip--paid slide-on-view absolute left-8 top-10 w-[78%] [--tilt:-2deg] [--from-x:40px] [--from-y:0px] [--view-start:entry_30%] [--view-end:entry_90%]">
                  <span className="fig-md text-carbon">paid</span>
                  <PaidStamp className="bottom-2 right-4" />
                </div>
                <div className="strip strip--paid slide-on-view absolute left-16 top-44 w-[72%] [--tilt:1.5deg] [--from-x:56px] [--from-y:0px] [--view-start:entry_40%] [--view-end:entry_100%]">
                  <span className="fig-md text-carbon">paid</span>
                  <PaidStamp className="bottom-2 right-4" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer: torn paper with the wordmark */}
      <footer className="paper-band paper-band--foot relative z-0">
        <div className="wrap flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="wordmark wordmark--big text-ink">Chaser</p>
            <p className="t-small mt-3 max-w-[40ch] text-ink-muted">
              Portfolio demo. Sample data. Stripe runs in test mode, no real money moves.
            </p>
          </div>
          <nav aria-label="Footer" className="flex items-center gap-4">
            <Link href="/login" className="link">
              Log in
            </Link>
            <Link href="/signup" className="link">
              Create account
            </Link>
          </nav>
        </div>
      </footer>
    </>
  )
}
