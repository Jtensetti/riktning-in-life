// Relevance engine — räknar ut hur "relevant" ett kort/förslag är just nu
// för användaren. Resultatet används av Today-feeden för att sortera om
// förslag utan att ändra design.
//
// Princip: en handfull additiva signaler. Ingen ML, bara genomskinlig logik.
//   + matchar dagens högsta smärtpunkt (t.ex. oro 8 → "lugna ner"-kort upp)
//   + matchar tid på dygnet (kort som passar morgnar väger mer på morgnar)
//   + tidigare lyftare för just denna användare (EffectHistory)
//   - dämpning om kortet visats nyligen (för att rotera in nytt)

import type { TimeContext } from "./timeContext";
import type { EffectHistory } from "./recommend";
import type { RecentCheckin } from "@/hooks/useRecentCheckins";

export type RelevanceItem = {
  id: string;
  /** Vilka signaler kortet adresserar — fritt textfält, mappas till score. */
  tags?: string[];
  /** Vilken tid det passar bäst. */
  timeOfDay?: "morning" | "day" | "evening" | "any";
  /** Sekunder sedan kortet visades senast (om känt). */
  lastShownSecondsAgo?: number;
};

export type RelevanceContext = {
  ctx: TimeContext;
  latestCheckin: RecentCheckin | null;
  history: EffectHistory;
};

/** Mappa numeriskt symptomvärde 0–10 till en tag som kort kan adressera. */
const dominantPainTag = (c: RecentCheckin | null): string | null => {
  if (!c) return null;
  const candidates: { tag: string; v: number | null }[] = [
    { tag: "anxiety", v: c.anxiety },
    { tag: "mood_heaviness", v: c.mood_heaviness },
    { tag: "low_energy", v: c.energy != null ? 10 - c.energy : null },
    { tag: "low_function", v: c.function_score != null ? 10 - c.function_score : null },
  ];
  const ranked = candidates
    .filter((x): x is { tag: string; v: number } => typeof x.v === "number" && x.v >= 6)
    .sort((a, b) => b.v - a.v);
  return ranked[0]?.tag ?? null;
};

const partToBucket = (p: TimeContext["partOfDay"]): "morning" | "day" | "evening" => {
  if (p === "morning") return "morning";
  if (p === "evening" || p === "night") return "evening";
  return "day";
};

/**
 * Returnerar en score 0–100. Ren funktion — inga sidoeffekter.
 * Konsumenten sorterar fallande på score.
 */
export const scoreRelevance = (item: RelevanceItem, rc: RelevanceContext): number => {
  let score = 30; // baseline
  const pain = dominantPainTag(rc.latestCheckin);
  if (pain && item.tags?.includes(pain)) score += 30;

  const bucket = partToBucket(rc.ctx.partOfDay);
  if (item.timeOfDay && (item.timeOfDay === "any" || item.timeOfDay === bucket)) {
    score += 15;
  }

  // Lyfter från historiken — om kortet refererar en övning som hjälpt förut.
  const lift = rc.history?.[item.id]?.improved;
  if (typeof lift === "number" && lift > 0) score += Math.min(20, lift * 5);

  // Dämpning om kortet visades nyss.
  if (typeof item.lastShownSecondsAgo === "number") {
    if (item.lastShownSecondsAgo < 60 * 60) score -= 15;
    else if (item.lastShownSecondsAgo < 60 * 60 * 6) score -= 5;
  }

  return Math.max(0, Math.min(100, score));
};

/** Sortera in-place efter relevans (returnerar ny array). */
export const sortByRelevance = <T extends RelevanceItem>(
  items: T[],
  rc: RelevanceContext,
): T[] => {
  return [...items]
    .map((it) => ({ it, s: scoreRelevance(it, rc) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.it);
};
