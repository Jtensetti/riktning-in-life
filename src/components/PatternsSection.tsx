import { TrendingDown, TrendingUp } from "lucide-react";
import type { Pattern } from "@/lib/patterns";

/**
 * "Mönster vi sett" — visar upp till 3 starka, evidens-baserade mönster
 * från användarens egna data. Inga AI-formuleringar, inga gissningar.
 *
 * Designval:
 *  - Inget kort visas om listan är tom (vi gör inget brus av tomhet).
 *  - Positiva mönster (lyftare) visas med grön accent, negativa med varm sand.
 *  - Antal observationer skrivs ut explicit så användaren kan väga signalen själv.
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
                  <h4 className="text-[17px] leading-[22px] font-extrabold mb-1.5">
                    {p.headline}
                  </h4>
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
