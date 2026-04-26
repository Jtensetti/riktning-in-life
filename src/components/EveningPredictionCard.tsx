import { useNavigate } from "react-router-dom";
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
        size="md"
        onClick={() => navigate(`/ovningar?cat=${encodeURIComponent(prediction.matchCategory)}`)}
        ariaLabel={`${prediction.headline}. ${prediction.reason}`}
        eyebrow={{ label: "Tipset till imorgon" }}
        lead={{ value: "Ikväll", unit: prediction.matchCategory }}
        title={prediction.headline}
        reason={prediction.reason}
        metaLeft={prediction.matchCategory}
        showChevron
      />
    </section>
  );
};
