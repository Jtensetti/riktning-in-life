import type { ReactNode } from "react";

/**
 * InsightCard — cream card used for baselines, weekly direction, trend
 * snippets. Always leads with a human conclusion before the chart.
 *
 * Spec:
 *  - cream surface, radius 28, padding 22
 *  - title = a sentence, not a metric
 *  - body = the chart / breakdown
 */
export interface InsightCardProps {
  /** Human conclusion, e.g. "Veckan är stabil". */
  conclusion: string;
  /** Optional one-line context, e.g. "Sömn verkar påverka energin mest." */
  detail?: string;
  meta?: string;
  /** Chart, sparkline, mini bars, etc. */
  children?: ReactNode;
  className?: string;
}

export const InsightCard = ({
  conclusion,
  detail,
  meta,
  children,
  className = "",
}: InsightCardProps) => (
  <section className={`ui-card-insight ${className}`}>
    {meta && <p className="text-meta text-text-secondary mb-2">{meta}</p>}
    <h3 className="text-card-title mb-1.5">{conclusion}</h3>
    {detail && <p className="text-body text-text-secondary mb-4">{detail}</p>}
    {children && <div className={detail ? "" : "mt-3"}>{children}</div>}
  </section>
);
