import { type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { AbstractIcon, type IconName } from "./AbstractIcon";

export type CardTone = "orange" | "blue" | "yellow" | "purple" | "pink" | "green";

const toneBg: Record<CardTone, string> = {
  orange: "bg-orange-start text-white",
  blue: "bg-blue-calm text-white",
  yellow: "bg-yellow-journal text-foreground",
  purple: "bg-purple-sleep text-white",
  pink: "bg-pink-move text-white",
  green: "bg-green-recovery text-white",
};

/** En mörkare ton av samma färg, för bakgrundsbloben. */
const toneBlob: Record<CardTone, string> = {
  orange: "bg-orange-deep",
  blue: "bg-blue-deep",
  yellow: "bg-orange-start",
  purple: "bg-purple-sleep",
  pink: "bg-pink-move",
  green: "bg-green-recovery",
};

export interface ColorCardEyebrow {
  label: string;
  /** Visuell vikt — "soft" = neutral pill, "strong" = inverterad/CTA-känsla. */
  variant?: "soft" | "strong";
}

/**
 * Stor numerisk/textuell ledning (top-right). Bär ~40 % av kortets visuella vikt.
 * Använd siffran som faktiskt betyder något (minuter, score, antal) — aldrig
 * dekorativ illustration.
 */
export interface ColorCardLead {
  /** T.ex. "12" eller "85". Renderas extrafet och stort. */
  value: ReactNode;
  /** Liten etikett under, t.ex. "min" eller "/100". */
  unit?: ReactNode;
}

interface Props {
  tone: CardTone;
  /** Bakåtkompat — om `lead` saknas används icon-namnet i en liten Lucide-stil mark. */
  icon?: IconName;
  iconAccent?: string;
  className?: string;
  /** "sm" = ~120px, "md" = ~160px, "lg" = ~210px (carousel-kort). */
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  /** Var det lilla mark/leadet sitter. Default top-right. */
  iconPosition?: "top-right" | "bottom-right";
  /** Liten markörbricka uppe i högra hörnet (t.ex. checkmark när klar). */
  badge?: ReactNode;
  /** Stagger-index för animation. */
  index?: number;
  ariaLabel?: string;

  /* === "Today card" layout-slots === */
  /** En eller flera pillar som visas ovanför titeln. */
  eyebrow?: ColorCardEyebrow | ColorCardEyebrow[];
  /** Stor extrafet titel. */
  title?: ReactNode;
  /** Förklarande mening under titeln. */
  reason?: ReactNode;
  /** Liten meta-text längst ner till vänster (t.ex. "5 min · Andning"). */
  metaLeft?: ReactNode;
  /** Egen nod längst ner till höger. Default: chevron om showChevron=true. */
  metaRight?: ReactNode;
  /** Visa default chevron-knapp i nedre högra hörnet. */
  showChevron?: boolean;
  /** Numerisk/textuell ledning (top-right). Ersätter sticker-illustrationen. */
  lead?: ColorCardLead;

  /** Escape hatch för fri layout (t.ex. kompakta kort). Ignoreras om title sätts. */
  children?: ReactNode;
}

/**
 * Återanvändbart färgat kort i Headspace-stil.
 *
 * Den visuella ledningen ligger i `lead` (en stor siffra/text som
 * faktiskt betyder något — minuter, score, antal). `icon` accepteras för
 * bakåtkompat men renderas bara som en liten textuell mark när `lead`
 * saknas, så vi undviker dekorativa stickers.
 */
export const ColorCard = ({
  tone,
  icon,
  iconAccent,
  className = "",
  size = "md",
  onClick,
  iconPosition = "top-right",
  badge,
  index = 0,
  ariaLabel,
  eyebrow,
  title,
  reason,
  metaLeft,
  metaRight,
  showChevron,
  lead,
  children,
}: Props) => {
  const minH = size === "sm" ? "min-h-[124px]" : size === "lg" ? "min-h-[220px]" : "min-h-[164px]";
  const Tag = onClick ? "button" : "div";
  const onYellow = tone === "yellow";

  const eyebrows = eyebrow ? (Array.isArray(eyebrow) ? eyebrow : [eyebrow]) : [];

  const pillClass = (variant: ColorCardEyebrow["variant"] = "soft") => {
    if (variant === "strong") {
      return onYellow ? "bg-foreground text-background" : "bg-white text-foreground";
    }
    return onYellow ? "bg-foreground/10" : "bg-white/20";
  };

  const chevronWrapClass = onYellow ? "bg-foreground text-background" : "bg-white/25";

  const useStructuredLayout = title !== undefined;
  const leadValueClass =
    size === "sm"
      ? "text-[36px] leading-[36px]"
      : size === "lg"
        ? "text-[64px] leading-[60px]"
        : "text-[52px] leading-[48px]";

  // Bakåtkompat: om bara `icon` skickas (inget `lead`) renderar vi en liten,
  // diskret mark — inte längre en dekorativ sticker.
  const fallbackMark = icon && !lead;

  return (
    <Tag
      onClick={onClick}
      aria-label={ariaLabel}
      className={`relative overflow-hidden rounded-3xl ${toneBg[tone]} ${minH} p-4 text-left shadow-soft ${onClick ? "press-soft" : ""} animate-pop-in flex flex-col justify-between ${className}`}
      style={{ animationDelay: `var(--stagger-${Math.min(index, 4)})` }}
    >
      {/* Bakgrundsblob — mjuk ton-på-ton, aldrig gradient */}
      <span
        aria-hidden
        className={`absolute -bottom-10 -right-12 w-44 h-44 rounded-full ${toneBlob[tone]} opacity-25 pointer-events-none`}
      />
      <span
        aria-hidden
        className={`absolute top-10 -right-8 w-20 h-20 rounded-full ${toneBlob[tone]} opacity-15 pointer-events-none`}
      />

      {badge && <span className="absolute top-2 right-2 z-10">{badge}</span>}

      {/* Top-right lead — stor siffra/text som bär ~40% av kortets vikt */}
      {lead && iconPosition === "top-right" && (
        <span
          className="absolute top-3 right-4 z-[1] pointer-events-none flex flex-col items-end leading-none"
          aria-hidden
        >
          <span className={`font-extrabold tabular-nums tracking-tight ${leadValueClass}`}>
            {lead.value}
          </span>
          {lead.unit && (
            <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-80 mt-1">
              {lead.unit}
            </span>
          )}
        </span>
      )}

      {/* Bakåtkompat-mark när bara `icon` skickas — diskret, inte sticker */}
      {fallbackMark && iconPosition === "top-right" && (
        <span className="absolute top-3 right-3 z-[1] pointer-events-none opacity-90">
          <AbstractIcon name={icon!} size={28} color="currentColor" accent={iconAccent} inline />
        </span>
      )}

      <div className="relative z-[1]">
        {(lead || icon) && iconPosition === "bottom-right" && (
          <div className="w-14 h-14 rounded-2xl bg-white/15 grid place-items-center mb-2 leading-none">
            {lead ? (
              <span className="text-[22px] font-extrabold tabular-nums">{lead.value}</span>
            ) : (
              <AbstractIcon name={icon!} size={24} color="currentColor" accent={iconAccent} inline />
            )}
          </div>
        )}
      </div>

      <div className="relative z-[1] mt-auto">
        {useStructuredLayout ? (
          <>
            {eyebrows.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {eyebrows.map((e, i) => (
                  <span
                    key={i}
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full ${pillClass(e.variant)}`}
                  >
                    {e.label}
                  </span>
                ))}
              </div>
            )}
            <h4 className={`text-[20px] leading-[24px] font-extrabold mb-1 ${lead && iconPosition === "top-right" ? "pr-24" : "pr-12"}`}>
              {title}
            </h4>
            {reason && <p className="text-sm opacity-90 leading-snug mb-3">{reason}</p>}
            {(metaLeft || metaRight || showChevron) && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold opacity-80">{metaLeft}</span>
                {metaRight ?? (showChevron && (
                  <span className={`shrink-0 grid place-items-center w-9 h-9 rounded-full ${chevronWrapClass}`}>
                    <ChevronRight size={18} />
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          children
        )}
      </div>
    </Tag>
  );
};

