// Riktning abstract icon set — Headspace-inspired sticker icons.
//
// Sources: SVGs in `riktning_headspace_icon_pack` (extracted into
// ./abstractIconData.ts at build-time of this file). Each icon is a flat,
// rounded-square sticker drawn in a 96×96 viewBox with a baked-in palette.
//
// Public API is preserved from the previous inline-currentColor version so all
// existing call sites (Today, Vard, Settings, ColorCard, HeroBanner, etc.)
// keep working without changes:
//
//   <AbstractIcon name="walk-figure" size={28} />
//
// The `color` and `accent` props are accepted for back-compat but no longer
// influence rendering — the new pack is intentionally a fixed multi-color
// illustration set. They still flow through `...rest` so things like
// `className`, `style`, `aria-*` and event handlers continue to work.
//
// At small sizes (< 22 px) we omit the colored background tile so the icon
// reads as a pure symbol next to text (used in BottomNav, Settings rows,
// inline list chips). At ≥ 22 px the full sticker (with tile) is drawn.

import { useEffect, type SVGProps } from "react";
import { validateIconStyle } from "@/lib/iconStyle";
import { ICON_BG, ICON_BODY } from "./abstractIconData";

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
  | "heart-pulse"
  | "stethoscope"
  | "shield-soft"
  | "pill"
  | "pill-bottle"
  | "glass-water"
  | "droplet"
  | "apple-bite"
  | "meal-plate"
  | "lungs-breathe"
  | "breath-wave"
  | "bed-soft"
  // Activity
  | "bike"
  | "walk-figure"
  | "run-figure"
  | "stretch-figure"
  | "yoga-pose"
  | "weights"
  | "nature-tree"
  // Daily / social
  | "chat-bubble"
  | "people-two"
  | "phone-soft"
  | "work-bag"
  | "coffee-cup"
  | "book-open"
  // UI / control
  | "plus-soft"
  | "check-soft"
  | "clock-soft"
  | "clock-alarm"
  | "calendar-soft"
  | "calendar-check"
  | "play-soft-circle"
  | "pause-soft"
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
  | "weather-moon"
  // Night / wind-down
  | "moon-stars"
  | "night-cloud";

interface Props extends Omit<SVGProps<SVGSVGElement>, "color"> {
  name: IconName;
  size?: number;
  /** Back-compat: ignored by the sticker pack but accepted so old call sites compile. */
  color?: string;
  /** Back-compat: ignored by the sticker pack. */
  accent?: string;
  /**
   * Force "symbol-only" rendering (no colored background tile), regardless of size.
   * Use when the icon already sits on a colored container (hero gradient, nav circle,
   * pill chip) so we don't double-stack backgrounds.
   */
  inline?: boolean;
}

/** Pixel size below which we drop the colored background tile by default. */
const INLINE_THRESHOLD = 22;

export const AbstractIcon = ({
  name,
  size = 28,
  color,
  accent,
  inline = false,
  ...rest
}: Props) => {
  // Dev-only style guardrail — keeps catching weird sizes during development.
  useEffect(() => {
    if (import.meta.env.DEV) {
      const warnings = validateIconStyle({ name, size, color: color ?? "currentColor" });
      for (const w of warnings) console.warn(`[icon-style] ${w}`);
    }
  }, [name, size, color]);

  // `accent` is intentionally not consumed; reference it to silence lint.
  void accent;

  const body = ICON_BODY[name];
  const bg = ICON_BG[name];
  const showBg = size >= INLINE_THRESHOLD;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...rest}
    >
      {showBg && (
        <rect x="8" y="8" width="80" height="80" rx="26" fill={bg} />
      )}
      <g dangerouslySetInnerHTML={{ __html: body }} />
    </svg>
  );
};

export default AbstractIcon;

// ---------------------------------------------------------------------------
// Weather helpers (kept for back-compat with Today, Checkin, Settings,
// WeatherChip). The new sticker pack bakes in colors so the returned `color`
// / `accent` values are no-ops on render, but consumers still read these
// helpers to e.g. tint surrounding text/badges.
// ---------------------------------------------------------------------------

import type { WeatherKind } from "@/lib/weather";

export const weatherIcon = (kind: WeatherKind, isDaylight: boolean = true): IconName => {
  if (!isDaylight) {
    if (kind === "clear" || kind === "partly") return "weather-moon";
    if (kind === "cloudy") return "night-cloud";
  }
  switch (kind) {
    case "clear":   return "weather-sun";
    case "partly":  return "weather-partly";
    case "cloudy":  return "weather-cloud";
    case "rain":    return "weather-rain";
    case "snow":    return "weather-snow";
    case "fog":     return "weather-fog";
    case "thunder": return "weather-thunder";
    case "wind":    return "weather-wind";
    default:        return "weather-partly";
  }
};

export const weatherIconColor = (kind: WeatherKind, isDaylight: boolean = true): string => {
  if (!isDaylight) return "hsl(var(--purple-night, var(--blue-calm)))";
  switch (kind) {
    case "clear":   return "hsl(var(--orange-start))";
    case "partly":  return "hsl(var(--orange-start))";
    case "cloudy":  return "hsl(var(--text-secondary))";
    case "rain":    return "hsl(var(--blue-calm))";
    case "snow":    return "hsl(var(--blue-calm))";
    case "fog":     return "hsl(var(--text-secondary))";
    case "thunder": return "hsl(var(--purple-night, var(--blue-calm)))";
    case "wind":    return "hsl(var(--text-secondary))";
    default:        return "hsl(var(--text-secondary))";
  }
};

export const weatherIconAccent = (kind: WeatherKind): string => {
  switch (kind) {
    case "clear":
    case "partly":  return "hsl(var(--yellow-journal))";
    case "rain":
    case "snow":    return "hsl(var(--blue-calm))";
    case "thunder": return "hsl(var(--yellow-journal))";
    default:        return "hsl(var(--yellow-journal))";
  }
};
