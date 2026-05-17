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
  const bg = `hsl(var(${id.toneVar}))`;
  return (
    <>
      {/* Mobil: stor curved hero — exakt som tidigare. */}
      <header
        className={`lg:hidden -mx-6 -mt-5 mb-8 relative overflow-hidden ${fg}`}
        style={{
          background: bg,
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
              <p className="text-body mt-0.5 opacity-85">
                {subtitle ?? id.question}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/*
       * Desktop: kompakt sidhuvud-rad (~64px). Hero-färgen blir en liten
       * brick bakom ikonen istället för att täcka 180px höjd. Topbar har
       * redan datum/check-in-knapp så vi behöver inte upprepa det här.
       */}
      <header className="hidden lg:flex items-center gap-4 mb-6">
        <span
          className="grid place-items-center rounded-2xl shrink-0"
          style={{ width: 56, height: 56, background: bg }}
          aria-hidden
        >
          <AbstractIcon name={id.icon} size={32} color={iconColor} inline />
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="text-[26px] leading-[30px] font-extrabold tracking-tight text-foreground">
            {title ?? id.title}
          </h1>
          <p className="text-[14px] text-text-secondary mt-0.5 truncate">
            {subtitle ?? id.question}
          </p>
        </div>
        {topLeft && <div className="shrink-0">{topLeft}</div>}
        {topRight && <div className="shrink-0">{topRight}</div>}
      </header>
    </>
  );
};
