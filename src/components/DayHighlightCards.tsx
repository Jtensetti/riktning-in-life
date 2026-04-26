import { AbstractIcon } from "./AbstractIcon";
import type { DayHighlight, DayHighlights } from "@/lib/dayInsights";

/** Två små kort under WeekDirectionChart: bästa & tyngsta dag i veckan. */
export const DayHighlightCards = ({ data }: { data: DayHighlights }) => {
  if (!data.best || !data.worst) return null;
  return (
    <div className="grid grid-cols-2 gap-3 mb-3">
      <HighlightCard h={data.best} variant="best" />
      <HighlightCard h={data.worst} variant="worst" />
    </div>
  );
};

const dayName = (iso: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (iso === today.toISOString().split("T")[0]) return "Idag";
  return new Date(iso).toLocaleDateString("sv-SE", { weekday: "long" });
};

const HighlightCard = ({ h, variant }: { h: DayHighlight; variant: "best" | "worst" }) => {
  const isBest = variant === "best";
  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-4 pr-3 shadow-card animate-pop-in ${isBest ? "bg-green-recovery/12" : "bg-orange-start/12"}`}
      style={{ animationDelay: isBest ? "var(--stagger-0)" : "var(--stagger-1)" }}
    >
      <span className="absolute -top-2 -right-2 z-[1] pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.12)]" aria-hidden>
        <AbstractIcon
          name={isBest ? "blob-smile" : "moon-soft"}
          size={64}
          color={isBest ? "hsl(var(--green-recovery))" : "hsl(var(--orange-start))"}
        />
      </span>
      <div className="relative pr-14">
        <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isBest ? "text-green-recovery" : "text-orange-deep"}`}>
          {isBest ? "Bästa dagen" : "Tyngst"}
        </span>
        <p className="text-[15px] font-extrabold capitalize mb-1.5 mt-1">{dayName(h.iso)}</p>
        {h.reasons.length > 0 ? (
          <ul className="space-y-0.5">
            {h.reasons.map((r, i) => (
              <li key={i} className="text-xs text-text-secondary leading-snug">· {r}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-text-secondary italic">Inga tydliga orsaker idag.</p>
        )}
      </div>
    </div>
  );
};
