import type { ReactNode } from "react";
import { PLAN_COPY } from "@/lib/plan-copy";
import type { Plan } from "@/lib/plan";
import { PRO_PRICE_CENTS } from "@/lib/plan";
import { CountUp } from "@/components/motion/CountUp";

type Props = {
  plan: Plan;
  current?: boolean;
  children?: ReactNode;
  className?: string;
  /** a strip of paper across the top of the card, for the one plan the page pushes (landing only) */
  ribbon?: string;
  /** counts the Pro price up from 0 once in view (landing only) */
  animatePrice?: boolean;
};

/** A plan as a receipt: name, price, the feature lines, then whatever action the page needs. */
export default function PlanReceipt({ plan, current = false, children, className = "", ribbon, animatePrice = false }: Props) {
  const p = PLAN_COPY[plan];
  const pro = plan === "pro";
  return (
    <section aria-label={`${p.name} plan`} className={`sheet sheet--shadow flex flex-col px-6 pb-8 pt-6 md:px-7 ${className}`}>
      {ribbon ? <p className="plan-ribbon t-meta">{ribbon}</p> : null}
      <div className="flex items-center justify-between gap-3">
        <h3 className="t-section">{p.name}</h3>
        {current ? <span className={`badge ${pro ? "badge--pro" : ""}`}>Current plan</span> : null}
      </div>
      <p className="mt-5 flex items-baseline gap-2">
        <span className="fig-lg">
          {animatePrice && pro ? <CountUp value={PRO_PRICE_CENTS / 100} prefix="$" /> : p.price}
        </span>
        <span className="t-small text-ink-2">{p.per || "always"}</span>
      </p>
      <ul className="mt-6 grid border-t border-[color:var(--c-ink-rule)]">
        {p.features.map((f) => (
          <li key={f} className="flex items-start gap-3 border-b border-dashed border-[color:var(--c-ink-rule)] py-2.5 text-[0.9375rem] leading-snug">
            <span aria-hidden="true" className={`mt-[0.45em] block h-1.5 w-1.5 shrink-0 ${pro ? "bg-carbon" : "bg-ink"}`} />
            {f}
          </li>
        ))}
      </ul>
      {children ? <div className="mt-auto pt-7">{children}</div> : null}
    </section>
  );
}
