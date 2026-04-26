import { AbstractIcon, type IconName } from "./AbstractIcon";
import { floatDurationFor, type HeroMood } from "@/lib/heroVisuals";

/**
 * Standardiserad hero/header-gradient med flytande abstrakt ikon.
 * Använd överst på sidor inuti <AppShell> så får alla sektioner samma
 * padding, radius och timing.
 *
 * Mått (låsta):
 * - höjd: 144px (h-36)
 * - radius: 36px nedre hörn
 * - blob top-6, centrerad, 72px
 * - vågseparator: 60px
 * - animationstiming: float — styrs av `mood` (calm=6s, neutral=4s, lively=3s)
 */
export interface HeroBannerProps {
  /** HSL-värde, t.ex. "var(--orange-start)" eller "var(--blue-calm)" */
  tone: string;
  icon: IconName;
  iconColor?: string;
  iconAccent?: string;
  topLeft?: React.ReactNode;
  /** Innehåll positionerat absolut i övre högra hörnet (t.ex. väder-chip). */
  topRight?: React.ReactNode;
  /** Lekfulla bakgrundscirklar à la Headspace. Subtila, opacity 0.12. */
  pattern?: boolean;
  /** Animationstempo för flyt-ikonen — speglar dagens energi. */
  mood?: HeroMood;
}

export const HeroBanner = ({
  tone,
  icon,
  iconColor = "hsl(var(--surface))",
  iconAccent,
  topLeft,
  topRight,
  pattern = false,
  mood = "neutral",
}: HeroBannerProps) => {
  const floatSec = floatDurationFor(mood);
  return (
    <div
      className="-mx-6 -mt-8 mb-6 relative overflow-hidden rounded-b-[36px]"
      style={{
        background: `linear-gradient(180deg, hsl(${tone}) 0%, hsl(${tone} / 0.5) 55%, hsl(var(--background) / 0.92) 100%)`,
      }}
    >
      <div className="h-36 relative">
        {pattern && (
          <>
            <span aria-hidden className="absolute -top-6 -left-10 w-32 h-32 rounded-full bg-white/10" />
            <span aria-hidden className="absolute top-12 right-12 w-16 h-16 rounded-full bg-white/10" />
            <span aria-hidden className="absolute bottom-6 left-1/3 w-10 h-10 rounded-full bg-white/15" />
          </>
        )}
        {topLeft && <div className="absolute top-4 left-4 z-10">{topLeft}</div>}
        {topRight && <div className="absolute top-4 right-4 z-10">{topRight}</div>}
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
