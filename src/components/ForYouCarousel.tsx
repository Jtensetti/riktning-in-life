import { useNavigate } from "react-router-dom";
import { ColorCard, type CardTone } from "./ColorCard";
import { type Pick, slotLabel } from "@/lib/recommend";

/** Normalisera godtycklig övnings-färg till en giltig CardTone. */
const asTone = (color: string): CardTone => {
  switch (color) {
    case "orange":
    case "blue":
    case "yellow":
    case "purple":
    case "pink":
    case "green":
      return color;
    default:
      return "orange";
  }
};

interface Props {
  picks: Pick[];
}

export const ForYouCarousel = ({ picks }: Props) => {
  const navigate = useNavigate();
  if (picks.length === 0) return null;

  return (
    <section className="mb-7 -mx-6">
      <div className="px-6 mb-3 flex items-baseline justify-between">
        <div>
          <h3 className="text-xl">För dig just nu</h3>
          <p className="text-sm text-text-secondary">Tre vägar in i dagen</p>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory flex gap-3 px-6 pb-3 -mb-3">
        {picks.map((p, i) => {
          const tone = asTone(p.exercise.color);
          const strong = p.fitScore >= 80;
          return (
            <ColorCard
              key={p.exercise.id}
              tone={tone}
              size="lg"
              index={i}
              onClick={() => navigate(`/ovningar/${p.exercise.id}`)}
              ariaLabel={`${slotLabel(p.slot)}: ${p.exercise.title}, ${p.exercise.duration_minutes} minuter`}
              className="shrink-0 w-[78%] snap-start"
              eyebrow={[
                { label: slotLabel(p.slot), variant: "soft" },
                ...(strong ? [{ label: "Stark match", variant: "strong" as const }] : []),
              ]}
              lead={{ value: p.exercise.duration_minutes, unit: "min" }}
              title={p.exercise.title}
              reason={
                p.effectChip ? (
                  <>
                    {p.reasonLong}
                    <span className="block mt-1 text-[11px] font-extrabold uppercase tracking-wider opacity-80">
                      {p.effectChip}
                    </span>
                  </>
                ) : (
                  p.reasonLong
                )
              }
              metaLeft={p.reasonShort}
              showChevron
            />
          );
        })}
      </div>
    </section>
  );
};

