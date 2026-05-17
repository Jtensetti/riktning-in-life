import { useState } from "react";
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
  const [openWhy, setOpenWhy] = useState<string | null>(null);
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
          const isOpen = openWhy === p.exercise.id;
          const hasWhy = (p.whyFactors?.length ?? 0) > 0;
          return (
            <div key={p.exercise.id} className="shrink-0 w-[78%] snap-start flex flex-col gap-2">
              <ColorCard
                tone={tone}
                size="lg"
                index={i}
                onClick={() => navigate(`/ovningar/${p.exercise.id}`)}
                ariaLabel={`${slotLabel(p.slot)}: ${p.exercise.title}, ${p.exercise.duration_minutes} minuter`}
                className=""
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
              {hasWhy && (
                <div className="px-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenWhy(isOpen ? null : p.exercise.id);
                    }}
                    aria-expanded={isOpen}
                    className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary press-soft underline-offset-2 hover:underline"
                  >
                    {isOpen ? "Dölj varför" : "Varför ser jag detta?"}
                  </button>
                  {isOpen && (
                    <ul className="mt-2 space-y-1.5 animate-fade-in-up">
                      {p.whyFactors!.map((f, idx) => (
                        <li key={idx} className="text-[12px] leading-snug text-text-secondary flex gap-2">
                          <span aria-hidden className="text-text-secondary/60">·</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
