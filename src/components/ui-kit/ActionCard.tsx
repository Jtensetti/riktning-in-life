import type { ReactNode } from "react";
import { IconTile } from "./IconTile";
import type { IconName } from "@/components/AbstractIcon";

/**
 * ActionCard — colored card for actionable items: exercises, routines,
 * journal templates, quick-log pills.
 *
 * Spec:
 *  - radius 28px, padding 20px
 *  - colored background (semantic tone)
 *  - IconTile (white-on-color variant) + title + short meta
 */
export interface ActionCardProps {
  title: string;
  meta?: string;
  icon: IconName;
  tone?:
    | "orange-start"
    | "yellow-journal"
    | "blue-calm"
    | "purple-sleep"
    | "green-recovery"
    | "pink-move";
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
  /** Render as a more compact horizontal card for grids. */
  compact?: boolean;
}

const isLightTone = (t: string) => t === "yellow-journal";

export const ActionCard = ({
  title,
  meta,
  icon,
  tone = "orange-start",
  trailing,
  onClick,
  className = "",
  compact = false,
}: ActionCardProps) => {
  const light = isLightTone(tone);
  const fg = light ? "text-foreground" : "text-white";
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`ui-card-action w-full text-left press-soft flex items-center gap-3 ${fg} ${className}`}
      style={{ background: `hsl(var(--${tone}))` }}
    >
      <div
        className="shrink-0 grid place-items-center"
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--icon-tile-radius)",
          background: light ? "hsl(var(--foreground) / 0.08)" : "hsl(0 0% 100% / 0.22)",
        }}
        aria-hidden
      >
        <IconTileInner icon={icon} light={light} />
      </div>
      <div className="flex-1 min-w-0">
        {meta && <p className={`text-meta opacity-80 mb-1 ${light ? "" : "text-white"}`}>{meta}</p>}
        <h3 className={compact ? "text-body font-extrabold leading-tight line-clamp-2" : "text-card-title leading-tight line-clamp-2"}>
          {title}
        </h3>
      </div>
      {trailing}
    </Comp>
  );
};

// Inline icon renderer that uses AbstractIcon directly for size 26 with tinted color.
import { AbstractIcon } from "@/components/AbstractIcon";
const IconTileInner = ({ icon, light }: { icon: IconName; light: boolean }) => (
  <AbstractIcon name={icon} size={26} color={light ? "hsl(var(--foreground))" : "hsl(var(--surface))"} inline />
);
// Re-export IconTile for convenience.
export { IconTile };
