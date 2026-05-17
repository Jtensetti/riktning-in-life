/**
 * Adaptiv check-in — vilka fält är så stabila att vi kan föreslå
 * "behåll som igår" istället för att fråga om allt varje dag?
 *
 * Regel: ett fält klassas som stabilt om alla loggade värden senaste 7
 * dagarna ligger inom ±1 (för 0–10-skalor) eller ±1.0 h (för sömn) av
 * varandra, och vi har minst 4 datapunkter.
 */

export type StableField =
  | "mood_heaviness"
  | "anxiety"
  | "guilt_selfcriticism"
  | "hopelessness"
  | "energy"
  | "getting_started"
  | "function_score"
  | "sleep_hours"
  | "sleep_quality";

type Row = Partial<Record<StableField, number | null>> & { date: string };

const TOLERANCE: Record<StableField, number> = {
  mood_heaviness: 1,
  anxiety: 1,
  guilt_selfcriticism: 1,
  hopelessness: 1,
  energy: 1,
  getting_started: 1,
  function_score: 1,
  sleep_hours: 1.0,
  sleep_quality: 1,
};

const FIELDS: StableField[] = [
  "mood_heaviness", "anxiety", "guilt_selfcriticism", "hopelessness",
  "energy", "getting_started", "function_score", "sleep_hours", "sleep_quality",
];

export type StableSuggestion = {
  field: StableField;
  /** Det värde vi föreslår — senaste loggade. */
  suggested: number;
  /** Antal dagar inom toleransen. */
  days: number;
};

export const detectStableFields = (rows: Row[]): StableSuggestion[] => {
  if (rows.length < 4) return [];
  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  const out: StableSuggestion[] = [];
  for (const field of FIELDS) {
    const values = sorted
      .map((r) => r[field])
      .filter((x): x is number => typeof x === "number");
    if (values.length < 4) continue;
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (max - min <= TOLERANCE[field]) {
      out.push({ field, suggested: values[0], days: values.length });
    }
  }
  return out;
};

export const labelFor = (f: StableField): string => {
  switch (f) {
    case "mood_heaviness": return "tyngd";
    case "anxiety": return "oro";
    case "guilt_selfcriticism": return "självkritik";
    case "hopelessness": return "hopplöshet";
    case "energy": return "energi";
    case "getting_started": return "komma igång";
    case "function_score": return "ork";
    case "sleep_hours": return "sömntimmar";
    case "sleep_quality": return "sömnkvalitet";
  }
};
