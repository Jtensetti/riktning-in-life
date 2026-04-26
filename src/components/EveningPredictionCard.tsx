import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { ColorCard, type CardTone } from "./ColorCard";
import type { EveningPrediction } from "@/lib/dayInsights";

/**
 * "Riktning ikväll" — en mjuk prediktiv nudge som visas på Today efter ~19:00
 * när vi har tillräckligt med data för att uttala oss.
 */
export const EveningPredictionCard = ({ prediction }: { prediction: EveningPrediction }) => {
  const navigate = useNavigate();
  return (
    <section className="mb-7 animate-pop-in">
      <h3 className="text-xl mb-3">Riktning ikväll</h3>
      <ColorCard
        tone={prediction.tone as CardTone}
        icon="moon-stars"
        iconAccent="hsl(var(--surface))"
        size="md"
        onClick={() => navigate(`/ovningar?cat=${encodeURIComponent(prediction.matchCategory)}`)}
        ariaLabel={`${prediction.headline}. ${prediction.reason}`}
      >
        <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full mb-3 bg-white/20">
          Tipset till imorgon
        </span>
        <h4 className="text-[20px] leading-[24px] font-extrabold mb-1 pr-12">{prediction.headline}</h4>
        <p className="text-sm opacity-90 leading-snug mb-3">{prediction.reason}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold opacity-80">{prediction.matchCategory}</span>
          <span className="shrink-0 grid place-items-center w-9 h-9 rounded-full bg-white/25">
            <ChevronRight size={18} />
          </span>
        </div>
      </ColorCard>
    </section>
  );
};
