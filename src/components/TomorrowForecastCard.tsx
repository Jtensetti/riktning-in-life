import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { AbstractIcon, type IconName } from "@/components/AbstractIcon";
import type { Forecast } from "@/lib/forecast";
import type { Exercise } from "@/lib/recommend";

interface Props {
  forecast: Forecast;
  /** Hela övningsbiblioteket — vi väljer en match utifrån forecast.exerciseHint. */
  exercises: Exercise[];
  index?: number;
}

const KIND_ICON: Record<NonNullable<Forecast["kind"]>, IconName> = {
  sleep: "moon-soft",
  anxiety: "breath-wave",
  both: "blob-smile",
};

const KIND_LABEL: Record<NonNullable<Forecast["kind"]>, string> = {
  sleep: "Risk för kort sömn",
  anxiety: "Risk för stigande oro",
  both: "Kombinerad belastning",
};

/** Plocka första bästa övning som matchar forecast-hintens kategori. */
const pickExerciseFor = (forecast: Forecast, exercises: Exercise[]): Exercise | null => {
  if (!forecast.kind || exercises.length === 0) return null;
  const cat = forecast.exerciseHint.category;
  const inCat = exercises.filter((e) => e.category === cat);
  // Föredra korta (≤ 10 min) — sänker tröskeln att faktiskt göra det.
  const short = inCat.filter((e) => e.duration_minutes <= 10);
  return short[0] ?? inCat[0] ?? null;
};

/**
 * Konkret "Gör detta imorgon"-kort.
 * Visas bara när buildForecast() ger confidence ≥ FORECAST_VISIBLE_THRESHOLD.
 * Aldrig alarmerande copy — tonen är "vi har sett ett mönster, här är en liten åtgärd".
 */
export const TomorrowForecastCard = ({ forecast, exercises, index = 0 }: Props) => {
  const navigate = useNavigate();
  if (!forecast.kind) return null;

  const exercise = pickExerciseFor(forecast, exercises);
  const icon = KIND_ICON[forecast.kind];
  const label = KIND_LABEL[forecast.kind];

  const handleClick = () => {
    if (exercise) navigate(`/ovningar/${exercise.id}`);
    else navigate("/ovningar");
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left rounded-3xl bg-blue-calm text-white p-5 shadow-soft press-soft animate-pop-in flex flex-col gap-3 min-h-[168px] relative overflow-hidden mb-7"
      style={{ animationDelay: `var(--stagger-${Math.min(index, 4)})` }}
      aria-label={`Gör detta imorgon: ${exercise?.title ?? forecast.suggestion}`}
    >
      {/* Bakgrundsbloben matchar Today/HeroBanner-känslan */}
      <span aria-hidden className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-blue-deep opacity-25 pointer-events-none" />
      <span aria-hidden className="absolute top-8 -right-8 w-24 h-24 rounded-full bg-blue-deep opacity-15 pointer-events-none" />

      <div className="relative z-[1] flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full bg-white/20">
          Gör detta imorgon
        </span>
        <span className="text-[11px] font-extrabold opacity-90">{label}</span>
      </div>

      <div className="absolute right-3 top-12 opacity-90 pointer-events-none z-[1]">
        <AbstractIcon name={icon} size={48} color="currentColor" />
      </div>

      <div className="relative z-[1] mt-auto pr-14">
        <h4 className="text-[20px] leading-[24px] font-extrabold mb-1">
          {exercise?.title ?? forecast.suggestion}
        </h4>
        <p className="text-sm opacity-90 leading-snug mb-1">{forecast.suggestion}</p>
        <p className="text-[11px] opacity-75 leading-snug mb-3">{forecast.reason}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold opacity-90">
            {exercise ? `${exercise.duration_minutes} min · ${exercise.category}` : "Öppna övningar"}
          </span>
          <span className="shrink-0 grid place-items-center w-9 h-9 rounded-full bg-white/25">
            <ChevronRight size={18} />
          </span>
        </div>
      </div>
    </button>
  );
};
