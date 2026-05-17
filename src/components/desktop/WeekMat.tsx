/**
 * WeekMat — kompakt 7-dagars översiktsmatris.
 *
 * Visar fem signaler per dag (Riktning, Sömn, Rörelse, Loggar, Check-in)
 * i en tät grid så att veckans rytm syns på ett ögonkast. Fungerar på
 * både mobil (max-w-md) och desktop — på desktop är cellerna luftigare.
 *
 * Data byggs av buildWeekMatDays() från checkins + activities så samma
 * komponent kan användas på Insikter och Analys.
 */
import { useMemo } from "react";

export type WeekMatDay = {
  date: string;               // ISO YYYY-MM-DD
  weekday: string;            // 'mån'…'sön'
  isToday: boolean;
  direction: number | null;   // 0–100 (högre = bättre)
  sleepHours: number | null;
  movementMin: number;        // summa minuter av semantic_kind = 'rorelse'
  activityCount: number;      // antal aktivitetsloggar totalt
  checkinDone: boolean;       // någon humör/sömn-rad finns
};

type CheckinLite = {
  date: string;
  sleep_hours?: number | null;
  mood_heaviness?: number | null;
  anxiety?: number | null;
  guilt_selfcriticism?: number | null;
  hopelessness?: number | null;
  energy?: number | null;
  getting_started?: number | null;
  function_score?: number | null;
};

type ActivityLite = {
  date: string;
  duration_minutes?: number | null;
  semantic_kind?: string | null;
};

const SV_WEEKDAYS = ["sön", "mån", "tis", "ons", "tor", "fre", "lör"];

const last7 = (): string[] => {
  const out: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().split("T")[0]);
  }
  return out;
};

/** Enkel "riktning"-poäng 0–100 baserad på dagens checkin. Högre = bättre.
 *  Vi viktar tyngd/oro/hopplöshet negativt och energi/start positivt så att
 *  vyn kan sägas vara "bara checkinen", utan att dra in baseline. */
const directionFor = (c?: CheckinLite | null): number | null => {
  if (!c) return null;
  const negs: number[] = [];
  for (const k of ["mood_heaviness", "anxiety", "guilt_selfcriticism", "hopelessness"] as const) {
    const v = c[k];
    if (typeof v === "number") negs.push(v);
  }
  const poss: number[] = [];
  for (const k of ["energy", "getting_started", "function_score"] as const) {
    const v = c[k];
    if (typeof v === "number") poss.push(v);
  }
  if (negs.length === 0 && poss.length === 0) return null;
  const negAvg = negs.length ? negs.reduce((a, b) => a + b, 0) / negs.length : 5;
  const posAvg = poss.length ? poss.reduce((a, b) => a + b, 0) / poss.length : 5;
  // 0–10 → 0–100, ihopvägd
  const raw = (100 - negAvg * 10) * 0.6 + posAvg * 10 * 0.4;
  return Math.max(0, Math.min(100, Math.round(raw)));
};

export const buildWeekMatDays = (
  checkins: CheckinLite[],
  activities: ActivityLite[],
  /** Förberäknad riktning per ISO-datum, om sidan redan har det (Week.tsx). */
  directionOverride?: Record<string, number | null>,
): WeekMatDay[] => {
  const today = new Date().toISOString().split("T")[0];
  const days = last7();
  return days.map((iso) => {
    const c = checkins.find((x) => x.date === iso);
    const acts = activities.filter((a) => a.date === iso);
    const movementMin = acts
      .filter((a) => a.semantic_kind === "rorelse")
      .reduce((s, a) => s + (a.duration_minutes ?? 0), 0);
    const d = new Date(iso);
    return {
      date: iso,
      weekday: SV_WEEKDAYS[d.getDay()],
      isToday: iso === today,
      direction: directionOverride && iso in directionOverride
        ? directionOverride[iso]
        : directionFor(c),
      sleepHours: c?.sleep_hours ?? null,
      movementMin,
      activityCount: acts.length,
      checkinDone: !!c && (
        c.mood_heaviness != null || c.anxiety != null ||
        c.sleep_hours != null || c.energy != null
      ),
    };
  });
};

const directionTone = (v: number | null): string => {
  if (v == null) return "bg-surface-alt text-text-secondary";
  if (v >= 70) return "bg-green-recovery text-white";
  if (v >= 50) return "bg-yellow-journal text-foreground";
  if (v >= 30) return "bg-orange-start text-white";
  return "bg-red-risk/70 text-white";
};

interface Props {
  days: WeekMatDay[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export const WeekMat = ({ days, title = "Veckomatta", subtitle = "Senaste 7 dagarna", className = "" }: Props) => {
  const maxMovement = useMemo(
    () => Math.max(60, ...days.map((d) => d.movementMin)),
    [days],
  );

  const Row = ({ label, render }: { label: string; render: (d: WeekMatDay) => React.ReactNode }) => (
    <>
      <div className="self-center pr-1.5 lg:pr-3 text-[10px] lg:text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
        {label}
      </div>
      {days.map((d) => (
        <div key={`${label}-${d.date}`}>{render(d)}</div>
      ))}
    </>
  );

  return (
    <section
      className={`card-cream p-4 lg:p-5 animate-fade-in-up ${className}`}
      aria-label={title}
    >
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider">{title}</h3>
        <p className="text-[11px] text-text-secondary font-bold">{subtitle}</p>
      </div>

      <div
        className="grid gap-1 lg:gap-1.5"
        style={{ gridTemplateColumns: "minmax(56px, auto) repeat(7, minmax(0, 1fr))" }}
      >
        {/* Header */}
        <div />
        {days.map((d) => (
          <div
            key={`hd-${d.date}`}
            className={`text-center text-[10px] lg:text-[11px] font-extrabold uppercase tracking-wide ${d.isToday ? "text-foreground" : "text-text-secondary"}`}
          >
            {d.weekday}
          </div>
        ))}

        <Row
          label="Riktning"
          render={(d) => (
            <div
              className={`h-7 lg:h-8 rounded-lg grid place-items-center ${directionTone(d.direction)} ${d.isToday ? "ring-2 ring-foreground/30" : ""}`}
              title={d.direction == null ? "Ingen check-in" : `Riktning ${d.direction}`}
            >
              <span className="text-[10px] lg:text-[11px] font-extrabold tabular-nums">
                {d.direction == null ? "—" : d.direction}
              </span>
            </div>
          )}
        />

        <Row
          label="Sömn"
          render={(d) => (
            <div className="h-7 lg:h-8 rounded-lg bg-surface-alt grid place-items-center">
              <span className="text-[10px] lg:text-[11px] font-extrabold tabular-nums text-foreground/80">
                {d.sleepHours != null ? `${d.sleepHours.toFixed(1)}h` : "—"}
              </span>
            </div>
          )}
        />

        <Row
          label="Rörelse"
          render={(d) => {
            const pct = d.movementMin > 0 ? Math.max(8, Math.min(100, (d.movementMin / maxMovement) * 100)) : 0;
            return (
              <div className="h-7 lg:h-8 rounded-lg bg-surface-alt relative overflow-hidden">
                {pct > 0 && (
                  <div
                    className="absolute inset-x-0 bottom-0 bg-pink-move/70"
                    style={{ height: `${pct}%` }}
                    aria-hidden
                  />
                )}
                <span className="absolute inset-0 grid place-items-center text-[10px] lg:text-[11px] font-extrabold tabular-nums text-foreground/85">
                  {d.movementMin > 0 ? d.movementMin : "—"}
                </span>
              </div>
            );
          }}
        />

        <Row
          label="Loggar"
          render={(d) => (
            <div className="h-7 lg:h-8 rounded-lg bg-surface-alt grid place-items-center">
              <span className="text-[10px] lg:text-[11px] font-extrabold tabular-nums text-foreground/80">
                {d.activityCount > 0 ? d.activityCount : "—"}
              </span>
            </div>
          )}
        />

        <Row
          label="Check-in"
          render={(d) => (
            <div className={`h-7 lg:h-8 rounded-lg grid place-items-center ${d.checkinDone ? "bg-green-recovery/20" : "bg-surface-alt"}`}>
              <span className={`text-[11px] lg:text-xs font-extrabold ${d.checkinDone ? "text-green-recovery" : "text-text-secondary"}`}>
                {d.checkinDone ? "Ja" : "—"}
              </span>
            </div>
          )}
        />
      </div>
    </section>
  );
};
