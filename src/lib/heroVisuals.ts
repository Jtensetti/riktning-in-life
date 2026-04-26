// Hero-visuell logik: bestämmer ton, ikon, mood och pattern för HeroBanner
// utifrån tid på dygnet, väder, säsong och dagens checkin.
//
// Hela poängen: två öppningar av appen ska aldrig se exakt likadana ut.

import type { TimeContext, Season, PartOfDay } from "./timeContext";
import type { Weather } from "./weather";
import type { IconName } from "@/components/AbstractIcon";

export type HeroMood = "calm" | "neutral" | "lively";

export type HeroVisuals = {
  /** CSS-värde att skicka in i HeroBanner.tone. */
  tone: string;
  icon: IconName;
  iconColor: string;
  iconAccent?: string;
  mood: HeroMood;
  /** Om de subtila bakgrundscirklarna ska visas. Av vid akut signal. */
  pattern: boolean;
};

type HeroInput = {
  time: TimeContext;
  weather: Weather | null;
  energy: number | null;
  /** "active_thoughts" / "acute" → vi tonar ner allt lekfullt. */
  safetyFlag?: boolean;
};

/** Grund-ton för tid på dygnet — alltid en distinkt nyans per period. */
const baseToneFor = (p: PartOfDay): string => {
  switch (p) {
    case "morning":   return "var(--orange-start)";
    case "midday":    return "var(--yellow-journal)";
    case "afternoon": return "var(--blue-calm)";
    case "evening":   return "var(--purple-sleep)";
    case "night":     return "var(--purple-sleep)";
  }
};

/** Säsongstint: en mjuk shift som färgar tonen utan att byta den. */
const seasonOverride = (base: string, season: Season, p: PartOfDay): string => {
  // Endast i de tider där säsongstinten faktiskt syns/känns rätt.
  if (p === "morning") {
    if (season === "winter") return "var(--blue-calm)"; // kall morgon
    if (season === "summer") return "var(--orange-start)"; // varm sol
  }
  if (p === "afternoon") {
    if (season === "autumn") return "var(--orange-deep)";
  }
  return base;
};

/** Välj ikon utifrån väder först, annars tid + säsong. */
const iconFor = (
  p: PartOfDay,
  weather: Weather | null,
  season: Season,
): IconName => {
  if (weather) {
    if (!weather.isDaylight) return "moon-stars";
    switch (weather.kind) {
      case "clear":   return "weather-sun";
      case "partly":  return "weather-partly";
      case "cloudy":  return "weather-cloud";
      case "rain":    return "weather-rain";
      case "snow":    return "weather-snow";
      case "fog":     return "weather-fog";
      case "thunder": return "weather-thunder";
      case "wind":    return "weather-wind";
    }
  }
  if (p === "evening" || p === "night") return "moon-stars";
  if (p === "morning") return season === "winter" ? "weather-snow" : "weather-sun";
  if (season === "autumn") return "nature-tree";
  return "blob-smile";
};

const iconColorFor = (
  p: PartOfDay,
  weather: Weather | null,
): string => {
  if (weather && !weather.isDaylight) return "hsl(var(--surface))";
  if (p === "evening" || p === "night") return "hsl(var(--surface))";
  if (p === "morning") return "hsl(var(--orange-deep))";
  if (p === "midday") return "hsl(var(--orange-deep))";
  if (p === "afternoon") return "hsl(var(--surface))";
  return "hsl(var(--surface))";
};

/** Mood styr animationstempot (float-amplituden). */
const moodFor = (energy: number | null, p: PartOfDay): HeroMood => {
  if (p === "evening" || p === "night") return "calm";
  if (energy == null) return "neutral";
  if (energy <= 3) return "calm";
  if (energy >= 7) return "lively";
  return "neutral";
};

export const heroVisualsFor = ({ time, weather, energy, safetyFlag }: HeroInput): HeroVisuals => {
  const base = baseToneFor(time.partOfDay);
  const tone = seasonOverride(base, time.season, time.partOfDay);
  const icon = iconFor(time.partOfDay, weather, time.season);
  const iconColor = iconColorFor(time.partOfDay, weather);
  const mood = safetyFlag ? "calm" : moodFor(energy, time.partOfDay);
  return {
    tone,
    icon,
    iconColor,
    mood,
    pattern: !safetyFlag,
  };
};

/** Float-duration i sekunder — långsammare = lugnare, snabbare = mer levande. */
export const floatDurationFor = (mood: HeroMood): number => {
  switch (mood) {
    case "calm":    return 6;
    case "neutral": return 4;
    case "lively":  return 3;
  }
};
