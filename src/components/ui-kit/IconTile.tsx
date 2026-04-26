import type { CSSProperties, ReactNode } from "react";
import { AbstractIcon, type IconName } from "@/components/AbstractIcon";

/**
 * IconTile — the only "icon container" used across the app.
 *
 * Spec (locked):
 *  - 44–48px square
 *  - radius 14–16px
 *  - soft tinted background derived from a semantic color token
 *  - icon centered, single-color from AbstractIcon family
 *
 * Use this instead of ad-hoc emoji boxes, gradient circles, or one-off
 * `bg-orange-start grid place-items-center` blocks.
 */
export interface IconTileProps {
  icon: IconName;
  /** CSS color token name without `--` prefix, e.g. "orange-start". */
  tone?:
    | "orange-start"
    | "yellow-journal"
    | "blue-calm"
    | "purple-sleep"
    | "green-recovery"
    | "pink-move"
    | "cream-card"
    | "red-risk";
  /** 44 (default) or 48. */
  size?: 44 | 48;
  /** Override icon color (defaults to the tone color). */
  iconColor?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const ICON_SIZE = { 44: 26, 48: 28 } as const;

export const IconTile = ({
  icon,
  tone = "orange-start",
  size = 44,
  iconColor,
  className = "",
  style,
}: IconTileProps) => {
  const toneVar = `--${tone}`;
  const finalIconColor = iconColor ?? `hsl(var(${toneVar}))`;
  return (
    <div
      className={`shrink-0 grid place-items-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "var(--icon-tile-radius)",
        background: `hsl(var(${toneVar}) / 0.14)`,
        ...style,
      }}
      aria-hidden
    >
      <AbstractIcon name={icon} size={ICON_SIZE[size]} color={finalIconColor} inline />
    </div>
  );
};
