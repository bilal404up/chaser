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
  className?: string
  style?: CSSProperties
}

/** A strip with fixed sample data, for the landing page. Same anatomy as the board, without actions. */
export function ExampleStrip({ client, amount, due, daysLate, paid = false, paidOn, paidLate, note, tickDelay, className = '', style }: Props) {
  const tier = tierFor(daysLate, paid)
  return (
    <StripFace
      tier={tier}
      className={className}
      style={style}
      label={`${client}, ${amount}, ${figureLabel(daysLate, paid, paidLate)}`}
      count={<Count daysLate={daysLate} paid={paid} paidLate={paidLate} tickDelay={tickDelay} />}
      name={client}
      note={note}
      amount={amount}
      meta={paid && paidOn ? `Paid ${paidOn}` : `Due ${due}`}
      stamp={<TierStamp tier={tier} paidOn={paidOn} />}
    />
  )
}
