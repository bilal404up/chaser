import type { CSSProperties } from "react";
import { FirmRing, FinalBox, PaidStamp } from "./Stamp";
import { tierFor, figureFor, figureLabel, figureClass } from "./tier";

type Props = {
  client: string;
  /** already formatted, e.g. "$2,400.00" */
  amount: string;
  /** already formatted by the shared helper, e.g. "Sep 4, 2026" */
  due: string;
  /** negative = not yet due, 0 = today, positive = days late */
  daysLate: number;
  paid?: boolean;
  paidOn?: string;
  note?: string;
  className?: string;
  style?: CSSProperties;
};

/** Presentational strip with no actions, for the landing page's fixed examples. The real Strip in Board uses the same classes. */
export function ExampleStrip({ client, amount, due, daysLate, paid = false, paidOn, note, className = "", style }: Props) {
  const tier = tierFor(daysLate, paid);
  const figure = figureFor(daysLate, paid);
  const srLabel = figureLabel(daysLate, paid);

  return (
    <article className={`strip strip--${tier} ${className}`} style={style} aria-label={`${client}, ${amount}, ${srLabel}`}>
      <div className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-1 md:grid-cols-[auto_1fr_auto]">
        <div className="col-start-1 row-span-2">
          {tier === "due" ? (
            <span className="t-small block text-ink-muted" aria-hidden="true">
              due in
            </span>
          ) : null}
          <span className={figureClass(tier)} aria-hidden="true">
            {figure}
          </span>
          <span className="sr-only">{srLabel}</span>
        </div>

        <div className="col-start-2 min-w-0">
          <p className="t-strong truncate">{client}</p>
          {note ? <p className="t-small text-ink-muted">{note}</p> : null}
        </div>

        <div className="col-start-2 md:col-start-3 md:row-start-1 md:text-right">
          <p className="fig-amount">{amount}</p>
          <p className="fig-sm text-ink-muted">Due {due}</p>
        </div>
      </div>

      {tier === "t2" ? <FirmRing className="right-4 top-3 md:bottom-3 md:right-5 md:top-auto" /> : null}
      {tier === "t3" ? <FinalBox className="bottom-4 right-4 md:bottom-3 md:right-5" /> : null}
      {tier === "paid" ? <PaidStamp paidOn={paidOn} className="right-3 top-7 md:right-40" /> : null}
    </article>
  );
}
