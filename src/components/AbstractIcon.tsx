// Riktning abstract icon set — flat, geometric, friendly. Inline SVGs in the same
// style as the existing illustrations. Use `color` prop to override fill (defaults
// to currentColor so they inherit text color).
//
// All ikoner följer regellistan i `src/lib/iconStyle.ts`. När du lägger till en
// ny ikon: håll dig till ICON_VIEWBOX, stroke-skalan, currentColor som primär
// fyllnad och använd `accent`-prop för sekundär ton. Avvikelser fångas i dev
// av `validateIconStyle` och loggas som console.warn.

import { useEffect, type SVGProps } from "react";
import {
  ICON_DEFAULT_ACCENT,
  ICON_DEFAULT_COLOR,
  ICON_LINECAP,
  ICON_LINEJOIN,
  ICON_VIEWBOX,
  validateIconStyle,
} from "@/lib/iconStyle";

export type IconName =
  // Layout / nav
  | "house-soft"
  | "spark"
  | "pie"
  | "pencil-soft"
  | "blob-smile"
  | "moon-soft"
  | "play-soft"
  | "flag"
  | "eye-closed"
  | "bookmark-soft"
  | "compass-soft"
  // Body / health
  | "heart-care"
  | "heart-pulse" // alias of heart-care, kept for back-compat
  | "stethoscope"   // dedicated icon for vård/care
  | "shield-soft"   // dedicated icon for crisis plan / safety
  | "pill"
  | "pill-bottle"      // dedicated icon for medication bottle / Vård
  | "glass-water"
  | "droplet"          // hydration / single drop, complements glass-water
  | "apple-bite"
  | "meal-plate"       // food / meals
  | "lungs-breathe"
  | "breath-wave"      // breathing exercise (rhythm wave)
  | "bed-soft"
  // Activity
  | "bike"
  | "walk-figure"
  | "run-figure"    // dedicated icon for movement / exercise logging
  | "stretch-figure"
  | "yoga-pose"
  | "weights"
  | "nature-tree"
  // Daily / social
  | "chat-bubble"
  | "people-two"
  | "phone-soft"       // phone / contact (crisis plan, vård contacts)
  | "work-bag"
  | "coffee-cup"
  | "book-open"        // open book (Learn / read articles)
  // UI / control
  | "plus-soft"
  | "check-soft"
  | "clock-soft"
  | "clock-alarm"      // alarm clock (reminders)
  | "calendar-soft"
  | "calendar-check"   // calendar with a checkmark
  | "play-soft-circle" // play inside a circle (sequences, exercises)
  | "pause-soft"       // pause (active exercise)
  | "lock-soft"
  | "info-soft"
  | "warning-soft"
  | "mic-soft"
  | "mute-soft"
  | "search-soft"
  | "filter-soft"
  // Weather
  | "weather-sun"
  | "weather-partly"
  | "weather-cloud"
  | "weather-rain"
  | "weather-snow"
  | "weather-fog"
  | "weather-thunder"
  | "weather-wind"
  | "weather-moon";

interface Props extends Omit<SVGProps<SVGSVGElement>, "color"> {
  name: IconName;
  size?: number;
  color?: string;
  /** Secondary accent color (used for two-tone icons like blob-smile, pie). Defaults to a softer tint. */
  accent?: string;
}

export const AbstractIcon = ({
  name,
  size = 28,
  color = ICON_DEFAULT_COLOR,
  accent,
  ...rest
}: Props) => {
  const a = accent ?? ICON_DEFAULT_ACCENT;

  // Dev-only style guardrail — loggar varningar om en ikon avviker från regellistan.
  useEffect(() => {
    if (import.meta.env.DEV) {
      const warnings = validateIconStyle({ name, size, color });
      for (const w of warnings) console.warn(`[icon-style] ${w}`);
    }
  }, [name, size, color]);

  const common = {
    width: size,
    height: size,
    viewBox: ICON_VIEWBOX,
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
    // Mjuka linjeändar/hörn ärvs av barn-elementen. Enskilda path kan fortfarande overrida.
    strokeLinecap: ICON_LINECAP,
    strokeLinejoin: ICON_LINEJOIN,
    ...rest,
  };

  switch (name) {
    case "house-soft":
      return (
        <svg {...common}>
          <path
            d="M5 14.5 L16 5 L27 14.5 V25 a3 3 0 0 1 -3 3 H8 a3 3 0 0 1 -3 -3 Z"
            fill={color}
          />
          {/* Accent: dörr + litet fönster */}
          <rect x="13.5" y="18" width="5" height="10" rx="1.6" fill={a} />
          <rect x="19" y="14.5" width="3.5" height="3.5" rx="0.8" fill={a} opacity="0.7" />
        </svg>
      );

    case "spark":
      return (
        <svg {...common}>
          {/* Accent halo bakom stjärnan */}
          <circle cx="16" cy="16" r="12" fill={a} opacity="0.35" />
          <path
            d="M16 3 L18.5 12 L27 14 L18.5 16.5 L16 26 L13.5 16.5 L5 14 L13.5 12 Z"
            fill={color}
          />
        </svg>
      );

    case "pie":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="12" fill={a} opacity="0.45" />
          <path d="M16 4 a12 12 0 0 1 12 12 H16 Z" fill={color} />
        </svg>
      );

    case "pencil-soft":
      return (
        <svg {...common}>
          <path
            d="M21 4.5 l6.5 6.5 -15 15 H6 v-6.5 z"
            fill={color}
          />
          {/* Accent: metallring runt skaftet */}
          <path d="M18.5 7 l6.5 6.5 -2.2 2.2 -6.5 -6.5 z" fill={a} />
        </svg>
      );

    case "heart-pulse":
    case "heart-care":
      return (
        <svg {...common}>
          <path
            d="M16 27 C8 21 3 16 3 11 a6 6 0 0 1 11 -3 a6 6 0 0 1 11 3 c0 5 -5 10 -13 16 z"
            fill={color}
          />
          {/* Accent: pulslinje i surface, normaliserad stroke */}
          <path d="M8 14 h3 l2 -3 l3 6 l2 -3 h6" stroke="hsl(var(--surface))" strokeWidth="2.2" fill="none" />
        </svg>
      );

    case "blob-smile":
      return (
        <svg {...common}>
          <path
            d="M16 3 C24 3 29 9 29 16 C29 23 24 29 16 29 C8 29 3 23 3 16 C3 9 8 3 16 3 Z"
            fill={color}
          />
          {/* Ögon i accent */}
          <path d="M11 17 q3 4 6 0" stroke={a} strokeWidth="2.2" fill="none" opacity="0.95" />
          <path d="M18 17 q3 4 6 0" stroke={a} strokeWidth="2.2" fill="none" opacity="0.95" />
        </svg>
      );

    case "moon-soft":
      return (
        <svg {...common}>
          <path
            d="M22 4 a13 13 0 1 0 6 14 a10 10 0 0 1 -6 -14 z"
            fill={color}
          />
          {/* Stjärnor i accent (tidigare i color, bröt mönstret) */}
          <circle cx="6" cy="8" r="1.1" fill={a} />
          <circle cx="27" cy="26" r="1.4" fill={a} />
        </svg>
      );

    case "play-soft":
      return (
        <svg {...common}>
          {/* Mjuk halo bakom triangeln */}
          <circle cx="16" cy="16" r="13" fill={a} opacity="0.3" />
          <path d="M11 7 L25 16 L11 25 Z" fill={color} />
        </svg>
      );

    case "flag":
      return (
        <svg {...common}>
          {/* Flaggstång som fylld pelare */}
          <rect x="7" y="3" width="2.6" height="26" rx="1.3" fill={color} />
          {/* Duken i accent — separat form, inte stroke */}
          <path d="M9.6 5 q9 -1 14 3 q-7 4 -14 3 z" fill={a} />
        </svg>
      );

    case "eye-closed":
      return (
        <svg {...common}>
          {/* Fyllt ögonlock som huvudform */}
          <path
            d="M3 13 q13 14 26 0 q-2 4 -13 4 q-11 0 -13 -4 z"
            fill={color}
          />
          {/* Ögonfransar i accent */}
          <path d="M9 18.5 l-2 3" stroke={a} strokeWidth="2.2" />
          <path d="M16 19.5 v3" stroke={a} strokeWidth="2.2" />
          <path d="M23 18.5 l2 3" stroke={a} strokeWidth="2.2" />
        </svg>
      );

    case "bike":
      return (
        <svg {...common}>
          {/* Hjul som fyllda skivor */}
          <circle cx="8" cy="22" r="5" fill={color} />
          <circle cx="24" cy="22" r="5" fill={color} />
          {/* Naven i accent */}
          <circle cx="8" cy="22" r="1.6" fill={a} />
          <circle cx="24" cy="22" r="1.6" fill={a} />
          {/* Ram som fylld silhuett (tjock kontur via dubbla paths) */}
          <path
            d="M7 22 L14.5 11 L21.5 22 z"
            fill={color}
            opacity="0.85"
          />
          <path d="M14 11 h5 v2 h-5 z" fill={color} />
          <circle cx="20.5" cy="11" r="1.6" fill={a} />
        </svg>
      );

    case "bookmark-soft":
      return (
        <svg {...common}>
          <path d="M8 4 h16 a2 2 0 0 1 2 2 v22 l-10 -6 l-10 6 V6 a2 2 0 0 1 2 -2 z" fill={color} />
          {/* Accent: liten flik upptill */}
          <rect x="13" y="4" width="6" height="3" rx="1" fill={a} />
        </svg>
      );

    case "weather-sun":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="6.5" fill={color} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <rect
              key={deg}
              x="15"
              y="2.5"
              width="2"
              height="4.5"
              rx="1"
              fill={color}
              transform={`rotate(${deg} 16 16)`}
            />
          ))}
        </svg>
      );

    case "weather-partly":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="5" fill={color} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <rect key={deg} x="10.2" y="1.5" width="1.6" height="3" rx="0.8" fill={color} transform={`rotate(${deg} 11 11)`} />
          ))}
          <path d="M11 24 a6 6 0 0 1 0 -12 h6 a6 6 0 0 1 6 6 a5 5 0 0 1 -3 9 H12 a4 4 0 0 1 -1 -3 z" fill={a} />
        </svg>
      );

    case "weather-cloud":
      return (
        <svg {...common}>
          <path
            d="M9 22 a6 6 0 0 1 0 -12 a7 7 0 0 1 13 -1 a5 5 0 0 1 1 10 z"
            fill={color}
          />
        </svg>
      );

    case "weather-rain":
      return (
        <svg {...common}>
          <path
            d="M9 18 a6 6 0 0 1 0 -12 a7 7 0 0 1 13 -1 a5 5 0 0 1 1 10 z"
            fill={a}
          />
          <path d="M11 22 l-2 5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M16 22 l-2 5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M21 22 l-2 5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );

    case "weather-snow":
      return (
        <svg {...common}>
          <path
            d="M9 18 a6 6 0 0 1 0 -12 a7 7 0 0 1 13 -1 a5 5 0 0 1 1 10 z"
            fill={a}
          />
          <circle cx="10" cy="24" r="1.6" fill={color} />
          <circle cx="16" cy="26" r="1.6" fill={color} />
          <circle cx="22" cy="24" r="1.6" fill={color} />
        </svg>
      );

    case "weather-fog":
      return (
        <svg {...common}>
          <path
            d="M9 16 a6 6 0 0 1 0 -12 a7 7 0 0 1 13 -1 a5 5 0 0 1 1 10 z"
            fill={color}
          />
          <path d="M5 22 h22" stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
          <path d="M8 27 h16" stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity="0.5" />
        </svg>
      );

    case "weather-thunder":
      return (
        <svg {...common}>
          <path
            d="M9 18 a6 6 0 0 1 0 -12 a7 7 0 0 1 13 -1 a5 5 0 0 1 1 10 z"
            fill={color}
          />
          <path d="M16 19 L12 26 H16 L14 30 L20 22 H16 L18 19 Z" fill={a} />
        </svg>
      );

    case "weather-wind":
      return (
        <svg {...common}>
          <path d="M3 11 h16 a3 3 0 1 0 -3 -3" stroke={color} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M3 17 h22 a3 3 0 1 1 -3 3" stroke={color} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M3 23 h13 a2.5 2.5 0 1 1 -2.5 2.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </svg>
      );

    case "weather-moon":
      return (
        <svg {...common}>
          <path
            d="M22 4 a13 13 0 1 0 6 14 a10 10 0 0 1 -6 -14 z"
            fill={color}
          />
          <circle cx="6" cy="8" r="0.9" fill={color} opacity="0.5" />
          <circle cx="27" cy="26" r="1.1" fill={color} opacity="0.5" />
        </svg>
      );

    // ======================================================================
    // === NEW ICONS — health, activity, social, UI ========================
    // ======================================================================

    case "compass-soft":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="12" fill={color} />
          <path d="M21 11 L17 17 L11 21 L15 15 Z" fill={a} />
          <circle cx="16" cy="16" r="1.6" fill={color} />
        </svg>
      );

    case "pill":
      return (
        <svg {...common}>
          <path
            d="M9 5 a6 6 0 0 1 6 6 v10 a6 6 0 0 1 -12 0 V11 a6 6 0 0 1 6 -6 z"
            fill={color}
            transform="rotate(-45 16 16)"
          />
          <path
            d="M16 16 h12 v5 a6 6 0 0 1 -12 0 z"
            fill={a}
            transform="rotate(-45 16 16)"
          />
        </svg>
      );

    case "glass-water":
      return (
        <svg {...common}>
          <path d="M8 5 h16 l-2 22 a2 2 0 0 1 -2 2 h-8 a2 2 0 0 1 -2 -2 z" fill={color} />
          <path d="M9 13 h14 l-1.4 14 a2 2 0 0 1 -2 1.6 h-7.2 a2 2 0 0 1 -2 -1.6 z" fill={a} />
        </svg>
      );

    case "apple-bite":
      return (
        <svg {...common}>
          <path
            d="M22 11 c4 0 6 4 6 8 c0 6 -4 11 -8 11 c-2 0 -3 -1 -4 -1 c-1 0 -2 1 -4 1 c-4 0 -8 -5 -8 -11 c0 -4 2 -8 6 -8 c2 0 3 1 4 1 c1 0 2 -1 4 -1 c1.5 0 2.5 0.4 4 1 z"
            fill={color}
          />
          <path d="M16 9 c0 -3 2 -5 5 -5 c0 3 -2 5 -5 5 z" fill={a} />
        </svg>
      );

    case "lungs-breathe":
      return (
        <svg {...common}>
          <path d="M16 5 v18" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
          <path
            d="M14 9 c-2 1 -5 4 -6 9 c-1 5 1 9 4 9 c2 0 3 -2 3 -5 V11 c0 -1 -1 -2 -1 -2 z"
            fill={color}
          />
          <path
            d="M18 9 c2 1 5 4 6 9 c1 5 -1 9 -4 9 c-2 0 -3 -2 -3 -5 V11 c0 -1 1 -2 1 -2 z"
            fill={color}
          />
        </svg>
      );

    case "bed-soft":
      return (
        <svg {...common}>
          <path d="M3 22 v-7 a3 3 0 0 1 3 -3 h20 a3 3 0 0 1 3 3 v7" fill={color} />
          <rect x="3" y="22" width="26" height="4" rx="2" fill={color} />
          <path d="M9 12 a3 3 0 0 1 3 -3 h6 a3 3 0 0 1 3 3" fill={a} />
        </svg>
      );

    case "walk-figure":
      return (
        <svg {...common}>
          <circle cx="18" cy="6" r="3" fill={color} />
          <path
            d="M16 11 l-2 6 l-3 4 l1.5 1.5 l4 -5 l1 4 l3 5 l2 -1 l-3 -5 l1 -4 l3 2 l1 -2 l-5 -3 l-1 -3 z"
            fill={color}
          />
        </svg>
      );

    case "stretch-figure":
      return (
        <svg {...common}>
          <circle cx="16" cy="6" r="3" fill={color} />
          <path
            d="M9 12 l5 1 l3 0 l5 -1 l-1 3 l-4 1 l1 11 h-3 l-1 -8 l-1 8 h-3 l1 -11 l-4 -1 z"
            fill={color}
          />
        </svg>
      );

    case "yoga-pose":
      return (
        <svg {...common}>
          <circle cx="16" cy="6" r="3" fill={color} />
          <path
            d="M16 10 l-7 6 l3 1 l-2 7 h12 l-2 -7 l3 -1 z"
            fill={color}
          />
          <ellipse cx="16" cy="27" rx="10" ry="2" fill={a} />
        </svg>
      );

    case "weights":
      return (
        <svg {...common}>
          <rect x="3" y="13" width="3" height="6" rx="1" fill={color} />
          <rect x="26" y="13" width="3" height="6" rx="1" fill={color} />
          <rect x="6" y="11" width="3" height="10" rx="1" fill={color} />
          <rect x="23" y="11" width="3" height="10" rx="1" fill={color} />
          <rect x="9" y="14" width="14" height="4" rx="1" fill={a} />
        </svg>
      );

    case "nature-tree":
      return (
        <svg {...common}>
          <rect x="14" y="20" width="4" height="9" rx="1.5" fill={a} />
          <circle cx="16" cy="13" r="9" fill={color} />
          <circle cx="10" cy="11" r="5" fill={color} />
          <circle cx="22" cy="11" r="5" fill={color} />
        </svg>
      );

    case "chat-bubble":
      return (
        <svg {...common}>
          <path d="M5 7 a3 3 0 0 1 3 -3 h16 a3 3 0 0 1 3 3 v11 a3 3 0 0 1 -3 3 H13 l-6 6 v-6 a2 2 0 0 1 -2 -2 z" fill={color} />
          <circle cx="12" cy="13" r="1.4" fill={a} />
          <circle cx="16" cy="13" r="1.4" fill={a} />
          <circle cx="20" cy="13" r="1.4" fill={a} />
        </svg>
      );

    case "people-two":
      return (
        <svg {...common}>
          <circle cx="11" cy="9" r="4" fill={color} />
          <circle cx="22" cy="11" r="3.4" fill={color} />
          <path d="M3 24 a8 8 0 0 1 16 0 v3 H3 z" fill={color} />
          <path d="M19 24 a6 6 0 0 1 10 0 v3 H19 z" fill={a} />
        </svg>
      );

    case "work-bag":
      return (
        <svg {...common}>
          <path d="M11 6 a2 2 0 0 1 2 -2 h6 a2 2 0 0 1 2 2 v3 h-2 V7 h-6 v2 h-2 z" fill={color} />
          <rect x="4" y="9" width="24" height="17" rx="3" fill={color} />
          <rect x="14" y="14" width="4" height="3" rx="0.8" fill={a} />
        </svg>
      );

    case "coffee-cup":
      return (
        <svg {...common}>
          <path d="M6 11 h17 v9 a6 6 0 0 1 -6 6 h-5 a6 6 0 0 1 -6 -6 z" fill={color} />
          <path d="M23 13 h2 a3 3 0 0 1 0 6 h-2" fill="none" stroke={color} strokeWidth="2.4" />
          <path d="M11 4 c-1 2 1 3 0 5" stroke={a} strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M16 4 c-1 2 1 3 0 5" stroke={a} strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );

    case "plus-soft":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="13" fill={color} />
          <path d="M16 9 v14 M9 16 h14" stroke="hsl(var(--surface))" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case "check-soft":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="13" fill={color} />
          <path d="M10 16.5 l4 4 l8 -9" stroke="hsl(var(--surface))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    case "clock-soft":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="13" fill={color} />
          <path d="M16 9 v8 l5 3" stroke="hsl(var(--surface))" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </svg>
      );

    case "calendar-soft":
      return (
        <svg {...common}>
          <rect x="4" y="6" width="24" height="22" rx="3" fill={color} />
          <rect x="4" y="6" width="24" height="6" rx="3" fill={a} />
          <rect x="9" y="3" width="2.5" height="6" rx="1.2" fill={color} />
          <rect x="20.5" y="3" width="2.5" height="6" rx="1.2" fill={color} />
          <circle cx="11" cy="18" r="1.4" fill="hsl(var(--surface))" />
          <circle cx="16" cy="18" r="1.4" fill="hsl(var(--surface))" />
          <circle cx="21" cy="18" r="1.4" fill="hsl(var(--surface))" />
        </svg>
      );

    case "lock-soft":
      return (
        <svg {...common}>
          <path d="M10 14 v-3 a6 6 0 0 1 12 0 v3" stroke={color} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <rect x="6" y="14" width="20" height="14" rx="3" fill={color} />
          <circle cx="16" cy="20" r="2" fill="hsl(var(--surface))" />
        </svg>
      );

    case "info-soft":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="13" fill={color} />
          <circle cx="16" cy="10" r="1.8" fill="hsl(var(--surface))" />
          <rect x="14.4" y="13" width="3.2" height="11" rx="1.6" fill="hsl(var(--surface))" />
        </svg>
      );

    case "warning-soft":
      return (
        <svg {...common}>
          <path d="M16 4 L29 27 a2 2 0 0 1 -1.7 3 H4.7 A2 2 0 0 1 3 27 z" fill={color} />
          <rect x="14.4" y="11" width="3.2" height="9" rx="1.6" fill="hsl(var(--surface))" />
          <circle cx="16" cy="24" r="1.8" fill="hsl(var(--surface))" />
        </svg>
      );

    case "mic-soft":
      return (
        <svg {...common}>
          <rect x="11" y="3" width="10" height="16" rx="5" fill={color} />
          <path d="M7 15 a9 9 0 0 0 18 0" stroke={color} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <rect x="14.5" y="24" width="3" height="5" rx="1.4" fill={color} />
        </svg>
      );

    case "mute-soft":
      return (
        <svg {...common}>
          <path d="M5 12 h5 l7 -6 v20 l-7 -6 H5 z" fill={color} />
          <path d="M21 12 l6 8 M27 12 l-6 8" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      );

    case "search-soft":
      return (
        <svg {...common}>
          <circle cx="14" cy="14" r="9" fill={color} />
          <circle cx="14" cy="14" r="5" fill="hsl(var(--surface))" />
          <rect x="20" y="20" width="9" height="3.5" rx="1.6" fill={color} transform="rotate(45 20 20)" />
        </svg>
      );

    case "filter-soft":
      return (
        <svg {...common}>
          <path d="M4 6 h24 l-9 11 v9 l-6 -3 v-6 z" fill={color} />
        </svg>
      );

    case "stethoscope":
      // Stetoskop — tydlig vårdmarkör. Två öronbågar, slang, och rund "klocka".
      return (
        <svg {...common}>
          <path
            d="M7 4 v8 a6 6 0 0 0 12 0 V4"
            fill="none"
            stroke={color}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path d="M13 18 v3 a5 5 0 0 0 10 0 v-1" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="23" cy="22" r="4" fill={color} />
          <circle cx="23" cy="22" r="1.6" fill={a} />
          <circle cx="7" cy="4" r="1.6" fill={color} />
          <circle cx="19" cy="4" r="1.6" fill={color} />
        </svg>
      );

    case "shield-soft":
      // Sköld med mjuk insida — krisplan/safety. Inte alarmistisk, lugn och stadig.
      return (
        <svg {...common}>
          <path
            d="M16 3 L27 7 v9 c0 7 -5 11 -11 13 c-6 -2 -11 -6 -11 -13 V7 z"
            fill={color}
          />
          <path
            d="M11 16 l3.5 3.5 L22 12"
            stroke="hsl(var(--surface))"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      );

    case "run-figure":
      // Springande figur — tydligt rörelse-spårbart. Lutad torso + svingande armar/ben.
      return (
        <svg {...common}>
          <circle cx="20" cy="6" r="3" fill={color} />
          <path
            d="M18 11 l-4 5 l-5 1 l1 3 l5 -1 l3 -2 l-1 5 l-4 6 l3 1 l4 -6 l2 -5 l3 4 l4 -1 l-1 -3 l-3 1 l-3 -5 l-1 -3 z"
            fill={color}
          />
          <path d="M9 23 l-3 4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M14 28 l-2 2" stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
        </svg>
      );

    // ======================================================================
    // === ADDITIONAL ICONS — medication, hydration, food, breath, time, =====
    // === reminders, play/pause, info, comms ================================
    // ======================================================================

    case "pill-bottle":
      // Medicinflaska — etikett + lock. Kompletterar enskild "pill" för Vård.
      return (
        <svg {...common}>
          <rect x="9" y="3" width="14" height="4" rx="1.5" fill={color} />
          <rect x="7" y="7" width="18" height="22" rx="3" fill={color} />
          <rect x="10" y="13" width="12" height="9" rx="1.5" fill={a} />
          <rect x="14.4" y="15" width="3.2" height="5" rx="1.4" fill={color} />
          <rect x="12" y="16.4" width="8" height="2.2" rx="1.1" fill={color} />
        </svg>
      );

    case "droplet":
      // Vattendroppe — komplement till "glass-water". Form med liten glansprick.
      return (
        <svg {...common}>
          <path
            d="M16 3 c5 6 9 11 9 15 a9 9 0 0 1 -18 0 c0 -4 4 -9 9 -15 z"
            fill={color}
          />
          <ellipse cx="12.5" cy="20" rx="2" ry="3" fill={a} opacity="0.7" />
        </svg>
      );

    case "meal-plate":
      // Tallrik med mat — bestick på sidan, mjuka former.
      return (
        <svg {...common}>
          <circle cx="16" cy="17" r="11" fill={color} />
          <circle cx="16" cy="17" r="7" fill={a} opacity="0.55" />
          <path d="M3 6 v8 a2 2 0 0 0 2 2 V6" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M27 6 v8 a3 3 0 0 0 3 -3 V6" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.7" />
        </svg>
      );

    case "breath-wave":
      // Andningsvåg — sinusvåg + mjuk halo. Symboliserar takt och lugn andning.
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="13" fill={color} opacity="0.18" />
          <path
            d="M3 16 q3 -7 6 0 t6 0 t6 0 t6 0"
            stroke={color}
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="16" cy="16" r="2.2" fill={color} />
        </svg>
      );

    case "calendar-check":
      // Kalender med tydlig bock — för "schemalagd & gjord".
      return (
        <svg {...common}>
          <rect x="4" y="6" width="24" height="22" rx="3" fill={color} />
          <rect x="4" y="6" width="24" height="6" rx="3" fill={a} />
          <rect x="9" y="3" width="2.5" height="6" rx="1.2" fill={color} />
          <rect x="20.5" y="3" width="2.5" height="6" rx="1.2" fill={color} />
          <path d="M10 20 l4 4 l8 -8" stroke="hsl(var(--surface))" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    case "clock-alarm":
      // Väckarklocka — klocka med två "öron" och visare. För påminnelser.
      return (
        <svg {...common}>
          <path d="M5 6 L9 3 M27 6 L23 3" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="16" cy="18" r="11" fill={color} />
          <circle cx="16" cy="18" r="8" fill={a} opacity="0.45" />
          <path d="M16 12 v6 l4 2" stroke="hsl(var(--surface))" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <rect x="11" y="28" width="3" height="2.5" rx="1" fill={color} />
          <rect x="18" y="28" width="3" height="2.5" rx="1" fill={color} />
        </svg>
      );

    case "play-soft-circle":
      // Play i cirkel — för sekvenser och övningar. Symmetrisk triangel inuti.
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="13" fill={color} />
          <path d="M13 10.5 L23 16 L13 21.5 Z" fill="hsl(var(--surface))" />
        </svg>
      );

    case "pause-soft":
      // Paus i cirkel — för pågående övning.
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="13" fill={color} />
          <rect x="11" y="10" width="3.4" height="12" rx="1.4" fill="hsl(var(--surface))" />
          <rect x="17.6" y="10" width="3.4" height="12" rx="1.4" fill="hsl(var(--surface))" />
        </svg>
      );

    case "phone-soft":
      // Telefon — mjuk lur, för krisplan-kontakter.
      return (
        <svg {...common}>
          <path
            d="M7 4 h5 a2 2 0 0 1 2 1.5 l1.5 5 a2 2 0 0 1 -1 2.3 l-2 1.2 a14 14 0 0 0 6 6 l1.2 -2 a2 2 0 0 1 2.3 -1 l5 1.5 a2 2 0 0 1 1.5 2 v5 a2 2 0 0 1 -2 2 C13 27.5 4.5 19 4.5 6 a2 2 0 0 1 2.5 -2 z"
            fill={color}
          />
        </svg>
      );

    case "book-open":
      // Öppen bok — för Learn / artiklar. Två sidor som möts i mitten.
      return (
        <svg {...common}>
          <path d="M3 7 q6 -2 13 1 v19 q-7 -3 -13 -1 z" fill={color} />
          <path d="M29 7 q-6 -2 -13 1 v19 q7 -3 13 -1 z" fill={color} opacity="0.85" />
          <path d="M16 8 v19" stroke="hsl(var(--surface))" strokeWidth="1.4" opacity="0.6" />
          <path d="M6 11 q4 -1 8 1 M6 16 q4 -1 8 1 M6 21 q4 -1 8 1" stroke={a} strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M18 12 q4 -2 8 -1 M18 17 q4 -2 8 -1 M18 22 q4 -2 8 -1" stroke={a} strokeWidth="1.2" strokeLinecap="round" fill="none" />
        </svg>
      );

    default:
      return null;
  }
};

// Pick the right weather icon based on kind + daylight (sun → moon at night).
import type { WeatherKind } from "@/lib/weather";
export const weatherIcon = (kind: WeatherKind, isDaylight: boolean): IconName => {
  if (!isDaylight && (kind === "clear" || kind === "partly")) return "weather-moon";
  switch (kind) {
    case "clear": return "weather-sun";
    case "partly": return "weather-partly";
    case "cloudy": return "weather-cloud";
    case "rain": return "weather-rain";
    case "snow": return "weather-snow";
    case "fog": return "weather-fog";
    case "thunder": return "weather-thunder";
    case "wind": return "weather-wind";
  }
};

// Map a weather kind to one of our brand HSL color tokens (returns the hsl(...) string).
export const weatherIconColor = (kind: WeatherKind, isDaylight: boolean): string => {
  if (!isDaylight && (kind === "clear" || kind === "partly")) return "hsl(var(--purple-sleep))";
  switch (kind) {
    case "clear": return "hsl(var(--orange-start))";
    case "partly": return "hsl(var(--orange-start))";
    case "cloudy": return "hsl(var(--blue-calm))";
    case "rain": return "hsl(var(--blue-calm))";
    case "snow": return "hsl(var(--purple-sleep))";
    case "fog": return "hsl(var(--text-secondary))";
    case "thunder": return "hsl(var(--blue-calm))";
    case "wind": return "hsl(var(--blue-calm))";
  }
};

export const weatherIconAccent = (kind: WeatherKind): string => {
  switch (kind) {
    case "rain": return "hsl(var(--cream-card))";
    case "snow": return "hsl(var(--cream-card))";
    case "thunder": return "hsl(var(--yellow-journal))";
    case "partly": return "hsl(var(--cream-card))";
    default: return "hsl(var(--cream-card))";
  }
};
