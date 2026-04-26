// Riktning abstract icon set — flat, geometric, friendly. Inline SVGs in the same
// style as the existing illustrations. Use `color` prop to override fill (defaults
// to currentColor so they inherit text color).

import type { SVGProps } from "react";

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
  | "pill"
  | "glass-water"
  | "apple-bite"
  | "lungs-breathe"
  | "bed-soft"
  // Activity
  | "bike"
  | "walk-figure"
  | "stretch-figure"
  | "yoga-pose"
  | "weights"
  | "nature-tree"
  // Daily / social
  | "chat-bubble"
  | "people-two"
  | "work-bag"
  | "coffee-cup"
  // UI / control
  | "plus-soft"
  | "check-soft"
  | "clock-soft"
  | "calendar-soft"
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

export const AbstractIcon = ({ name, size = 28, color = "currentColor", accent, ...rest }: Props) => {
  const a = accent ?? "hsl(var(--yellow-journal))";
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
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
        </svg>
      );

    case "spark":
      return (
        <svg {...common}>
          <path
            d="M16 3 L18.5 12 L27 14 L18.5 16.5 L16 26 L13.5 16.5 L5 14 L13.5 12 Z"
            fill={color}
          />
          <circle cx="26" cy="6" r="1.6" fill={color} opacity="0.6" />
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
          <path d="M19.5 6 l6.5 6.5" stroke={a} strokeWidth="1.6" strokeLinecap="round" />
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
          <path d="M8 14 h3 l2 -3 l3 6 l2 -3 h6" stroke="hsl(var(--surface))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    case "blob-smile":
      return (
        <svg {...common}>
          <path
            d="M16 3 C24 3 29 9 29 16 C29 23 24 29 16 29 C8 29 3 23 3 16 C3 9 8 3 16 3 Z"
            fill={color}
          />
          <path d="M11 17 q3 4 6 0" stroke="hsl(var(--foreground))" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85" />
          <path d="M18 17 q3 4 6 0" stroke="hsl(var(--foreground))" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.85" />
        </svg>
      );

    case "moon-soft":
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

    case "play-soft":
      return (
        <svg {...common}>
          <path d="M9 6 L26 16 L9 26 Z" fill={color} />
        </svg>
      );

    case "flag":
      return (
        <svg {...common}>
          <path d="M8 4 v24" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M9 5 q9 -1 14 3 q-7 4 -14 3 z" fill={color} />
        </svg>
      );

    case "eye-closed":
      return (
        <svg {...common}>
          <path
            d="M3 14 q13 12 26 0"
            stroke={color}
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M9 21 l-2 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M16 22 v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M23 21 l2 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "bike":
      return (
        <svg {...common}>
          <circle cx="8" cy="22" r="5" fill="none" stroke={color} strokeWidth="2.2" />
          <circle cx="24" cy="22" r="5" fill="none" stroke={color} strokeWidth="2.2" />
          <path d="M8 22 L15 12 L21 22 M15 12 L19 12 M22 22 L19 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    case "bookmark-soft":
      return (
        <svg {...common}>
          <path d="M8 4 h16 a2 2 0 0 1 2 2 v22 l-10 -6 l-10 6 V6 a2 2 0 0 1 2 -2 z" fill={color} />
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
