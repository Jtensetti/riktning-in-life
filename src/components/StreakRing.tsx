import { useEffect, useState } from "react";
import { kindLabel, streakCopy, strongestKind, type StreakCounts } from "@/lib/streaks";

interface Props {
  counts: StreakCounts;
  className?: string;
}

/**
 * Mjuk ring "X av 7 dagar" som fylls, aldrig går sönder.
 * Animeras in genom att stroke-dashoffset ramas från 0 till slutvärde.
 */
export const StreakRing = ({ counts, className }: Props) => {
  const kind = strongestKind(counts);
  const value = counts[kind];
  const copy = streakCopy(value, kind);

  // Ring-geometri
  const size = 84;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const target = (value / 7) * c;

  // Animera in: starta på 0, gå till target.
  const [drawn, setDrawn] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => setDrawn(target), 120);
    return () => window.clearTimeout(id);
  }, [target]);

  const ringColor =
    kind === "checkin" ? "hsl(var(--orange-start))" :
    kind === "activity" ? "hsl(var(--pink-move))" :
    "hsl(var(--green-recovery))";

  return (
    <div className={`card-cream p-4 flex items-center gap-4 animate-pop-in ${className ?? ""}`}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="hsl(var(--border-soft))"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={ringColor}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - drawn}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center leading-none">
            <div className="text-[24px] font-extrabold tabular-nums">{value}</div>
            <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-secondary mt-0.5">av 7</div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary mb-1">
          {kindLabel(kind)} · denna vecka
        </p>
        <h3 className="text-[17px] leading-tight font-extrabold mb-1">{copy.headline}</h3>
        <p className="text-xs text-text-secondary leading-snug">{copy.sub}</p>

        <div className="flex gap-1.5 mt-2.5">
          <Tick label="Check" value={counts.checkin} active={kind === "checkin"} color="hsl(var(--orange-start))" />
          <Tick label="Aktivitet" value={counts.activity} active={kind === "activity"} color="hsl(var(--pink-move))" />
          <Tick label="Övning" value={counts.session} active={kind === "session"} color="hsl(var(--green-recovery))" />
        </div>
      </div>
    </div>
  );
};

const Tick = ({ label, value, active, color }: { label: string; value: number; active: boolean; color: string }) => (
  <div
    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold tabular-nums border ${
      active ? "border-transparent text-white" : "border-border-soft text-text-secondary"
    }`}
    style={active ? { background: color } : undefined}
  >
    {label} {value}/7
  </div>
);
