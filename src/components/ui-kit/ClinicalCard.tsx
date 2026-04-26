import type { ReactNode } from "react";

/**
 * ClinicalCard — neutral, professional card used ONLY in the weekly
 * report / clinical export. No playful illustrations, no semantic colors
 * inside the card body.
 */
export interface ClinicalCardProps {
  title: string;
  meta?: string;
  trailing?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export const ClinicalCard = ({
  title,
  meta,
  trailing,
  children,
  className = "",
}: ClinicalCardProps) => (
  <section className={`ui-card-clinical ${className}`}>
    <header className="flex items-baseline justify-between gap-3 mb-2">
      <h3 className="text-base font-extrabold text-foreground leading-tight">{title}</h3>
      {meta && <span className="text-xs font-bold text-text-secondary tabular-nums shrink-0">{meta}</span>}
    </header>
    {children && <div className="text-sm text-foreground/90 leading-snug">{children}</div>}
    {trailing && <div className="mt-2">{trailing}</div>}
  </section>
);
