/**
 * Personal effect — vad funkar för DIG?
 *
 * Bygger en EffectHistory från användarens egna `exercise_sessions` och
 * `activity_logs` med före/efter-värden. Tre separata mått tracking-as så
 * valens-modulen kan färglägga rätt:
 *
 *   - "anxiety":  delta = before - after  (positiv = lättnad = lower-better)
 *                 Vi sparar dock raw (after - before) som avgDelta så
 *                 `improvementSign("anxiety", -1.5)` ger +1 (förbättring).
 *   - "mood":     delta = after - before  (positiv = lyft, higher-better)
 *   - "energy":   delta = after - before  (positiv = lyft, higher-better)
 *
 * Vi kräver ≥3 observationer för att alls räkna ett stat — annars brus.
 *
 * EffectHistory-typen i recommend.ts har bara EN avgDelta + metric per nyckel.
 * För scoring vill vi prioritera *orosänkning* när användaren har hög oro, så
 * vi exponerar tre EffectHistories (en per mått) och låter callern välja.
 */

import type { EffectHistory, EffectStat } from "./recommend";
import { improvementSign } from "./valence";

export type SessionLike = {
  exercise_id: string | null;
  created_at: string;
  mood_before: number | null;
  mood_after: number | null;
  anxiety_before: number | null;
  anxiety_after: number | null;
  energy_before: number | null;
  energy_after: number | null;
  exercises?: { title?: string | null; category?: string | null } | null;
};

export type ActivityLogLike = {
  activity_slug: string;
  label: string;
  category: string;
  mood_before: number | null;
  mood_after: number | null;
  energy_before: number | null;
  energy_after: number | null;
};

export type EffectMetric = "anxiety" | "mood" | "energy";

const MIN_OBS = 3;

const round1 = (n: number) => Math.round(n * 10) / 10;

type Bucket = { sum: number; count: number };

const bumpBucket = (
  map: Record<string, Bucket>,
  key: string | null | undefined,
  delta: number | null,
) => {
  if (!key || delta == null || Number.isNaN(delta)) return;
  const b = (map[key] ??= { sum: 0, count: 0 });
  b.sum += delta;
  b.count += 1;
};

const finalize = (
  map: Record<string, Bucket>,
  metric: EffectMetric,
): Record<string, EffectStat> => {
  const out: Record<string, EffectStat> = {};
  for (const [k, v] of Object.entries(map)) {
    if (v.count < MIN_OBS) continue;
    out[k] = { avgDelta: round1(v.sum / v.count), count: v.count, metric };
  }
  return out;
};

export type PersonalEffect = {
  /** Övningseffekter per id (exercise_sessions). */
  exerciseAnxiety: EffectHistory;
  exerciseMood: EffectHistory;
  exerciseEnergy: EffectHistory;
  /** Aktivitetseffekter per slug (activity_logs). */
  activityAnxiety: EffectHistory;
  activityMood: EffectHistory;
  activityEnergy: EffectHistory;
  /** Råräknare så vi kan visa "n sessioner totalt med data". */
  totals: { exerciseSessions: number; activityLogs: number };
};

export const buildPersonalEffect = (
  sessions: SessionLike[],
  activities: ActivityLogLike[] = [],
): PersonalEffect => {
  const exAnxId: Record<string, Bucket> = {};
  const exAnxTitle: Record<string, Bucket> = {};
  const exAnxCat: Record<string, Bucket> = {};
  const exMoodId: Record<string, Bucket> = {};
  const exMoodTitle: Record<string, Bucket> = {};
  const exMoodCat: Record<string, Bucket> = {};
  const exEnId: Record<string, Bucket> = {};
  const exEnTitle: Record<string, Bucket> = {};
  const exEnCat: Record<string, Bucket> = {};

  let exTotalWithData = 0;
  for (const s of sessions) {
    const anxDelta =
      s.anxiety_before != null && s.anxiety_after != null
        ? s.anxiety_after - s.anxiety_before
        : null;
    const moodDelta =
      s.mood_before != null && s.mood_after != null
        ? s.mood_after - s.mood_before
        : null;
    const enDelta =
      s.energy_before != null && s.energy_after != null
        ? s.energy_after - s.energy_before
        : null;
    if (anxDelta == null && moodDelta == null && enDelta == null) continue;
    exTotalWithData += 1;

    const id = s.exercise_id ?? undefined;
    const title = s.exercises?.title ?? undefined;
    const cat = s.exercises?.category ?? undefined;

    bumpBucket(exAnxId, id, anxDelta);
    bumpBucket(exAnxTitle, title, anxDelta);
    bumpBucket(exAnxCat, cat, anxDelta);
    bumpBucket(exMoodId, id, moodDelta);
    bumpBucket(exMoodTitle, title, moodDelta);
    bumpBucket(exMoodCat, cat, moodDelta);
    bumpBucket(exEnId, id, enDelta);
    bumpBucket(exEnTitle, title, enDelta);
    bumpBucket(exEnCat, cat, enDelta);
  }

  const acAnxSlug: Record<string, Bucket> = {};
  const acAnxCat: Record<string, Bucket> = {};
  const acMoodSlug: Record<string, Bucket> = {};
  const acMoodCat: Record<string, Bucket> = {};
  const acEnSlug: Record<string, Bucket> = {};
  const acEnCat: Record<string, Bucket> = {};

  let actTotalWithData = 0;
  for (const a of activities) {
    // activity_logs har inte anxiety_before/after i nuvarande schema,
    // men har mood och energy. Vi lämnar anxiety tom — sätt om schemat utökas.
    const moodDelta =
      a.mood_before != null && a.mood_after != null
        ? a.mood_after - a.mood_before
        : null;
    const enDelta =
      a.energy_before != null && a.energy_after != null
        ? a.energy_after - a.energy_before
        : null;
    if (moodDelta == null && enDelta == null) continue;
    actTotalWithData += 1;
    bumpBucket(acMoodSlug, a.activity_slug, moodDelta);
    bumpBucket(acMoodCat, a.category, moodDelta);
    bumpBucket(acEnSlug, a.activity_slug, enDelta);
    bumpBucket(acEnCat, a.category, enDelta);
  }

  return {
    exerciseAnxiety: {
      byExerciseId: finalize(exAnxId, "anxiety"),
      byExerciseTitle: finalize(exAnxTitle, "anxiety"),
      byCategory: finalize(exAnxCat, "anxiety"),
    },
    exerciseMood: {
      byExerciseId: finalize(exMoodId, "mood"),
      byExerciseTitle: finalize(exMoodTitle, "mood"),
      byCategory: finalize(exMoodCat, "mood"),
    },
    exerciseEnergy: {
      byExerciseId: finalize(exEnId, "energy"),
      byExerciseTitle: finalize(exEnTitle, "energy"),
      byCategory: finalize(exEnCat, "energy"),
    },
    activityAnxiety: {
      byCategory: finalize(acAnxCat, "anxiety"),
    },
    activityMood: {
      // använd byExerciseId-slotten för slug-uppslag för enkelhetens skull.
      byExerciseId: finalize(acMoodSlug, "mood"),
      byCategory: finalize(acMoodCat, "mood"),
    },
    activityEnergy: {
      byExerciseId: finalize(acEnSlug, "energy"),
      byCategory: finalize(acEnCat, "energy"),
    },
    totals: { exerciseSessions: exTotalWithData, activityLogs: actTotalWithData },
  };
};

/**
 * Väljer den EffectHistory som passar bäst givet vad användaren har just nu.
 * Prio: hög oro → anxiety, låg energi → energy, annars mood.
 */
export const pickEffectHistoryFor = (
  effect: PersonalEffect,
  signals: { anxiety: number | null; energy: number | null; mood_heaviness: number | null },
): EffectHistory => {
  const anx = signals.anxiety ?? 0;
  const energy = signals.energy ?? 5;
  if (anx >= 6) return effect.exerciseAnxiety;
  if (energy <= 3) return effect.exerciseEnergy;
  return effect.exerciseMood;
};

/**
 * Returnerar bästa stat för en specifik övning (id eller titel) tvärs alla
 * mått. Används för att rendera "Brukar sänka din oro 1.3 (8 ggr)".
 */
export const bestStatFor = (
  effect: PersonalEffect,
  exercise: { id: string; title: string; category: string },
): { stat: EffectStat; metric: EffectMetric } | null => {
  const candidates: { stat: EffectStat | undefined; metric: EffectMetric }[] = [
    {
      stat:
        effect.exerciseAnxiety.byExerciseId?.[exercise.id] ??
        effect.exerciseAnxiety.byExerciseTitle?.[exercise.title] ??
        effect.exerciseAnxiety.byCategory?.[exercise.category],
      metric: "anxiety",
    },
    {
      stat:
        effect.exerciseMood.byExerciseId?.[exercise.id] ??
        effect.exerciseMood.byExerciseTitle?.[exercise.title] ??
        effect.exerciseMood.byCategory?.[exercise.category],
      metric: "mood",
    },
    {
      stat:
        effect.exerciseEnergy.byExerciseId?.[exercise.id] ??
        effect.exerciseEnergy.byExerciseTitle?.[exercise.title] ??
        effect.exerciseEnergy.byCategory?.[exercise.category],
      metric: "energy",
    },
  ];

  let best: { stat: EffectStat; metric: EffectMetric } | null = null;
  let bestImpact = 0;
  for (const c of candidates) {
    if (!c.stat) continue;
    const sign = improvementSign(c.metric, c.stat.avgDelta);
    if (sign !== 1) continue; // visa bara positivt — vi vill inte slå ner användaren
    const impact = Math.abs(c.stat.avgDelta);
    if (impact > bestImpact) {
      best = { stat: c.stat, metric: c.metric };
      bestImpact = impact;
    }
  }
  return best;
};

/** Mänsklig 1-rad: "Brukar sänka din oro ~1.3 av 10 (8 ggr)". */
export const formatEffectChip = (
  hit: { stat: EffectStat; metric: EffectMetric },
): string => {
  const mag = Math.abs(hit.stat.avgDelta).toFixed(1);
  const n = hit.stat.count;
  const tail = `(${n} ${n === 1 ? "gång" : "ggr"})`;
  switch (hit.metric) {
    case "anxiety":
      return `Brukar sänka din oro ~${mag} av 10 ${tail}`;
    case "energy":
      return `Brukar höja din energi ~${mag} av 10 ${tail}`;
    case "mood":
    default:
      return `Brukar lyfta ditt mående ~${mag} av 10 ${tail}`;
  }
};

/**
 * Topp-N övningar (eller kategorier) som lyfter mest för användaren. Används
 * i "Veckans playbook"-panelen.
 */
export type LifterRow = { key: string; metric: EffectMetric; avgDelta: number; count: number };

export const topLifters = (effect: PersonalEffect, n = 3): LifterRow[] => {
  const rows: LifterRow[] = [];
  const collect = (m: Record<string, EffectStat> | undefined, metric: EffectMetric) => {
    if (!m) return;
    for (const [k, s] of Object.entries(m)) {
      if (improvementSign(metric, s.avgDelta) !== 1) continue;
      rows.push({ key: k, metric, avgDelta: s.avgDelta, count: s.count });
    }
  };
  collect(effect.exerciseAnxiety.byExerciseTitle, "anxiety");
  collect(effect.exerciseMood.byExerciseTitle, "mood");
  collect(effect.exerciseEnergy.byExerciseTitle, "energy");
  // dedupera per key — behåll starkaste impact
  const byKey = new Map<string, LifterRow>();
  for (const r of rows) {
    const cur = byKey.get(r.key);
    if (!cur || Math.abs(r.avgDelta) > Math.abs(cur.avgDelta)) byKey.set(r.key, r);
  }
  return [...byKey.values()]
    .sort((a, b) => Math.abs(b.avgDelta) - Math.abs(a.avgDelta))
    .slice(0, n);
};
