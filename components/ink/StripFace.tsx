import type { CSSProperties, ReactNode } from "react"
import { FinalBox, FirmRing, PaidStamp } from "./Stamp"
import { TickFigure } from "./TickFigure"
import { countClass, countStyle, countText, figureLabel, paidLineText, tierFor, type Tier } from "./tier"
import { stampAngle, stampSeed } from "./util"

/** The small mono word above the count. */
function countCaption(daysLate: number, paid: boolean) {
  if (paid) return "paid"
  if (daysLate < 0) return "due in"
  if (daysLate === 0) return "due"
  return "late"
}

type CountProps = { daysLate: number; paid?: boolean; paidLate?: number | null; tickDelay?: number }

/** The count that gets louder: weight and width grow with the days late. */
export function Count({ daysLate, paid = false, paidLate, tickDelay }: CountProps) {
  const tier = tierFor(daysLate, paid)
  const text = countText(daysLate, paid, paidLate)
  const label = figureLabel(daysLate, paid, paidLate)
  const cls = countClass(tier, text)
  if (paid) {
    const late = paidLate !== null && paidLate !== undefined && paidLate > 0
    return (
      <>
        <span className="t-meta mb-1.5 block text-ink-2" aria-hidden="true">
          {countCaption(daysLate, paid)}
        </span>
        <span className="t-meta block" style={{ color: late ? "var(--c-stamp)" : "var(--c-ink-2)" }} aria-hidden="true">
          {paidLineText(paidLate)}
        </span>
        <span className="sr-only">{label}</span>
      </>
    )
  }
  return (
    <>
      <span className="t-meta mb-1.5 block text-ink-2" aria-hidden="true">
        {countCaption(daysLate, paid)}
      </span>
      {tickDelay !== undefined && daysLate > 0 ? (
        <TickFigure value={daysLate} prefix="+" suffix="d" delay={tickDelay} label={label} className={cls} vary />
      ) : (
        <>
          <span className={cls} style={countStyle(daysLate, paid)} aria-hidden="true">
            {text}
          </span>
          <span className="sr-only">{label}</span>
        </>
      )}
    </>
  )
}

/** The stamp for a tier, or nothing. Stamps only animate when `fresh` (a state change), never on load. */
export function TierStamp({ tier, paidOn, fresh = false, stampKey }: { tier: Tier; paidOn?: string; fresh?: boolean; stampKey?: string }) {
  // The key (invoice id or client name) gives each stamp its own tilt and ink wear, stable across renders.
  const tilt = stampKey ? { angle: stampAngle(stampKey), seed: stampSeed(stampKey) } : {}
  if (tier === "t2") return <FirmRing fresh={fresh} {...tilt} />
  if (tier === "t3") return <FinalBox fresh={fresh} {...tilt} />
  if (tier === "paid") return <PaidStamp paidOn={paidOn} fresh={fresh} {...tilt} width={82} height={30} />
  return null
}

type FaceProps = {
  tier: Tier
  count: ReactNode
  name: ReactNode
  note?: ReactNode
  amount?: ReactNode
  meta?: ReactNode
  stamp?: ReactNode
  actions?: ReactNode
  label: string
  className?: string
  style?: CSSProperties
  fresh?: boolean
}

/**
 * One receipt strip. Count in a fixed column, name and note get the free width (up to two lines, never cut short
 * on one), amount and due date on the right, stamp in its own cell so it never steals width from the name.
 */
export function StripFace({ tier, count, name, note, amount, meta, stamp, actions, label, className = "", style, fresh }: FaceProps) {
  return (
    <article className={`strip strip--${tier} ${className}`} style={style} data-fresh={fresh ? "true" : undefined} aria-label={label}>
      <div className="strip-grid">
        <div className="s-count">{count}</div>
        <div className="s-main">
          <p className="s-name">{name}</p>
          {note ? <p className="s-note">{note}</p> : null}
        </div>
        {amount || meta ? (
          <div className="s-amount">
            {amount ? <p className="fig-amount">{amount}</p> : null}
            {meta ? <p className="t-meta mt-1 text-ink-2">{meta}</p> : null}
          </div>
        ) : null}
        {actions ? <div className="s-actions">{actions}</div> : null}
        {stamp ? <div className="s-stamp">{stamp}</div> : null}
      </div>
    </article>
  )
}
