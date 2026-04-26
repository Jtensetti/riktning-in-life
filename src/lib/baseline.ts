// Personlig baslinje — median + IQR per fält, lagrad i localStorage.
// Aktiveras när vi har minst 14 dagars data. Innan dess används globala defaults
// från priorities.ts/recommend.ts. Syftet: "hög oro" ska betyda *högt för dig*.
//
// Vi sparar bara medianvärden och IQR (Q3 - Q1). Det räcker för att uttrycka
// "ovanligt högt/lågt för den här personen" utan att behöva kalla på datan
// varje render.

import type { Checkin } from "./metrics";

export type PersonalBaseline = {
  /** ISO-datum när baslinjen senast uppdaterades. */
  computed_at: string;
  /** Antal dagar som baslinjen byggdes på. */
  sample_days: number;
  /** Median + IQR per fält. null = inte tillräckligt med data för fältet. */
  fields: {
    mood_heaviness: { median: number; iqr: number } | null;
    anxiety: { median: number; iqr: number } | null;
    energy: { median: number; iqr: number } | null;
    sleep_hours: { median: number; iqr: number } | null;
    function_score: { median: number; iqr: number } | null;
    daytime_bed_sofa_time_minutes: { median: number; iqr: number } | null;
  };
};

const KEY = "riktning_personal_baseline";
export const BASELINE_MIN_DAYS = 14;

const quantile = (sorted: number[], q: number): number => {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
};

const summarize = (values: (number | null | undefined)[]): { median: number; iqr: number } | null => {
  const xs = values
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
    .slice()
    .sort((a, b) => a - b);
  if (xs.length < 7) return null; // kräv minst 7 observationer per fält
  const median = quantile(xs, 0.5);
  const q1 = quantile(xs, 0.25);
  const q3 = quantile(xs, 0.75);
  return { median, iqr: Math.max(0.5, q3 - q1) }; // golv 0.5 för att undvika div-by-near-zero
};

/** Räkna ut baslinje från senaste check-ins. Returnerar null om för få dagar. */
export const computeBaseline = (checkins: Checkin[]): PersonalBaseline | null => {
  const days = new Set(checkins.map((c) => c.date)).size;
  if (days < BASELINE_MIN_DAYS) return null;
  return {
    computed_at: new Date().toISOString(),
    sample_days: days,
    fields: {
      mood_heaviness: summarize(checkins.map((c) => c.mood_heaviness)),
      anxiety: summarize(checkins.map((c) => c.anxiety)),
      energy: summarize(checkins.map((c) => c.energy)),
      sleep_hours: summarize(checkins.map((c) => c.sleep_hours == null ? null : Number(c.sleep_hours))),
      function_score: summarize(checkins.map((c) => c.function_score)),
      daytime_bed_sofa_time_minutes: summarize(checkins.map((c) => c.daytime_bed_sofa_time_minutes)),
    },
  };
};

export const loadBaseline = (): PersonalBaseline | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersonalBaseline;
  } catch {
    return null;
  }
};

export const saveBaseline = (b: PersonalBaseline): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify(b));
  } catch {
    /* tysta — quota etc. */
  }
};

/** Sätt baslinjen från check-ins om vi har nog med data. Idempotent. */
export const refreshBaseline = (checkins: Checkin[]): PersonalBaseline | null => {
  const next = computeBaseline(checkins);
  if (next) saveBaseline(next);
  return next;
};

/**
 * Tröskelvärden: returnerar "vad är högt/lågt för den här användaren".
 * Faller tillbaka på rimliga globala defaults när baslinje saknas.
 *
 * "Högt" = median + 0.5 * IQR. "Lågt" = median − 0.5 * IQR.
 */
export type PersonalThresholds = {
  /** Personlig om sant — annars globala fallbacks. */
  personalized: boolean;
  /** Anxiety: nivå där det räknas som "hög oro". */
  highAnxiety: number;
  /** Mood heaviness: nivå där det räknas som "hög tyngd". */
  highMood: number;
  /** Sleep hours: nivå där det räknas som "kort natt". */
  shortSleep: number;
  /** Energy: nivå där det räknas som "låg energi". */
  lowEnergy: number;
  /** Säng/soffa minuter: nivå där det räknas som "mycket stilla tid". */
  highBedSofa: number;
};

export const GLOBAL_DEFAULTS: PersonalThresholds = {
  personalized: false,
  highAnxiety: 6,
  highMood: 6,
  shortSleep: 5,
  lowEnergy: 3,
  highBedSofa: 120,
};

export const thresholdsFromBaseline = (b: PersonalBaseline | null): PersonalThresholds => {
  if (!b) return GLOBAL_DEFAULTS;
  const f = b.fields;
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    personalized: true,
    highAnxiety: f.anxiety ? round1(Math.max(4, Math.min(9, f.anxiety.median + 0.5 * f.anxiety.iqr))) : GLOBAL_DEFAULTS.highAnxiety,
    highMood: f.mood_heaviness ? round1(Math.max(4, Math.min(9, f.mood_heaviness.median + 0.5 * f.mood_heaviness.iqr))) : GLOBAL_DEFAULTS.highMood,
    shortSleep: f.sleep_hours ? round1(Math.max(3, Math.min(7, f.sleep_hours.median - 0.5 * f.sleep_hours.iqr))) : GLOBAL_DEFAULTS.shortSleep,
    lowEnergy: f.energy ? round1(Math.max(2, Math.min(5, f.energy.median - 0.5 * f.energy.iqr))) : GLOBAL_DEFAULTS.lowEnergy,
    highBedSofa: f.daytime_bed_sofa_time_minutes
      ? Math.round(Math.max(60, Math.min(300, f.daytime_bed_sofa_time_minutes.median + 0.5 * f.daytime_bed_sofa_time_minutes.iqr)))
      : GLOBAL_DEFAULTS.highBedSofa,
  };
};
