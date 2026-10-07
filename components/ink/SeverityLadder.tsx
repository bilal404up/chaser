import { FirmRing, FinalBox, PaidStamp } from "./Stamp";
import { figureClass, type Tier } from "./tier";
import type { CSSVars } from "./util";

type Rung = { tier: Exclude<Tier, "due">; range: string; tone: string };

const RUNGS: Rung[] = [
  { tier: "t1", range: "1 to 7 days late", tone: "Friendly reminder" },
  { tier: "t2", range: "8 to 29 days late", tone: "Firm reminder" },
  { tier: "t3", range: "30 days late or more", tone: "Final notice" },
  { tier: "paid", range: "Paid", tone: "Nothing left to send" },
];

type Props = {
  /** optional illustrative figures per tier, e.g. { t1: "+3d", t2: "+12d", t3: "+34d" }; landing page only */
  figures?: Partial<Record<Tier, string>>;
  /** stagger the drop-in animation */
  animate?: boolean;
  className?: string;
};

/** The legend. Range and tone are copy, not data, so it is safe on the Plan page. */
export function SeverityLadder({ figures, animate = false, className = "" }: Props) {
  return (
    <ol aria-label="How a strip reads" className={`m-0 list-none p-0 ${className}`}>
      {RUNGS.map((r, i) => {
        const style: CSSVars = { "--i": i };
        const figure = figures?.[r.tier];
        return (
          <li key={r.tier} className="strip-slot">
            <div className={`strip strip--${r.tier} ${animate ? "drop-in" : ""}`} style={style}>
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-4">
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
              {r.tier === "t2" ? <FirmRing className="right-4 top-3" /> : null}
              {r.tier === "t3" ? <FinalBox className="right-4 top-3" /> : null}
              {r.tier === "paid" ? <PaidStamp className="right-3 top-7" /> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
