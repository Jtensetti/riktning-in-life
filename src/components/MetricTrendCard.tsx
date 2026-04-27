import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Sparkline } from "@/components/charts/Sparkline";
import { deltaChipClass } from "@/lib/valence";
import type { MetricTrend } from "@/lib/analysis";

interface Props {
  trend: MetricTrend;
  /** Stagger-index för animation. */
  index?: number;
  /** Dölj delta-chip när vi har för lite data — visa bara linjen. */
  hideDelta?: boolean;
}

const formatValue = (v: number | null, scale: MetricTrend["meta"]["scale"]): string => {
  if (v == null) return "—";
  if (scale === "hours") return `${v.toFixed(1)} h`;
  if (scale === "share") return `${Math.round((v / 10) * 100)} %`;
  return v.toFixed(1);
};

/**
 * En rad per mått i analysvyn. Lugn layout: värdet tydligt till vänster,
 * sparkline i mitten, delta-chip till höger, klartext under.
 */
export const MetricTrendCard = ({ trend, index = 0, hideDelta = false }: Props) => {
  const { meta, current, delta, series, verdict } = trend;
  const ArrowIcon = delta?.arrow === "up" ? ArrowUp : delta?.arrow === "down" ? ArrowDown : Minus;
  return (
    <article
      className="ui-card-list animate-fade-in-up"
      style={{ animationDelay: `var(--stagger-${Math.min(index, 4)})` }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-meta text-text-secondary mb-0.5">{meta.label}</p>
          <p className="text-card-title leading-none tabular-nums">
            {formatValue(current, meta.scale)}
          </p>
        </div>
        <div className="shrink-0">
          <Sparkline values={series} tone={meta.tone} width={88} height={32} />
        </div>
        {!hideDelta && delta && (
          <span
            aria-label={delta.ariaLabel}
            className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-extrabold tabular-nums ${deltaChipClass(delta.tone)}`}
          >
            <ArrowIcon size={12} strokeWidth={2.6} />
            {delta.text}
          </span>
        )}
      </div>
      <p className="text-body text-text-secondary leading-snug">
        {verdict}
      </p>
    </article>
  );
};
