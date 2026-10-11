import { FirmRing, FinalBox, PaidStamp } from './Stamp'
import { figureClass, type Tier } from './tier'
import type { CSSVars } from './util'

type Rung = { tier: Exclude<Tier, 'due'>; range: string; tone: string }

const RUNGS: Rung[] = [
  { tier: 't1', range: '1 to 7 days late', tone: 'Friendly reminder' },
  { tier: 't2', range: '8 to 29 days late', tone: 'Firm reminder' },
  { tier: 't3', range: '30 days late or more', tone: 'Final notice' },
  { tier: 'paid', range: 'Paid', tone: 'Nothing left to send' },
]

type Props = {
  figures?: Partial<Record<Tier, string>>
  /** mount animation (drop-in) */
  animate?: boolean
  /** scroll-linked: rungs slide in, t2 and t3 shed a fresher paper overlay, stamps land */
  scroll?: boolean
  className?: string
}

export function SeverityLadder({ figures, animate = false, scroll = false, className = '' }: Props) {
  return (
    <ol aria-label="How a strip reads" className={`list-none p-0 m-0 ${className}`}>
      {RUNGS.map((r, i) => {
        const style: CSSVars = { '--i': i, '--from-x': `${(i % 2 ? 1 : -1) * 24}px`, '--from-y': '0px' }
        const figure = figures?.[r.tier]
        const stampCls = `bottom-3 right-5 ${scroll ? 'stamp-on-view' : ''}`
        const classes = [
          'strip',
          `strip--${r.tier}`,
          animate ? 'drop-in' : '',
          scroll ? 'slide-on-view' : '',
          scroll && (r.tier === 't2' || r.tier === 't3') ? 'age-on-view' : '',
        ].join(' ')
        return (
          <li key={r.tier} className="strip-slot">
            <div className={classes} style={style}>
              {scroll && (r.tier === 't2' || r.tier === 't3') ? <i className="age" aria-hidden="true" /> : null}
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 pr-32">
                {figure ? (
                  <span className={figureClass(r.tier)} aria-hidden="true">
                    {figure}
                  </span>
                ) : null}
                <div className="min-w-0">
                  <p className="t-section">{r.range}</p>
                  <p className="t-small text-ink-muted">{r.tone}</p>
                </div>
              </div>
              {r.tier === 't2' ? <FirmRing className={stampCls} /> : null}
              {r.tier === 't3' ? <FinalBox className={stampCls} /> : null}
              {r.tier === 'paid' ? <PaidStamp className={`bottom-2 right-4 ${scroll ? 'stamp-on-view' : ''}`} /> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
