import { TrendingDown, TrendingUp } from "lucide-react";
import type { Pattern } from "@/lib/patterns";
import { deltaChipClass } from "@/lib/valence";

/**
 * "Mönster vi sett" — visar upp till 3 starka, evidens-baserade mönster
 * från användarens egna data. Inga AI-formuleringar, inga gissningar.
 *
 * Färgkodning kommer nu från valens-modulen (deltaChipClass) så att samma
 * "grön = bra, röd = drar ner"-betydelse gäller överallt i appen.
 */
export const PatternsSection = ({ patterns }: { patterns: Pattern[] }) => {
  if (patterns.length === 0) return null;
  return (
    <section className="mb-7 animate-pop-in">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-xl">Mönster vi sett</h3>
        <span className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider">
          Senaste 28 dagarna
        </span>
      </div>
      <p className="text-sm text-text-secondary mb-4">
        Bara mönster som syns i din egen data — minst {patterns[0]?.sample ?? 5} observationer per påstående.
      </p>
      <div className="flex flex-col gap-3">
        {patterns.map((p, i) => {
          const positive = p.direction === "positive";
          const Icon = positive ? TrendingUp : TrendingDown;
          // Pille-färg via valens — alltid grön för positive, mjuk röd för negative.
          const chipClass = deltaChipClass(positive ? "good" : "bad");
          return (
            <article
              key={`${p.kind}-${i}`}
              className={`rounded-3xl p-5 shadow-soft animate-pop-in ${
                positive
                  ? "bg-green-recovery text-white"
                  : "bg-cream-card text-foreground border-2 border-border-soft"
              }`}
              style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
            >
              <div className="flex items-start gap-4">
                <span
                  aria-hidden
                  className={`shrink-0 grid place-items-center w-12 h-12 rounded-2xl ${
                    positive ? "bg-white/20" : "bg-surface-alt"
                  }`}
                >
                  <Icon size={22} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1.5">
                    <h4 className="text-[17px] leading-[22px] font-extrabold flex-1">
                      {p.headline}
                    </h4>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${chipClass}`}
                    >
                      {positive ? "Bra" : "Drar"}
                    </span>
                  </div>
                  <p
                    className={`text-sm leading-snug ${
                      positive ? "opacity-90" : "text-text-secondary"
                    }`}
                  >
                    {p.evidence}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider opacity-85">
                    <span>{p.sample} obs</span>
                    <span aria-hidden>·</span>
                    <span>Effekt {p.strength.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
