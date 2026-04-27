// Smart "För dig just nu"-rekommendation.
// Returnerar 3 övningar fördelade på olika syften (slots), så förslagen aldrig blir varianter av samma sak.
//
// Slots:
//   - "calm": lugna kroppen / bryta loop (alltid med vid hög oro eller kväll/natt)
//   - "lift": mjukt höjande (rörelse, dagsljus, kom-igång) — aldrig på kvällen
//   - "land": minsta möjliga (≤3 min) — så det aldrig känns övermäktigt

import type { TimeContext } from "./timeContext";
import { isOutdoorFriendly, type Weather } from "./weather";
import { improvementSign } from "./valence";

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
  /** Optional — when present, enables per-exercise repetition penalties. */
  exercise_id?: string;
};

/**
 * Personlig effekt-historik: hur en specifik övning eller kategori brukar
 * påverka dig. Värden i grova skalsteg.
 *
 * `metric` (valfri, default "mood") talar om vilken dimension `avgDelta`
 * mäter — så valens-modulen kan avgöra om en negativ siffra är en *bra*
 * sak (t.ex. `metric: "anxiety"` där avgDelta = -1.5 betyder "sänker oro").
 * Optional — fungerar som mjuk bias och bryter ingen befintlig logik.
 */
export type EffectStat = { avgDelta: number; count: number; metric?: string };
export type EffectHistory = {
  /** key = exercise.id eller exercise.title — vi försöker båda. */
  byExerciseId?: Record<string, EffectStat>;
  byExerciseTitle?: Record<string, EffectStat>;
  byCategory?: Record<string, EffectStat>;
};

/** Forecast-signal för riktad rekommendation (t.ex. tvinga calm vid morgon-oro). */
export type ForecastSignal = {
  kind: "anxiety" | "sleep" | "both" | null;
  partOfDay: "morning" | "midday" | "afternoon" | "evening" | "night";
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
  recent: RecentSession[],
  history?: EffectHistory,
  forecast?: ForecastSignal,
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
  if ((t.partOfDay === "evening" || t.partOfDay === "night") && ex.category === "Kom igång") score -= 40;
  if ((t.partOfDay === "morning" || t.partOfDay === "midday" || t.partOfDay === "afternoon") && ex.category === "Rör dig mjukt") score += 15;

  // 3) Väder
  const outdoorOk = isOutdoorFriendly(w);
  const isOutdoor = ex.title.toLowerCase().includes("dagsljus") || ex.title.toLowerCase().includes("promenad") || ex.category === "Rör dig mjukt";
  if (isOutdoor && !outdoorOk) score -= 30;
  if (isOutdoor && outdoorOk && w && (w.kind === "clear" || w.kind === "partly")) score += 15;

  // 4) LÄNGD — sweet-spot-modell istället för bara "kort vid låg energi".
  //    Bygger ett "energibudget"-tak: ju lägre energi/sömn/sen kväll, desto kortare passar bäst.
  const lateEvening = t.partOfDay === "evening" || t.partOfDay === "night";
  let budgetMin = 12; // standard sweet spot
  if (energy <= 3) budgetMin = 4;
  else if (energy <= 5) budgetMin = 7;
  else if (energy >= 8) budgetMin = 15;
  if (sleep < 5) budgetMin = Math.min(budgetMin, 6);          // sömnskuld → kortare
  if (lateEvening) budgetMin = Math.min(budgetMin, 8);         // sent → kortare
  if (anx >= 7) budgetMin = Math.min(budgetMin, 5);            // hög oro → kortast

  // Glockenkurva runt budget: max-bonus när duration ≈ budget, faller av i båda riktningar.
  const lengthDelta = Math.abs(ex.duration_minutes - budgetMin);
  if (lengthDelta <= 2) score += 14;
  else if (lengthDelta <= 5) score += 8;
  else if (lengthDelta <= 9) score += 0;
  else score -= Math.min(20, lengthDelta - 9);                 // grovt > 9 min från budget

  // Hård broms när det verkligen inte passar
  if (energy <= 2 && ex.duration_minutes >= 10) score -= 18;
  if (lateEvening && ex.duration_minutes >= 15) score -= 12;

  // 5) ÅTERFALLSRISK — eskalerande, både per kategori och (om data finns) per övning.
  //    Vi viktar nyligen tyngre än för flera dagar sen via en exponentiell decay.
  const decayWeight = (days: number) => Math.exp(-days / 2.5); // halveringstid ~1.7 dagar
  let catWeight = 0;
  let exWeight = 0;
  let exYesterday = false;
  for (const r of recent) {
    const d = daysSince(r.created_at);
    if (d > 7) continue;
    if (r.category === ex.category) catWeight += decayWeight(d);
    if (r.exercise_id && r.exercise_id === ex.id) {
      exWeight += decayWeight(d);
      if (d <= 1.2) exYesterday = true;
    }
  }
  // Eskalerande kategoristraff (max -28). Liten nyhetsbonus om kategorin INTE setts på en vecka.
  if (catWeight > 0) score -= Math.min(28, Math.round(catWeight * 14));
  else score += 6;

  // Per-övningsstraff är hårdare — vi vill aldrig serva exakt samma övning två dagar i rad.
  if (exWeight > 0) score -= Math.min(35, Math.round(exWeight * 22));
  if (exYesterday) score -= 18;

  // 6) Säkerhetsnät: om allt scoreas ner ska land-kategorin (mycket korta) ändå alltid få en chans.
  if (ex.duration_minutes <= 3 && score < 25) score = 25;

  // 7) PERSONLIG EFFEKT-BIAS — boosta övningar som lyfter dig, dra av de som
  //    drar ner. Tolkas via valens-modulen så ett stat på "anxiety" där
  //    avgDelta = -1.5 räknas som ett *bra* lyft (sänker oron).
  //    Kräver ≥3 observationer för att alls räknas (annars är signalen brus).
  if (history) {
    const stat =
      history.byExerciseId?.[ex.id] ??
      history.byExerciseTitle?.[ex.title] ??
      history.byCategory?.[ex.category];
    if (stat && stat.count >= 3) {
      const metric = stat.metric ?? "mood"; // default: positivt mood-delta = lyft
      const sign = improvementSign(metric, stat.avgDelta);
      const magnitude = Math.abs(stat.avgDelta);
      if (sign === 1 && magnitude >= 1) score += 15;
      else if (sign === 1 && magnitude >= 0.4) score += 7;
      else if (sign === -1 && magnitude >= 0.5) score -= 20;
    }
  }

  // 8) FORECAST-TRIGGER: vid morgon-oro tvinga fram korta andnings-/lugna-passar.
  if (forecast && forecast.kind === "anxiety" && forecast.partOfDay === "morning") {
    if ((ex.category === "Lugna kroppen" || ex.category === "Bryt ältande") && ex.duration_minutes <= 5) {
      score += 18;
    }
  }

  return Math.max(0, Math.min(100, score));
};

/** Returnerar 3 picks: alltid en calm, en lift, en land (i den ordningen). */
export const recommendForToday = (
  library: Exercise[],
  c: CheckinSignals | null,
  t: TimeContext,
  w: Weather | null,
  recent: RecentSession[],
  history?: EffectHistory,
  forecast?: ForecastSignal,
): Pick[] => {
  if (library.length === 0) return [];

  const evening = t.partOfDay === "evening" || t.partOfDay === "night";

  // HÅRD REGEL: Övningar som gjorts inom de senaste 2 dagarna är helt blockerade.
  // Efter 2 dagar släpps de fria igen (men får fortfarande mjuk repetitionsstraff i scoreExercise).
  const COOLDOWN_DAYS = 2;
  const blocked = new Set<string>();
  for (const r of recent) {
    if (!r.exercise_id) continue;
    if (daysSince(r.created_at) < COOLDOWN_DAYS) blocked.add(r.exercise_id);
  }

  const pickFor = (slot: Slot, used: Set<string>): Pick | null => {
    let candidates = library.filter(ex => slotForCategory(ex.category) === slot);

    if (slot === "land") {
      candidates = library.filter(ex => ex.duration_minutes <= LAND_MAX_MIN);
      if (evening) candidates = candidates.filter(ex => ex.category !== "Kom igång");
    }

    if (slot === "lift" && evening) {
      candidates = library.filter(ex => ex.category === "Sociala mikrosteg" || ex.category === "Skriv av dig");
    }

    // Filtrera bort blockerade och redan använda i denna runda
    let pool = candidates.filter(ex => !blocked.has(ex.id) && !used.has(ex.id));

    // Säkerhetsnät: om cooldown skulle tömma poolen helt — släpp blocket men inte "used"
    if (pool.length === 0) pool = candidates.filter(ex => !used.has(ex.id));
    if (pool.length === 0) return null;

    const scored = pool
      .map(ex => ({ ex, score: scoreExercise(ex, c, t, w, recent, history, forecast) }))
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
    const p = pickFor(slot, used);
    if (p) {
      picks.push(p);
      used.add(p.exercise.id);
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
