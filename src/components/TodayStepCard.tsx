import { useNavigate } from "react-router-dom";
import { ChevronRight, Sparkles } from "lucide-react";
import { AbstractIcon } from "@/components/AbstractIcon";
import { recommendForToday, type Exercise, type CheckinSignals, type RecentSession } from "@/lib/recommend";
import { getTimeContext } from "@/lib/timeContext";
import { useMemo } from "react";

interface Props {
  /** Hela övningsbiblioteket. */
  exercises: Exercise[];
  /** Dagens check-in (om någon). Null = ingen check-in idag. */
  todayCheckin: CheckinSignals | null;
  /** Senaste passen (för att undvika upprepning). */
  recentSessions: RecentSession[];
  /** Antal aktiviteter loggade idag (visar "klar"-läge när > 0 om man vill). */
  loggedToday: number;
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
export const TodayStepCard = ({ exercises, todayCheckin, recentSessions, loggedToday, index = 0 }: Props) => {
  const navigate = useNavigate();

  const pick = useMemo(() => {
    if (exercises.length === 0) return null;
    const t = getTimeContext();
    const picks = recommendForToday(exercises, todayCheckin, t, null, recentSessions);
    // Vi vill helst ha "land"-slot (minsta steg). Faller tillbaka på första bästa.
    return picks.find((p) => p.slot === "land") ?? picks[0] ?? null;
  }, [exercises, todayCheckin, recentSessions]);

  if (!pick) return null;

  const ex = pick.exercise;

  return (
    <button
      onClick={() => navigate(`/ovningar/${ex.id}`)}
      className="w-full text-left rounded-3xl bg-orange-start text-white p-5 shadow-soft press-soft animate-pop-in flex flex-col gap-3 min-h-[184px] relative overflow-hidden"
      style={{ animationDelay: `var(--stagger-${Math.min(index, 4)})` }}
      aria-label={`Dagens lilla steg: ${ex.title}`}
    >
      {/* Bakgrundsblob i mörkare ton */}
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

      <div className="absolute -right-2 top-6 opacity-95 pointer-events-none z-[1] drop-shadow-[0_6px_14px_rgba(0,0,0,0.18)]">
        <AbstractIcon name="spark" size={104} color="currentColor" />
      </div>

      <div className="relative z-[1] mt-auto">
        <h4 className="text-[20px] leading-[24px] font-extrabold mb-1 pr-24">{ex.title}</h4>
        <p className="text-sm opacity-90 leading-snug mb-3">{pick.reasonLong}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold opacity-90">
            {ex.duration_minutes} min · {pick.reasonShort}
          </span>
          <span className="shrink-0 grid place-items-center w-9 h-9 rounded-full bg-white/25">
            <ChevronRight size={18} />
          </span>
        </div>
      </div>
    </button>
  );
};
