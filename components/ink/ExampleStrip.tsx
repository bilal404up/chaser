import type { CSSProperties } from 'react'
import { Count, StripFace, TierStamp } from './StripFace'
import { figureLabel, tierFor } from './tier'

type Props = {
  client: string
  amount: string
  due: string
  daysLate: number
  paid?: boolean
  paidOn?: string
  /** days late when it was paid (0 or less is on time) */
  paidLate?: number
  note?: string
  /** ms delay before the day counter ticks up (landing hero only) */
  tickDelay?: number
  /** ms delay before the stamp slams on (landing hero only). Also makes the strip shake once as the stamp lands. */
  stampDelay?: number
  className?: string
  style?: CSSProperties
}

/** A strip with fixed sample data, for the landing page. Same anatomy as the board, without actions. */
export function ExampleStrip({ client, amount, due, daysLate, paid = false, paidOn, paidLate, note, tickDelay, stampDelay, className = '', style }: Props) {
  const tier = tierFor(daysLate, paid)
  const timed = stampDelay !== undefined
  const landed = timed && tier !== 'due'
  const timing = timed ? ({ '--stamp-delay': `${stampDelay}ms`, '--land-delay': `${stampDelay + 120}ms` } as CSSProperties) : undefined
  return (
    <StripFace
      tier={tier}
      className={[className, landed ? 'strip-landed' : ''].filter(Boolean).join(' ')}
      style={timing ? { ...style, ...timing } : style}
      label={`${client}, ${amount}, ${figureLabel(daysLate, paid, paidLate)}`}
      count={<Count daysLate={daysLate} paid={paid} paidLate={paidLate} tickDelay={tickDelay} />}
      name={client}
      note={note}
      amount={amount}
      meta={paid && paidOn ? `Paid ${paidOn}` : `Due ${due}`}
      stamp={<TierStamp tier={tier} paidOn={paidOn} stampKey={client} fresh={timed} />}
    />
  )
}
