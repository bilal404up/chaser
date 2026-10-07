import { TryDemo } from "@/components/TryDemo";
import { isDemoMode } from "@/lib/demo";

export const dynamic = "force-dynamic";

const EXAMPLES = [
  { days: 34, client: "Northwind Studio", amount: "$2,400.00", tone: "text-severe" },
  { days: 12, client: "Harbor & Pine", amount: "$860.00", tone: "text-late" },
  { days: 3, client: "Kestrel Labs", amount: "$1,150.00", tone: "text-amber" },
];

export default function Home() {
  const demo = isDemoMode();
  return (
    <>
      <header className="border-b border-ink bg-paper-raised">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-3 sm:px-6">
          <span className="font-display text-[26px] font-semibold leading-none">chaser</span>
          <nav aria-label="Main" className="flex items-center gap-4 text-[15px]">
            <a href="/login" className="hover:underline">Log in</a>
            <a href="/signup" className="btn-secondary">Create account</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1100px] gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div>
            <h1 className="text-[40px] leading-[44px] sm:text-[60px] sm:leading-[62px]">Late invoices, chased politely.</h1>
            <p className="mt-5 max-w-[48ch] text-[18px] leading-7 text-ink-muted">
              Log what you are owed. Chaser shows what is overdue, oldest first, and writes the reminder for you to send.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {demo ? <TryDemo /> : <a href="/signup" className="btn-primary">Create an account</a>}
              {demo && <a href="/signup" className="btn-secondary">Create an account</a>}
            </div>
            <p className="mt-4 text-[14px] leading-5 text-ink-subtle">Free for up to 5 open invoices. Pro is $9 a month in Stripe test mode.</p>
          </div>

          <div aria-label="Example of the overdue list">
            <ul className="space-y-3">
              {EXAMPLES.map((e) => (
                <li key={e.client} className="tape border-x border-t border-line px-4 pt-4">
                  <div className="flex items-center gap-4 pb-3">
                    <span className={`num w-20 shrink-0 text-[28px] leading-8 ${e.tone}`}>+{e.days}d</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[18px] font-semibold leading-6">{e.client}</p>
                      <p className="text-[14px] leading-5 text-ink-muted"><span className="num text-ink">{e.amount}</span> overdue</p>
                    </div>
                    <span className="btn-small pointer-events-none">Write reminder</span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] leading-[18px] text-ink-subtle">Example strips. The days count up every day until you mark the invoice paid.</p>
          </div>
        </section>

        <section className="border-y border-ink bg-paper-raised">
          <div className="mx-auto grid max-w-[1100px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
            <div>
              <h2 className="text-[22px] leading-7">It counts the days for you</h2>
              <p className="mt-2 text-[15px] leading-[22px] text-ink-muted">Every open invoice shows how many days late it is, with the oldest at the top and a colour that gets stronger as it ages.</p>
            </div>
            <div>
              <h2 className="text-[22px] leading-7">It writes the reminder</h2>
              <p className="mt-2 text-[15px] leading-[22px] text-ink-muted">Pick friendly, firm or final. The text names the amount and the due date. It never threatens fees or legal action you did not promise.</p>
            </div>
            <div>
              <h2 className="text-[22px] leading-7">It keeps your data yours</h2>
              <p className="mt-2 text-[15px] leading-[22px] text-ink-muted">Every account sees only its own invoices, and the database enforces that, not just the app. Your plan can only change through a signed message from Stripe.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1100px] px-4 py-14 sm:px-6">
          <h2 className="text-[28px] leading-[34px]">Two plans</h2>
          <div className="mt-6 grid max-w-[720px] gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-line-strong bg-paper-raised p-5">
              <h3 className="text-[20px] leading-7">Free</h3>
              <p className="num mt-1 text-[26px] leading-8">$0</p>
              <p className="mt-2 text-[15px] leading-[22px] text-ink-muted">Up to 5 open invoices, the overdue list and the reminder writer.</p>
            </div>
            <div className="rounded-md border border-ink bg-paper-raised p-5">
              <h3 className="text-[20px] leading-7">Pro</h3>
              <p className="num mt-1 text-[26px] leading-8">$9<span className="text-[15px] text-ink-subtle"> a month</span></p>
              <p className="mt-2 text-[15px] leading-[22px] text-ink-muted">Unlimited open invoices and CSV export. Billed through Stripe, in test mode here.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink bg-paper-raised">
        <div className="mx-auto max-w-[1100px] px-4 py-5 text-[13px] leading-[18px] text-ink-muted sm:px-6">
          Demo project. All invoices and clients are sample data, and Stripe runs in test mode. Chaser writes reminders but does not send email.
        </div>
      </footer>
    </>
  );
}
