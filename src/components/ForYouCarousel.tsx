import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { AbstractIcon, type IconName } from "./AbstractIcon";
import { type Pick, slotLabel } from "@/lib/recommend";

const slotIcon = (slot: Pick["slot"]): IconName => {
  switch (slot) {
    case "calm": return "moon-soft";
    case "lift": return "spark";
    case "land": return "blob-smile";
  }
};

const colorBg = (color: string): string => {
  switch (color) {
    case "orange": return "bg-orange-start";
    case "blue": return "bg-blue-calm";
    case "yellow": return "bg-yellow-journal";
    case "purple": return "bg-purple-sleep";
    case "pink": return "bg-pink-move";
    case "green": return "bg-green-recovery";
    default: return "bg-cream-card";
  }
};

const colorText = (color: string): string =>
  color === "yellow" || color === "" ? "text-foreground" : "text-white";

const slotAccent = (slot: Pick["slot"]) => {
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
          const bg = colorBg(p.exercise.color);
          const txt = colorText(p.exercise.color);
          const strong = p.fitScore >= 80;
          return (
            <button
              key={p.exercise.id}
              onClick={() => navigate(`/ovningar/${p.exercise.id}`)}
              className={`shrink-0 w-[78%] snap-start rounded-3xl ${bg} ${txt} p-5 text-left shadow-soft press-soft animate-pop-in flex flex-col gap-3 min-h-[210px] relative overflow-hidden`}
              style={{ animationDelay: `var(--stagger-${i})` }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full ${
                  p.exercise.color === "yellow" ? "bg-foreground/10" : "bg-white/20"
                }`}>
                  {slotLabel(p.slot)}
                </span>
                {strong && (
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full ${
                    p.exercise.color === "yellow" ? "bg-foreground text-background" : "bg-white text-foreground"
                  }`}>
                    Stark match
                  </span>
                )}
              </div>

              <div className="absolute right-3 top-3 opacity-90 pointer-events-none">
                <AbstractIcon
                  name={slotIcon(p.slot)}
                  size={56}
                  color={p.exercise.color === "yellow" ? slotAccent(p.slot) : "currentColor"}
                  accent="currentColor"
                />
              </div>

              <div className="mt-auto">
                <h4 className="text-[20px] leading-[24px] font-extrabold mb-1 pr-12">{p.exercise.title}</h4>
                <p className="text-sm opacity-90 leading-snug mb-3">{p.reasonLong}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold opacity-80">
                    {p.exercise.duration_minutes} min · {p.reasonShort}
                  </span>
                  <span className={`shrink-0 grid place-items-center w-9 h-9 rounded-full ${
                    p.exercise.color === "yellow" ? "bg-foreground text-background" : "bg-white/25"
                  }`}>
                    <ChevronRight size={18} />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
