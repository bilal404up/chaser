"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { formatUsd } from "@/lib/money"
import { Count, StripFace, TierStamp } from "@/components/ink/StripFace"
import { TickFigure } from "@/components/ink/TickFigure"
import { countClass, figureLabel, tierFor } from "@/components/ink/tier"

export type ToneRow = { name: string; range: string; days: number; client: string; cents: number; subject: string }

const STAGE_CLASS = ["aging-dot--friendly", "aging-dot--firm", "aging-dot--final"]

/**
 * The three reminder tones as one strip. On wide screens with motion allowed, the section is pinned and
 * scroll-linked: the strip ages from friendly to firm to final as each stage comes into the middle of the screen.
 * Everywhere else (narrow screens, reduced motion, before mount) it is the three static strips.
 */
export function AgingStrip({ rows, heading }: { rows: ToneRow[]; heading: ReactNode }) {
  const [pinned, setPinned] = useState(false)
  const [view, setView] = useState<{ stage: number; from: number }>({ stage: 0, from: 0 })
  const [announce, setAnnounce] = useState("")
  const markers = useRef<(HTMLDivElement | null)[]>([])
  const stageRef = useRef(0)
  const primed = useRef(false)

  // Pinned only on wide screens with motion allowed. Re-checked if the screen or the setting changes.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)")
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setPinned(wide.matches && !reduce.matches)
    sync()
    wide.addEventListener("change", sync)
    reduce.addEventListener("change", sync)
    return () => {
      wide.removeEventListener("change", sync)
      reduce.removeEventListener("change", sync)
    }
  }, [])

  // Scroll link: the marker in the middle band of the screen picks the stage.
  useEffect(() => {
    if (!pinned) return
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).pop()
        if (!hit) return
        const next = Number(hit.target.getAttribute("data-stage"))
        const first = !primed.current
        primed.current = true
        if (next === stageRef.current) return
        // Announce real changes only, never the first position the page lands on.
        if (!first) setAnnounce(`${rows[next].name} reminder, ${figureLabel(rows[next].days, false)}`)
        stageRef.current = next
        setView((v) => ({ stage: next, from: rows[v.stage].days }))
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
    )
    markers.current.forEach((m) => m && io.observe(m))
    return () => io.disconnect()
  }, [pinned, rows])

  function choose(i: number) {
    if (i === stageRef.current) return
    markers.current[i]?.scrollIntoView({ block: "center", behavior: "smooth" })
  }

  const heads = <div>{heading}</div>

  if (!pinned) {
    return (
      <section className="py-24 lg:py-32" aria-labelledby="tones-title">
        <div className="wrap grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-16">
          {heads}
          <ol className="m-0 grid list-none gap-3 p-0" aria-label="Reminder tones">
            {rows.map((t) => {
              const tier = tierFor(t.days, false)
              return (
                <li key={t.name}>
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
                          {t.subject}
                        </span>
                      </>
                    }
                    amount={formatUsd(t.cents)}
                    meta={t.client}
                    stamp={<TierStamp tier={tier} stampKey={t.client} />}
                  />
                </li>
              )
            })}
          </ol>
        </div>
      </section>
    )
  }

  const row = rows[view.stage]
  const tier = tierFor(row.days, false)
  const label = figureLabel(row.days, false)

  return (
    <section className="aging--pinned" aria-labelledby="tones-title">
      <div className="aging-sticky wrap">
        {heads}
        <div className="min-w-0">
          <div className="aging-strip">
            <StripFace
              tier={tier}
              label={`${row.name} reminder, ${row.range}. ${label}`}
              count={
                <TickFigure
                  key={view.stage}
                  value={row.days}
                  from={view.from}
                  prefix="+"
                  suffix="d"
                  label={label}
                  className={countClass(tier, `+${row.days}d`)}
                  vary
                />
              }
              name={row.name}
              note={
                <>
                  <span className="block">{row.range}</span>
                  <span key={view.stage} className="mt-2 block text-ink rise-in">
                    <span className="t-meta mr-2 text-ink-2">Subject</span>
                    {row.subject}
                  </span>
                </>
              }
              amount={formatUsd(row.cents)}
              meta={row.client}
              stamp={<TierStamp key={view.stage} tier={tier} fresh={view.stage > 0} stampKey={row.client} />}
            />
          </div>
          <div className="aging-stages" role="group" aria-label="Choose a reminder tone to preview">
            {rows.map((r, i) => (
              <button
                key={r.name}
                type="button"
                className="aging-stage press"
                aria-pressed={view.stage === i}
                onClick={() => choose(i)}
              >
                <span className={`aging-dot ${STAGE_CLASS[i] ?? ""}`} aria-hidden="true" />
                {r.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {rows.map((r, i) => (
        <div
          key={r.name}
          ref={(el) => {
            markers.current[i] = el
          }}
          data-stage={i}
          aria-hidden="true"
          className="aging-marker"
          style={{ top: `${i * 70}vh` }}
        />
      ))}
    </section>
  )
}
