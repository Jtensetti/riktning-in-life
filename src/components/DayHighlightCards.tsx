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
  const score = Math.round(h.direction);
  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-4 shadow-card animate-pop-in ${isBest ? "bg-green-recovery/12" : "bg-orange-start/12"}`}
      style={{ animationDelay: isBest ? "var(--stagger-0)" : "var(--stagger-1)" }}
    >
      {/* Numerisk lead — riktnings-score (0–100) bär kortets visuella vikt */}
      <div
        className={`absolute top-3 right-4 z-[1] pointer-events-none flex flex-col items-end leading-none ${isBest ? "text-green-recovery" : "text-orange-deep"}`}
        aria-hidden
      >
        <span className="text-[44px] leading-[40px] font-extrabold tabular-nums tracking-tight">
          {score}
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-80 mt-1">
          /100
        </span>
      </div>
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

