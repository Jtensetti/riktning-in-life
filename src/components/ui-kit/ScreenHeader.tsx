import type { ReactNode } from "react";
import { AbstractIcon } from "@/components/AbstractIcon";
import { getScreenIdentity, type ScreenKey } from "@/lib/screenIdentity";

/**
 * ScreenHeader — the single curved header used at the top of every main
 * screen. Replaces the older `HeroBanner` for everything except CrisisPlan.
 *
 * Spec:
 *  - height 150–190px (clamped via CSS vars)
 *  - one centered abstract icon, no clutter
 *  - rounded bottom curve (--header-curve)
 *  - color comes from `screenIdentity` so visual identity is consistent
 *    across header, nav, accents.
 */
export interface ScreenHeaderProps {
  screen: ScreenKey;
  /** Override the title (default uses screenIdentity.title). */
  title?: string;
  /** Override the question/subtitle (default uses screenIdentity.question). */
  subtitle?: string;
  topLeft?: ReactNode;
  topRight?: ReactNode;
}

const isLightTone = (toneVar: string) =>
  toneVar === "--yellow-journal" || toneVar === "--cream-card" || toneVar === "--surface";

export const ScreenHeader = ({
  screen,
  title,
  subtitle,
  topLeft,
  topRight,
}: ScreenHeaderProps) => {
  const id = getScreenIdentity(screen);
  const light = isLightTone(id.toneVar);
  const fg = light ? "text-foreground" : "text-white";
  const iconColor = light ? "hsl(var(--foreground))" : "hsl(var(--surface))";
  return (
    <header
      className={`-mx-6 -mt-5 mb-8 relative overflow-hidden ${fg}`}
      style={{
        background: `hsl(var(${id.toneVar}))`,
        borderBottomLeftRadius: "var(--header-curve)",
        borderBottomRightRadius: "var(--header-curve)",
      }}
    >
      <div
        className="relative px-6"
        style={{
          minHeight: "var(--header-h-min)",
          paddingTop: "max(16px, env(safe-area-inset-top))",
          paddingBottom: "16px",
        }}
      >
        {topLeft && <div className="absolute top-3 left-4 z-10">{topLeft}</div>}
        {topRight && <div className="absolute top-3 right-4 z-10">{topRight}</div>}
        <div className="flex flex-col items-center text-center gap-2">
          <AbstractIcon name={id.icon} size={44} color={iconColor} inline />
          <div>
            <h1 className="text-h2">{title ?? id.title}</h1>
            <p className={`text-body mt-0.5 opacity-85 ${light ? "" : ""}`}>
              {subtitle ?? id.question}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
