// Bygger "prioriteringar" — vad användaren behöver fokusera på just nu, baserat på senaste 7 dagar.
// Returnerar 1–3 prioriteringar i fallande ordning av angelägenhet.
//
// Logiken: kontrollera mot tröskelvärden och vikta efter konsekvens.
// Aldrig skuldbeläggande copy — alltid "vi ser X, här är ett mjukt steg".

import type { Checkin } from "./metrics";
import { GLOBAL_DEFAULTS, type PersonalThresholds } from "./baseline";

export type PriorityKey = "sleep" | "movement" | "anxiety" | "mood" | "meaning" | "stillness" | "stable";

export type Priority = {
  key: PriorityKey;
  rank: number;            // 0=högst angeläget
  title: string;           // kort etikett
  insight: string;         // observation från datan
  nudge: string;           // konkret mjuk handling
  color: "orange" | "blue" | "yellow" | "purple" | "pink" | "green";
  /** Föreslagen exercise-kategori att matcha mot. */
  matchCategory?: string;
};

const avgNum = (xs: (number | null)[]): number | null => {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
};

const dayCount = (cs: Checkin[], pred: (c: Checkin) => boolean): number =>
  cs.filter(pred).length;

export const buildPriorities = (cs: Checkin[]): Priority[] => {
  if (cs.length === 0) {
    return [{
      key: "stable",
      rank: 0,
      title: "Bygg en baslinje",
      insight: "Vi har inga loggar än.",
      nudge: "Logga några dagar — då kan vi visa riktning.",
      color: "orange",
    }];
  }

  const out: Omit<Priority, "rank">[] = [];

  // 1. SÖMN — högsta prioritet om <6h snitt eller 3+ nätter <5h
  const sleepVals = cs.map(c => c.sleep_hours == null ? null : Number(c.sleep_hours));
  const sleepAvg = avgNum(sleepVals);
  const shortNights = dayCount(cs, c => c.sleep_hours != null && Number(c.sleep_hours) < 5);
  if (sleepAvg != null && (sleepAvg < 6 || shortNights >= 3)) {
    out.push({
      key: "sleep",
      title: "Sömnen behöver mer plats",
      insight: shortNights >= 3
        ? `${shortNights} nätter under 5h denna vecka.`
        : `Snitt: ${sleepAvg.toFixed(1)}h per natt.`,
      nudge: "En kvällsrutin gör mest skillnad just nu.",
      color: "purple",
      matchCategory: "Sov bättre",
    });
  }

  // 2. ORO — högsta prioritet om snitt >=6 eller 3+ dagar >=7
  const anxAvg = avgNum(cs.map(c => c.anxiety));
  const highAnxDays = dayCount(cs, c => (c.anxiety ?? 0) >= 7);
  if (anxAvg != null && (anxAvg >= 6 || highAnxDays >= 3)) {
    out.push({
      key: "anxiety",
      title: "Oron är hög denna vecka",
      insight: highAnxDays >= 3
        ? `${highAnxDays} dagar med hög oro.`
        : `Snittoro: ${anxAvg.toFixed(1)}/10.`,
      nudge: "Korta andningspauser vänder kurvan snabbast.",
      color: "blue",
      matchCategory: "Lugna kroppen",
    });
  }

  // 3. RÖRELSE — bara 0–1 dagar med rörelse senaste veckan
  const movedDays = dayCount(cs, c => c.movement_today === "yes" || c.movement_today === "little");
  if (cs.length >= 4 && movedDays <= 1) {
    out.push({
      key: "movement",
      title: "Mer rörelse skulle hjälpa",
      insight: `Bara ${movedDays} dag${movedDays === 1 ? "" : "ar"} med rörelse av ${cs.length}.`,
      nudge: "5 min utomhus räknas — börja smått.",
      color: "pink",
      matchCategory: "Rör dig mjukt",
    });
  }

  // 4. NEDSTÄMDHET — snitt tyngd >=6
  const moodAvg = avgNum(cs.map(c => c.mood_heaviness));
  if (moodAvg != null && moodAvg >= 6) {
    out.push({
      key: "mood",
      title: "Tyngd ligger högt",
      insight: `Snittnedstämdhet: ${moodAvg.toFixed(1)}/10.`,
      nudge: "Bryt ältandet med en mikrohandling.",
      color: "orange",
      matchCategory: "Bryt ältande",
    });
  }

  // 5. MENING — meaningful_activity sällan
  const meaningfulDays = dayCount(cs, c => c.meaningful_activity === "yes" || c.meaningful_activity === "little");
  if (cs.length >= 4 && meaningfulDays <= 1) {
    out.push({
      key: "meaning",
      title: "Något du tycker om",
      insight: `Få meningsfulla aktiviteter denna vecka.`,
      nudge: "Något litet du gillar gör skillnad.",
      color: "yellow",
      matchCategory: "Sociala mikrosteg",
    });
  }

  // 6. STILLA TID — bed/sofa >120 min snitt
  const bedAvg = avgNum(cs.map(c => c.daytime_bed_sofa_time_minutes));
  if (bedAvg != null && bedAvg > 120) {
    out.push({
      key: "stillness",
      title: "Mycket stilla tid dagtid",
      insight: `Snitt ${Math.round(bedAvg)} min i säng/soffa.`,
      nudge: "En kort förflyttning bryter mönstret.",
      color: "green",
      matchCategory: "Kom igång",
    });
  }

  // Inget att flagga — beröm
  if (out.length === 0) {
    return [{
      key: "stable",
      rank: 0,
      title: "Veckan är stabil",
      insight: "Inga röda flaggor i datan.",
      nudge: "Fortsätt loggandet — det är så vi ser mönster.",
      color: "green",
    }];
  }

  // Sortera efter inneboende angelägenhet
  const order: Record<PriorityKey, number> = {
    sleep: 0, anxiety: 1, mood: 2, movement: 3, meaning: 4, stillness: 5, stable: 6,
  };
  out.sort((a, b) => order[a.key] - order[b.key]);
  return out.slice(0, 3).map((p, i) => ({ ...p, rank: i }));
};
