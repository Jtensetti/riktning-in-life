import { type ReactNode } from "react";
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

interface Props {
  tone: CardTone;
  icon?: IconName;
  iconAccent?: string;
  className?: string;
  /** "sm" = ~120px, "md" = ~160px, "lg" = ~210px (carousel-kort). */
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  children: ReactNode;
  /** Var ikonen sitter. Default top-right. */
  iconPosition?: "top-right" | "bottom-right";
  /** Liten markörbricka uppe i högra hörnet (t.ex. checkmark när klar). */
  badge?: ReactNode;
  /** Stagger-index för animation. */
  index?: number;
  ariaLabel?: string;
}

/**
 * Återanvändbart färgat kort i Headspace-stil:
 * - platt fyllning, inga gradienter
 * - en mjuk bakgrundsblob i mörkare ton som ger djup utan att bli flashig
 * - frivillig accent-cirkel runt ikonen
 */
export const ColorCard = ({
  tone,
  icon,
  iconAccent,
  className = "",
  size = "md",
  onClick,
  children,
  iconPosition = "top-right",
  badge,
  index = 0,
  ariaLabel,
}: Props) => {
  const minH = size === "sm" ? "min-h-[112px]" : size === "lg" ? "min-h-[200px]" : "min-h-[148px]";
  const iconSize = size === "sm" ? 36 : size === "lg" ? 56 : 44;
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      aria-label={ariaLabel}
      className={`relative overflow-hidden rounded-3xl ${toneBg[tone]} ${minH} p-4 text-left shadow-soft ${onClick ? "press-soft" : ""} animate-pop-in flex flex-col justify-between ${className}`}
      style={{ animationDelay: `var(--stagger-${Math.min(index, 4)})` }}
    >
      {/* Bakgrundsblob — Headspace-vibe, alltid mörkare nyans, aldrig gradient */}
      <span
        aria-hidden
        className={`absolute -bottom-10 -right-12 w-44 h-44 rounded-full ${toneBlob[tone]} opacity-25 pointer-events-none`}
      />
      {/* Sekundär liten cirkel för rytm */}
      <span
        aria-hidden
        className={`absolute top-10 -right-8 w-20 h-20 rounded-full ${toneBlob[tone]} opacity-15 pointer-events-none`}
      />

      {badge && (
        <span className="absolute top-2 right-2 z-10">{badge}</span>
      )}

      {icon && iconPosition === "top-right" && (
        <span className="absolute top-3 right-3 z-[1] pointer-events-none">
          <AbstractIcon name={icon} size={iconSize} color="currentColor" accent={iconAccent} />
        </span>
      )}

      <div className="relative z-[1]">
        {icon && iconPosition === "bottom-right" && (
          <div className="w-11 h-11 rounded-full bg-white/25 grid place-items-center mb-2">
            <AbstractIcon name={icon} size={24} color="currentColor" accent={iconAccent} />
          </div>
        )}
      </div>

      <div className="relative z-[1] mt-auto">{children}</div>
    </Tag>
  );
};
