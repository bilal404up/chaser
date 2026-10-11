import type { CSSProperties } from 'react'
import { FirmRing, FinalBox, PaidStamp, Stamp } from './Stamp'
import { TickFigure } from './TickFigure'
import { tierFor, figureFor, figureLabel, figureClass } from './tier'

type Props = {
  client: string
  amount: string
  due: string
  daysLate: number
  paid?: boolean
  paidOn?: string
  note?: string
  /** ms delay before the day counter ticks up (landing hero only) */
  tickDelay?: number
  className?: string
  style?: CSSProperties
}

export function ExampleStrip({ client, amount, due, daysLate, paid = false, paidOn, note, tickDelay, className = '', style }: Props) {
  const tier = tierFor(daysLate, paid)
  const figure = figureFor(daysLate, paid)
  const srLabel = figureLabel(daysLate, paid)
  const stamped = tier === 't2' || tier === 't3' || tier === 'paid'
  const ticks = tickDelay !== undefined && daysLate > 0

  return (
    <article className={`strip strip--${tier} ${className}`} style={style} aria-label={`${client}, ${amount}, ${srLabel}`}>
      <div className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-1 md:grid-cols-[auto_1fr_auto]">
        <div className="row-span-2">
          {tier === 'due' ? <span className="t-small block text-ink-muted" aria-hidden="true">due in</span> : null}
          {ticks ? (
            <TickFigure value={daysLate} prefix="+" suffix="d" delay={tickDelay} label={srLabel} className={figureClass(tier)} />
          ) : (
            <>
              <span className={figureClass(tier)} aria-hidden="true">{figure}</span>
              <span className="sr-only">{srLabel}</span>
            </>
          )}
        </div>

        <div className={`min-w-0 ${stamped ? 'md:pr-36' : ''}`}>
          <p className="t-strong truncate">{client}</p>
          {note ? <p className="t-small text-ink-muted">{note}</p> : null}
        </div>

        <div className="md:col-start-3 md:row-start-1 md:text-right">
          <p className="fig-amount">{amount}</p>
          <p className="fig-sm text-ink-muted">{paid && paidOn ? `Paid ${paidOn}` : `Due ${due}`}</p>
        </div>
      </div>

      {/* stamps sit under the figure on mobile and in the free bottom-right zone on desktop */}
      {tier === 't2' ? <FirmRing className="bottom-3 left-4 md:bottom-2 md:left-auto md:right-5" /> : null}
      {tier === 't3' ? <FinalBox className="bottom-3 left-4 md:bottom-3 md:left-auto md:right-5" /> : null}
      {tier === 'paid' ? (
        <>
          <Stamp text="Paid" ink="carbon" angle={-8} width={116} height={40} className="bottom-3 right-3 md:hidden" />
          <PaidStamp paidOn={paidOn} className="hidden md:block md:bottom-2 md:right-5" />
        </>
      ) : null}
    </article>
  )
}
