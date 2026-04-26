import { InsightCard } from "./ui-kit/InsightCard";

/**
 * BaselineProgressCard — shown on the Insikter screen while the user is
 * still building their 14-day baseline. Replaces empty/half-broken charts
 * with a friendly card that sets expectations.
 *
 * Per design plan: "If baseline is not complete: avoid empty charts that
 * look broken, show friendly baseline card, show 'Dag X av 14', show what
 * will appear later."
 */
export interface BaselineProgressCardProps {
  /** How many days of check-ins the user has so far (0–14). */
  daysLogged: number;
  /** Target window length, defaults to 14. */
  target?: number;
}

const UPCOMING = [
  "Riktning över tid",
  "Återhämtning per dag",
  "Vad som verkar hjälpa",
];

export const BaselineProgressCard = ({
  daysLogged,
  target = 14,
}: BaselineProgressCardProps) => {
  const day = Math.min(daysLogged, target);
  const pct = Math.max(0, Math.min(1, day / target));
  return (
    <InsightCard
      meta={`DAG ${day} AV ${target}`}
      conclusion="Bygger baslinje"
      detail="Logga några dagar — då kan vi visa riktning, återhämtning och vad som verkar hjälpa."
    >
      <div
        className="h-2 rounded-full overflow-hidden mb-4"
        style={{ background: "hsl(var(--border-soft))" }}
        aria-hidden
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct * 100}%`,
            background: "hsl(var(--green-recovery))",
          }}
        />
      </div>
      <p className="text-meta text-text-secondary mb-2">Det här dyker upp sen</p>
      <ul className="space-y-1.5">
        {UPCOMING.map((label) => (
          <li
            key={label}
            className="text-body text-foreground/80 flex items-center gap-2"
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: "hsl(var(--green-recovery))" }}
              aria-hidden
            />
            {label}
          </li>
        ))}
      </ul>
    </InsightCard>
  );
};
