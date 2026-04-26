// Smart "För dig just nu"-rekommendation.
// Returnerar 3 övningar fördelade på olika syften (slots), så förslagen aldrig blir varianter av samma sak.
//
// Slots:
//   - "calm": lugna kroppen / bryta loop (alltid med vid hög oro eller kväll/natt)
//   - "lift": mjukt höjande (rörelse, dagsljus, kom-igång) — aldrig på kvällen
//   - "land": minsta möjliga (≤3 min) — så det aldrig känns övermäktigt

import type { TimeContext } from "./timeContext";
import { isOutdoorFriendly, type Weather } from "./weather";

export type Exercise = {
  id: string;
  title: string;
  category: string;
  type: string;
  duration_minutes: number;
  description: string;
  color: string;
  mechanism?: string | null;
};

export type Slot = "calm" | "lift" | "land";

export type Pick = {
  slot: Slot;
  exercise: Exercise;
  reasonShort: string;
  reasonLong: string;
  fitScore: number;
};

export type CheckinSignals = {
  mood_heaviness: number | null;
  anxiety: number | null;
  energy: number | null;
  function_score: number | null;
  sleep_hours: number | null;
  safety_status: string | null;
};

export type RecentSession = {
  category: string;
  created_at: string;
};

const CALM_CATS = new Set(["Lugna kroppen", "Bryt ältande", "Sov bättre"]);
const LIFT_CATS = new Set(["Rör dig mjukt", "Kom igång", "Mat & humör", "Sociala mikrosteg"]);
const LAND_MAX_MIN = 3;

const slotForCategory = (category: string): Slot => {
  if (CALM_CATS.has(category)) return "calm";
  if (LIFT_CATS.has(category)) return "lift";
  return "land";
};

/** Hur många dagar sedan denna ISO timestamp? */
const daysSince = (iso: string): number => {
  const ms = Date.now() - new Date(iso).getTime();
  return ms / 86_400_000;
};

const slotReasonShort = (slot: Slot, ex: Exercise, c: CheckinSignals | null, t: TimeContext, w: Weather | null): string => {
  if (slot === "calm") {
    if ((c?.anxiety ?? 0) >= 6) return "Sänker pulsen";
    if (t.partOfDay === "evening" || t.partOfDay === "night") return "Mjuk landning";
    return "Lugnar nervsystemet";
  }
  if (slot === "lift") {
    if (ex.category === "Rör dig mjukt" && w && (w.kind === "clear" || w.kind === "partly")) return "Sol just nu";
    if (ex.category === "Mat & humör") return "Stabilare blodsocker";
    if (ex.category === "Sociala mikrosteg") return "Mikrokontakt räknas";
    if (t.partOfDay === "morning") return "Mjuk start";
    return "Lyfter humöret";
  }
  return "Räcker idag";
};

const slotReasonLong = (slot: Slot, ex: Exercise, c: CheckinSignals | null, t: TimeContext, w: Weather | null): string => {
  if (slot === "calm") {
    if ((c?.anxiety ?? 0) >= 6) return "Hög oro idag — vagusnerven svarar snabbast på andetag.";
    if ((c?.sleep_hours ?? 7) < 5) return "Kort sömn igår — låt kroppen växla ner ett snäpp.";
    if (t.partOfDay === "evening" || t.partOfDay === "night") return "Det är sent — landa kroppen mjukt.";
    return "Tre minuter är allt som behövs för en första effekt.";
  }
  if (slot === "lift") {
    if (ex.category === "Rör dig mjukt" && w && (w.kind === "clear" || w.kind === "partly")) {
      return "Solen är uppe — dagsljus tidigt synkar dygnsrytmen.";
    }
    if (ex.category === "Rör dig mjukt") return "Dagsljus räknas även när det är molnigt.";
    if (ex.category === "Mat & humör") return "Det enklaste humörhöjande knepet som finns.";
    if (ex.category === "Sociala mikrosteg") return "En liten kontakt höjer humöret märkbart.";
    if (t.partOfDay === "morning") return "Behöver inte vara mycket — bara att börja.";
    return "Handling kommer före motivation. Inte tvärtom.";
  }
  return "När det känns övermäktigt — börja här. Två minuter.";
};

const scoreExercise = (
  ex: Exercise,
  c: CheckinSignals | null,
  t: TimeContext,
  w: Weather | null,
  recent: RecentSession[]
): number => {
  let score = 30; // baseline

  // 1) Symptommatchning
  const anx = c?.anxiety ?? 0;
  const mood = c?.mood_heaviness ?? 0;
  const energy = c?.energy ?? 5;
  const sleep = c?.sleep_hours ?? 7;

  if (anx >= 6 && (ex.category === "Lugna kroppen" || ex.category === "Bryt ältande")) score += 30;
  if (mood >= 7 && (ex.category === "Skriv av dig" || ex.category === "Bryt ältande" || ex.category === "Sociala mikrosteg")) score += 25;
  if (sleep < 5 && ex.category === "Sov bättre") score += 30;
  if (energy <= 3 && ex.category === "Kom igång" && ex.duration_minutes <= 5) score += 25;
  if (energy <= 3 && ex.category === "Mat & humör") score += 15;

  // 2) Tid på dygnet
  if (t.partOfDay === "morning" && ex.category === "Kom igång") score += 20;
  if ((t.partOfDay === "evening" || t.partOfDay === "night") && ex.category === "Sov bättre") score += 25;
  if ((t.partOfDay === "evening" || t.partOfDay === "night") && ex.category === "Kom igång") score -= 40; // aldrig morgonrutin på kvällen
  if ((t.partOfDay === "morning" || t.partOfDay === "midday" || t.partOfDay === "afternoon") && ex.category === "Rör dig mjukt") score += 15;

  // 3) Väder
  const outdoorOk = isOutdoorFriendly(w);
  const isOutdoor = ex.title.toLowerCase().includes("dagsljus") || ex.title.toLowerCase().includes("promenad") || ex.category === "Rör dig mjukt";
  if (isOutdoor && !outdoorOk) score -= 30;
  if (isOutdoor && outdoorOk && w && (w.kind === "clear" || w.kind === "partly")) score += 15;

  // 4) Energi-utrymme: kort övning vid låg energi
  if (energy <= 3 && ex.duration_minutes <= 5) score += 10;
  if (energy <= 6 && ex.duration_minutes <= 10) score += 5;
  if (energy <= 3 && ex.duration_minutes > 10) score -= 15;

  // 5) Variation: dra ner kategorier som körts mycket senaste 3 dagarna
  const recentInCat = recent.filter(r => r.category === ex.category && daysSince(r.created_at) <= 3).length;
  if (recentInCat >= 2) score -= 25;
  if (recentInCat >= 4) score -= 15;

  return Math.max(0, Math.min(100, score));
};

/** Returnerar 3 picks: alltid en calm, en lift, en land (i den ordningen). */
export const recommendForToday = (
  library: Exercise[],
  c: CheckinSignals | null,
  t: TimeContext,
  w: Weather | null,
  recent: RecentSession[],
): Pick[] => {
  if (library.length === 0) return [];

  const evening = t.partOfDay === "evening" || t.partOfDay === "night";

  const pickFor = (slot: Slot): Pick | null => {
    let candidates = library.filter(ex => slotForCategory(ex.category) === slot);

    if (slot === "land") {
      // "Minsta möjliga" — kort
      candidates = library.filter(ex => ex.duration_minutes <= LAND_MAX_MIN);
      // Föredra inte rena Kom igång-övningar på kvällen
      if (evening) candidates = candidates.filter(ex => ex.category !== "Kom igång");
    }

    if (slot === "lift" && evening) {
      // Inga energihöjande kvällstid — välj sociala mikrosteg eller skriv av dig istället
      candidates = library.filter(ex => ex.category === "Sociala mikrosteg" || ex.category === "Skriv av dig");
    }

    if (candidates.length === 0) return null;

    const scored = candidates
      .map(ex => ({ ex, score: scoreExercise(ex, c, t, w, recent) }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    return {
      slot,
      exercise: best.ex,
      reasonShort: slotReasonShort(slot, best.ex, c, t, w),
      reasonLong: slotReasonLong(slot, best.ex, c, t, w),
      fitScore: best.score,
    };
  };

  const picks: Pick[] = [];
  const used = new Set<string>();
  for (const slot of ["calm", "lift", "land"] as Slot[]) {
    const p = pickFor(slot);
    if (p && !used.has(p.exercise.id)) {
      picks.push(p);
      used.add(p.exercise.id);
    } else if (p) {
      // Ta nästa bästa som inte använts
      const slotCands = library
        .filter(ex => !used.has(ex.id))
        .filter(ex => slot === "land" ? ex.duration_minutes <= LAND_MAX_MIN : slotForCategory(ex.category) === slot)
        .map(ex => ({ ex, score: scoreExercise(ex, c, t, w, recent) }))
        .sort((a, b) => b.score - a.score);
      if (slotCands.length > 0) {
        const fallback = slotCands[0];
        picks.push({
          slot,
          exercise: fallback.ex,
          reasonShort: slotReasonShort(slot, fallback.ex, c, t, w),
          reasonLong: slotReasonLong(slot, fallback.ex, c, t, w),
          fitScore: fallback.score,
        });
        used.add(fallback.ex.id);
      }
    }
  }

  return picks;
};

export const slotLabel = (slot: Slot): string => {
  switch (slot) {
    case "calm": return "Lugna";
    case "lift": return "Lyft";
    case "land": return "Landa";
  }
};
