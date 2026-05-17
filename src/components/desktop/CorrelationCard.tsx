/**
 * CorrelationCard — visualiserar ett enskilt samband från `buildCorrelations`.
 *
 * Layout: rubrik + förklarande mening överst, två värdepiller på en linje
 * (hög-grupp vs låg-grupp) och en delta-badge till höger. Tonas via
 * semantiska tokens från index.css så vi aldrig hårdkodar färg.
 *
 * Används på Analys-sidan i högerkolumnen ("bevis"). Kortet är luftigt
 * tänkt för desktop men fungerar lika bra inline i mobilflödet.
 */
import type { Correlation } from "@/lib/correlations";

const toneBgClass = (tone: Correlation["tone"]): string => {
  switch (tone) {
    case "green": return "bg-green-recovery/12";
    case "purple": return "bg-purple-sleep/12";
    case "pink": return "bg-pink-move/12";
    case "orange": return "bg-orange-start/12";
    case "blue": return "bg-blue-calm/12";
    case "yellow": return "bg-yellow-journal/20";
  }
};

const toneAccentClass = (tone: Correlation["tone"]): string => {
  switch (tone) {
    case "green": return "text-green-recovery";
    case "purple": return "text-purple-sleep";
    case "pink": return "text-pink-move";
    case "orange": return "text-orange-deep";
    case "blue": return "text-blue-calm";
    case "yellow": return "text-orange-deep";
  }
};

interface Props {
  correlation: Correlation;
  index?: number;
}

export const CorrelationCard = ({ correlation: c, index = 0 }: Props) => {
  return (
    <article
      className="card-cream p-4 animate-fade-in-up"
      style={{ animationDelay: `var(--stagger-${Math.min(index, 4)})` }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className={`text-base font-extrabold leading-tight ${toneAccentClass(c.tone)}`}>
          {c.headline}
        </h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold tabular-nums ${toneBgClass(c.tone)} ${toneAccentClass(c.tone)}`}>
          {c.deltaLabel}
        </span>
      </div>
      <p className="text-sm text-text-secondary leading-snug mb-3">{c.detail}</p>
      <div className="flex items-stretch gap-2">
        <div className={`flex-1 rounded-xl ${toneBgClass(c.tone)} px-3 py-2`}>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary mb-0.5">
            {c.values.highLabel}
          </p>
          <p className={`text-lg font-extrabold tabular-nums ${toneAccentClass(c.tone)}`}>
            {c.values.highValue}
          </p>
        </div>
        <div className="flex-1 rounded-xl bg-surface-alt px-3 py-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary mb-0.5">
            {c.values.lowLabel}
          </p>
          <p className="text-lg font-extrabold tabular-nums text-foreground/70">
            {c.values.lowValue}
          </p>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-text-secondary">
        Baserat på {c.sample.high + c.sample.low} dagar.
      </p>
    </article>
  );
};
