import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

/**
 * HeroCard — primary recommendation card.
 *
 * Spec:
 *  - radius 32px, padding 24px
 *  - one colored background per card (semantic tone)
 *  - one title, one short description, one CTA, optional illustration
 *  - white text on color (or foreground on yellow)
 *
 * Use sparingly: max 1 HeroCard per screen at a time.
 */
export interface HeroCardProps {
  title: string;
  description?: string;
  cta?: string;
  /** CSS token name without `--`, e.g. "orange-start". */
  tone?:
    | "orange-start"
    | "yellow-journal"
    | "blue-calm"
    | "purple-sleep"
    | "green-recovery"
    | "pink-move";
  illustration?: ReactNode;
  onClick?: () => void;
  meta?: string;
  className?: string;
}

const isLightTone = (t: string) => t === "yellow-journal";

export const HeroCard = ({
  title,
  description,
  cta,
  tone = "orange-start",
  illustration,
  onClick,
  meta,
  className = "",
}: HeroCardProps) => {
  const light = isLightTone(tone);
  const fg = light ? "text-foreground" : "text-white";
  const ChipBg = light ? "bg-foreground/10" : "bg-white/20";
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`ui-card-hero relative overflow-hidden w-full text-left press-soft ${fg} ${className}`}
      style={{ background: `hsl(var(--${tone}))` }}
    >
      <span aria-hidden className="pointer-events-none absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-white/10" />
      <div className="relative z-[1] flex items-end justify-between gap-4">
        <div className="flex-1 min-w-0">
          {meta && (
            <span className={`inline-block text-meta px-2.5 py-1 rounded-full mb-3 ${ChipBg}`}>{meta}</span>
          )}
          <h2 className="text-h2 mb-2">{title}</h2>
          {description && <p className="text-body opacity-90 mb-4 line-clamp-3">{description}</p>}
          {cta && (
            <span className={`inline-flex items-center gap-1.5 text-body font-extrabold ${ChipBg} px-4 py-2 rounded-full`}>
              {cta}
              <ChevronRight size={18} />
            </span>
          )}
        </div>
        {illustration && <div className="shrink-0">{illustration}</div>}
      </div>
    </Comp>
  );
};
