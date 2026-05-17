import { useNavigate } from "react-router-dom";
import { ChevronRight, Sparkles, X } from "lucide-react";
import { recommendForToday, type Exercise, type CheckinSignals, type RecentSession } from "@/lib/recommend";
import { getTimeContext } from "@/lib/timeContext";
import { useEffect, useMemo, useState } from "react";
import { bestStatFor, formatEffectChip, pickEffectHistoryFor, type PersonalEffect } from "@/lib/personalEffect";

const todayKey = () => {
  const d = new Date();
  return `recDismiss:${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

interface Props {
  /** Hela övningsbiblioteket. */
  exercises: Exercise[];
  /** Dagens check-in (om någon). Null = ingen check-in idag. */
  todayCheckin: CheckinSignals | null;
  /** Senaste passen (för att undvika upprepning). */
  recentSessions: RecentSession[];
  /** Antal aktiviteter loggade idag (visar "klar"-läge när > 0 om man vill). */
  loggedToday: number;
  /** Personlig effekt-historik. När angiven viktas rekommendationen och chippet "Brukar sänka din oro …" renderas. */
  personalEffect?: PersonalEffect;
  /** Stagger-index för animation. */
  index?: number;
}

/**
 * Visar EN konkret rekommendation för "just nu" — alltid ett "land"-steg
 * (≤3 min eller minsta möjliga). Tanken: lägsta möjliga friktion när man tittar
 * på sin Vecka-sida och undrar "vad kan jag göra nu?".
 *
 * Uppdateras automatiskt när props ändras (ny check-in, ny logg).
 */
export const TodayStepCard = ({ exercises, todayCheckin, recentSessions, loggedToday, personalEffect, index = 0 }: Props) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(todayKey());
      if (raw) setDismissed(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const effectHistory = useMemo(
    () =>
      personalEffect
        ? pickEffectHistoryFor(personalEffect, {
            anxiety: todayCheckin?.anxiety ?? null,
            energy: todayCheckin?.energy ?? null,
            mood_heaviness: todayCheckin?.mood_heaviness ?? null,
          })
        : undefined,
    [personalEffect, todayCheckin?.anxiety, todayCheckin?.energy, todayCheckin?.mood_heaviness],
  );

  const pick = useMemo(() => {
    if (exercises.length === 0) return null;
    const t = getTimeContext();
    const picks = recommendForToday(exercises, todayCheckin, t, null, recentSessions, effectHistory);
    const filtered = picks.filter((p) => !dismissed.includes(p.exercise.id));
    return filtered.find((p) => p.slot === "land") ?? filtered[0] ?? null;
  }, [exercises, todayCheckin, recentSessions, dismissed, effectHistory]);

  if (!pick) return null;

  const ex = pick.exercise;
  const chip = personalEffect ? bestStatFor(personalEffect, ex) : null;
  const chipText = chip ? formatEffectChip(chip) : null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = [...dismissed, ex.id];
    setDismissed(next);
    try { localStorage.setItem(todayKey(), JSON.stringify(next)); } catch { /* ignore */ }
  };

  return (
    <div
      className="w-full text-left rounded-3xl bg-orange-start text-white p-5 shadow-soft animate-pop-in flex flex-col gap-3 min-h-[200px] relative overflow-hidden"
      style={{ animationDelay: `var(--stagger-${Math.min(index, 4)})` }}
    >
      <span aria-hidden className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-orange-deep opacity-25 pointer-events-none" />
      <span aria-hidden className="absolute top-8 -right-6 w-20 h-20 rounded-full bg-orange-deep opacity-15 pointer-events-none" />

      <div className="relative z-[1] flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full bg-white/20">
          <Sparkles size={11} />
          Dagens lilla steg
        </span>
        <span className="text-[11px] font-extrabold opacity-90">
          {loggedToday > 0 ? `${loggedToday} loggat idag` : "Inget loggat än"}
        </span>
      </div>

      <div className="absolute right-4 top-12 z-[1] pointer-events-none flex flex-col items-end leading-none">
        <span className="text-[60px] leading-[56px] font-extrabold tabular-nums tracking-tight">
          {ex.duration_minutes}
        </span>
        <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-80 mt-1">
          min
        </span>
      </div>

      <div className="relative z-[1] mt-auto">
        <h4 className="text-[20px] leading-[24px] font-extrabold mb-2 pr-24">{ex.title}</h4>
        <div className="mb-3 pr-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-70 mb-0.5">
            Varför just nu
          </p>
          <p className="text-sm opacity-95 leading-snug">{pick.reasonLong}</p>
          {chipText && (
            <p className="mt-1 text-[11px] font-extrabold uppercase tracking-wider opacity-80">
              {chipText}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Inte nu"
            className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 press-soft"
          >
            <X size={12} />
            Inte nu
          </button>
          <button
            type="button"
            onClick={() => navigate(`/ovningar/${ex.id}`)}
            aria-label={`Starta: ${ex.title}`}
            className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider px-4 py-2 rounded-full bg-white text-orange-deep press-soft"
          >
            Starta
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

