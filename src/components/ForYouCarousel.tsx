import { useNavigate } from "react-router-dom";
import { ColorCard, type CardTone } from "./ColorCard";
import { iconForActivity } from "@/lib/icons";
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

/** Accent åt slot-tonen — används bara på gula kort där text-on-yellow behöver
 *  en mörk ikonfärg för kontrast. */
const slotAccent = (slot: Pick["slot"]): string => {
  switch (slot) {
    case "calm": return "hsl(var(--blue-calm))";
    case "lift": return "hsl(var(--orange-start))";
    case "land": return "hsl(var(--pink-move))";
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
          const onYellow = tone === "yellow";
          const strong = p.fitScore >= 80;
          const icon = iconForActivity(undefined, p.exercise.category);
          return (
            <ColorCard
              key={p.exercise.id}
              tone={tone}
              icon={icon}
              iconAccent={onYellow ? slotAccent(p.slot) : "hsl(var(--surface))"}
              size="lg"
              index={i}
              onClick={() => navigate(`/ovningar/${p.exercise.id}`)}
              ariaLabel={`${slotLabel(p.slot)}: ${p.exercise.title}`}
              className="shrink-0 w-[78%] snap-start"
              eyebrow={[
                { label: slotLabel(p.slot), variant: "soft" },
                ...(strong ? [{ label: "Stark match", variant: "strong" as const }] : []),
              ]}
              title={p.exercise.title}
              reason={p.reasonLong}
              metaLeft={`${p.exercise.duration_minutes} min · ${p.reasonShort}`}
              showChevron
            />
          );
        })}
      </div>
    </section>
  );
};
