import { AbstractIcon, type IconName } from "./AbstractIcon";

/**
 * Standardiserad hero/header-gradient med flytande abstrakt ikon.
 * Använd överst på sidor inuti <AppShell> så får alla sektioner samma
 * padding, radius och timing.
 *
 * Mått (låsta):
 * - höjd: 144px (h-36)  — luftigt men kompakt på små skärmar
 * - radius: 36px nedre hörn
 * - blob position: top-6, centrerad
 * - blob storlek: 72px
 * - vågseparator: 60px
 * - animationstiming: float 4s (matchar tailwind keyframe)
 */
export interface HeroBannerProps {
  /** HSL-värde, t.ex. "var(--orange-start)" eller "var(--blue-calm)" */
  tone: string;
  icon: IconName;
  /** Färg på blob-ikonen. Default väljs lämpligt mot tonen. */
  iconColor?: string;
  iconAccent?: string;
  /** Innehåll positionerat absolut över bannern (t.ex. settings-knapp). */
  topLeft?: React.ReactNode;
}

export const HeroBanner = ({
  tone,
  icon,
  iconColor = "hsl(var(--surface))",
  iconAccent,
  topLeft,
}: HeroBannerProps) => {
  return (
    <div
      className="-mx-6 -mt-8 mb-6 relative overflow-hidden rounded-b-[36px]"
      style={{
        background: `linear-gradient(180deg, hsl(${tone}) 0%, hsl(${tone} / 0.5) 55%, hsl(var(--background)) 100%)`,
      }}
    >
      <div className="h-36 relative">
        {topLeft && <div className="absolute top-4 left-4 z-10">{topLeft}</div>}
        <div className="absolute left-1/2 -translate-x-1/2 top-6 animate-float">
          <AbstractIcon name={icon} size={72} color={iconColor} accent={iconAccent} />
        </div>
        <svg
          className="absolute inset-x-0 bottom-0 w-full"
          viewBox="0 0 400 60"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0 60 Q200 0 400 60 Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </div>
  );
};
