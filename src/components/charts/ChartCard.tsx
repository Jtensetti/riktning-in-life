import { type ReactNode } from "react";
import { toneHsl, toneSoftBg, type ChartTone } from "@/lib/chartColors";

interface Props {
  title: string;
  subtitle?: string;
  tone?: ChartTone;
  /** Frivillig "Se mer"-länk eller annan top-right-action. */
  action?: ReactNode;
  /** Visuellt dold sammanfattning för skärmläsare. */
  ariaSummary?: string;
  /** Stagger-index för animation (0–4). */
  index?: number;
  className?: string;
  children: ReactNode;
}

/**
 * Standardram för alla diagram i appen.
 * - Cream-kort med samma radius/skugga som övriga sektioner
 * - Färgad accentprick i tonen som matchar diagrammets serie
 * - Animeras in via befintlig animate-pop-in + stagger-tokens
 */
export const ChartCard = ({
  title,
  subtitle,
  tone = "orange",
  action,
  ariaSummary,
  index = 0,
  className = "",
  children,
}: Props) => {
  return (
    <section
      className={`card-cream p-4 animate-pop-in ${className}`}
      style={{ animationDelay: `var(--stagger-${Math.min(index, 4)})` }}
      aria-label={ariaSummary || title}
    >
      <header className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2 min-w-0">
          <span
            aria-hidden
            className={`mt-1.5 shrink-0 w-2.5 h-2.5 rounded-full ${toneSoftBg(tone)}`}
            style={{ background: toneHsl(tone) }}
          />
          <div className="min-w-0">
            <h3 className="text-[15px] font-extrabold leading-tight truncate">{title}</h3>
            {subtitle && <p className="text-[11px] font-bold text-text-secondary leading-snug">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      {children}
      {ariaSummary && <p className="sr-only">{ariaSummary}</p>}
    </section>
  );
};
