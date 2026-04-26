// Central källa för "vilken ikon hör till vilken aktivitet/kategori".
// Innan: castade `(a.icon as IconName)` på 7+ ställen, vilket var sårbart.
// Nu: en funktion. Aktiviteter i activity_catalog kan fortfarande ange egna ikoner —
// vi returnerar dem om de matchar IconName, annars härleds från category/slug.

import type { IconName } from "@/components/AbstractIcon";

const KNOWN: Set<IconName> = new Set([
  "house-soft", "spark", "pie", "pencil-soft", "blob-smile", "moon-soft",
  "play-soft", "play-soft-circle", "pause-soft",
  "flag", "eye-closed", "bookmark-soft", "compass-soft", "book-open",
  "heart-care", "heart-pulse", "stethoscope", "shield-soft",
  "pill", "pill-bottle",
  "glass-water", "droplet",
  "apple-bite", "meal-plate",
  "lungs-breathe", "breath-wave",
  "bed-soft", "bike", "walk-figure", "run-figure",
  "stretch-figure", "yoga-pose", "weights", "nature-tree",
  "chat-bubble", "people-two", "phone-soft",
  "work-bag", "coffee-cup", "plus-soft", "check-soft",
  "clock-soft", "clock-alarm",
  "calendar-soft", "calendar-check",
  "lock-soft", "info-soft", "warning-soft", "mic-soft",
  "mute-soft", "search-soft", "filter-soft",
  "weather-sun", "weather-partly", "weather-cloud", "weather-rain",
  "weather-snow", "weather-fog", "weather-thunder", "weather-wind",
  "weather-moon",
]);

const isIconName = (s: string | null | undefined): s is IconName =>
  !!s && KNOWN.has(s as IconName);

const SLUG_MAP: Record<string, IconName> = {
  walk: "walk-figure",
  promenad: "walk-figure",
  outdoor: "weather-sun",
  stretch: "stretch-figure",
  yoga: "yoga-pose",
  household: "house-soft",
  housework: "house-soft",
  bike: "bike",
  cykla: "bike",
  workout: "run-figure",
  trana: "run-figure",
  jogg: "run-figure",
  simma: "run-figure",
  skogspromenad: "nature-tree",
  "langpromenad-skog": "nature-tree",
  tradgardsarbete: "nature-tree",
  "klippa-gras": "nature-tree",
  snoskottning: "nature-tree",
  vedhuggning: "weights",
  meditation: "breath-wave",
  andning: "breath-wave",
  andas: "breath-wave",
  kaffe: "coffee-cup",
  "kaffe-i-solen": "coffee-cup",
  vatten: "droplet",
  hydrering: "droplet",
  mat: "meal-plate",
  "ata-mat": "meal-plate",
  lunch: "meal-plate",
  middag: "meal-plate",
  vila: "bed-soft",
  somn: "bed-soft",
  arbete: "work-bag",
  jobb: "work-bag",
  social: "people-two",
  familj: "people-two",
  vanner: "people-two",
  prata: "chat-bubble",
};

const CATEGORY_MAP: Record<string, IconName> = {
  "Rörelse & kropp": "walk-figure",
  "Utomhus & natur": "nature-tree",
  "Villa & trädgård": "house-soft",
  "Familj & nära": "people-two",
  "Social kontakt": "chat-bubble",
  "Mästring & mening": "spark",
  "Lugn glädje": "blob-smile",
  "Egen aktivitet": "spark",
  "Sov bättre": "bed-soft",
  "Lugna kroppen": "breath-wave",
  "Bryt ältande": "blob-smile",
  "Rör dig mjukt": "walk-figure",
  "Kom igång": "spark",
  "Mat & humör": "meal-plate",
  "Sociala mikrosteg": "chat-bubble",
  "Skriv av dig": "pencil-soft",
  "Förbered vårdkontakt": "heart-care",
  "Rörelse": "run-figure",
};

/** Map an exercise category (de svenska kategorinamnen) → IconName. */
export const iconForExerciseCategory = (category: string): IconName => {
  switch (category) {
    case "Kom igång": return "play-soft";
    case "Lugna kroppen": return "lungs-breathe";
    case "Bryt ältande": return "chat-bubble";
    case "Sov bättre": return "moon-soft";
    case "Rör dig mjukt": return "walk-figure";
    case "Skriv av dig": return "pencil-soft";
    case "Förbered vårdkontakt": return "stethoscope";
    default: return "spark";
  }
};

/** Map any (slug, category, raw icon string) → safe IconName. */
export const iconForActivity = (
  raw?: string | null,
  category?: string | null,
  slug?: string | null,
): IconName => {
  if (isIconName(raw)) return raw;
  if (slug && SLUG_MAP[slug]) return SLUG_MAP[slug];
  if (category && CATEGORY_MAP[category]) return CATEGORY_MAP[category];
  return "spark";
};
