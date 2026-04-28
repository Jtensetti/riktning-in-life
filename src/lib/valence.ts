/**
 * Valens — central sanning för "vad är bra/dåligt" per mått.
 *
 * Används överallt där vi visar ett delta (övning, aktivitet, vecka,
 * journal, dynamiska tips) så att färgen alltid betyder samma sak:
 *   grön = förbättring, mjuk röd = försämring, neutral = oförändrad.
 *
 * Detta är *inte* värderande mot användaren — vi flaggar bara åt vilket
 * håll datan rör sig så att appen kan ge konsekvent feedback och
 * dynamiska råd ("Promenad sänkte din oro 2 steg i snitt").
 */

export type Direction = "lower-better" | "higher-better" | "neutral";

/**
 * Kanonisk karta över mått → riktning. Lägg till nya mått här när
 * de introduceras i schemat. Allt som loggas och visas som delta ska
 * finnas med — annars defaultar `directionOf` till "neutral".
 */
export const METRIC_DIRECTION: Record<string, Direction> = {
  // --- Bra att de minskar ---
  anxiety: "lower-better",
  mood_heaviness: "lower-better",
  hopelessness: "lower-better",
  guilt_selfcriticism: "lower-better",
  daytime_bed_sofa_time_minutes: "lower-better",
  side_effect_severity: "lower-better",
  medications_missed: "lower-better",
  burden: "lower-better",

  // --- Bra att de ökar ---
  // Obs: i ExerciseDetail heter fältet "mood" och betyder positivt mående
  // (motsatt av "mood_heaviness" som mäter tyngd). Ha båda.
  mood: "higher-better",
  energy: "higher-better",
  sleep_hours: "higher-better",
  sleep_quality: "higher-better",
  function_score: "higher-better",
  function: "higher-better",
  recovery: "higher-better",
  stability: "higher-better",
  getting_started: "higher-better",
  medications_taken: "higher-better",
  exercises_actual_minutes: "higher-better",
  exercises_count: "higher-better",
  activities_count: "higher-better",
  who5: "higher-better",

  // --- Skattningar där högt råvärde = sämre mående ---
  phq9: "lower-better",
  gad7: "lower-better",
  madrs: "lower-better",
  keds: "lower-better",
  bbq12: "higher-better",
};

export const directionOf = (metric: string): Direction =>
  METRIC_DIRECTION[metric] ?? "neutral";

/**
 * Returnerar +1 om delta är en förbättring, -1 om försämring, 0 om
 * oförändrat eller neutralt mått. `delta` förväntas vara `after - before`.
 */
export const improvementSign = (metric: string, delta: number): -1 | 0 | 1 => {
  if (delta === 0) return 0;
  const dir = directionOf(metric);
  if (dir === "lower-better") return delta < 0 ? 1 : -1;
  if (dir === "higher-better") return delta > 0 ? 1 : -1;
  return 0;
};

export const isImprovement = (
  metric: string,
  before: number,
  after: number,
): "better" | "worse" | "same" => {
  const s = improvementSign(metric, after - before);
  return s === 1 ? "better" : s === -1 ? "worse" : "same";
};

export type DeltaTone = "good" | "bad" | "neutral";

export type FormattedDelta = {
  /** Tecken-prefixad text, t.ex. "−2", "+1", "0". */
  text: string;
  /** Delta-värdet (after - before). */
  delta: number;
  /** Färg-bucket att rendera. */
  tone: DeltaTone;
  /** Ikon-hint: "down" = pil ner, "up" = pil upp, "flat" = streck. */
  arrow: "up" | "down" | "flat";
  /** Kort etikett för skärmläsare: "förbättring", "försämring", "oförändrat". */
  ariaLabel: string;
};

/**
 * Formaterar ett delta för rendering. Tar hänsyn till valens, så ett
 * minus på "anxiety" blir grönt och ett plus på "energy" blir grönt.
 */
export const formatDelta = (
  metric: string,
  before: number,
  after: number,
): FormattedDelta => {
  const delta = after - before;
  const sign = improvementSign(metric, delta);
  const tone: DeltaTone = sign === 1 ? "good" : sign === -1 ? "bad" : "neutral";
  const arrow: "up" | "down" | "flat" =
    delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const rounded = Math.round(delta * 10) / 10;
  const text =
    rounded === 0
      ? "0"
      : rounded > 0
        ? `+${rounded}`
        : `${rounded}`.replace("-", "−"); // unicode minus
  const ariaLabel =
    sign === 1 ? "förbättring" : sign === -1 ? "försämring" : "oförändrat";
  return { text, delta: rounded, tone, arrow, ariaLabel };
};

/**
 * Tailwind-klasser för en deltachippe. Lugna toner — vi vill informera,
 * inte skälla. Använd på pillar i ExerciseDetail, PatternsSection,
 * WeeklyReport.
 */
export const deltaChipClass = (tone: DeltaTone): string => {
  switch (tone) {
    case "good":
      return "bg-green-recovery/15 text-green-recovery";
    case "bad":
      // Mjuk röd — vi använder red-bg + dämpad text för att inte signalera kris.
      return "bg-red-bg text-red-risk/90";
    default:
      return "bg-surface-alt text-text-secondary";
  }
};

/**
 * Aggregerar förbättring över flera sessions/loggar för ett enskilt mått.
 * Returnerar genomsnittligt delta + andel sessioner som var en förbättring.
 *
 * Används i `metrics.ts` / `recommend.ts` för att svara på frågor som
 * "Vilka övningar sänker din oro mest?" eller "När hjälper promenad?".
 */
export type EffectSummary = {
  metric: string;
  n: number;
  meanDelta: number;
  improvedShare: number; // 0..1
};

export const summarizeEffect = (
  metric: string,
  pairs: { before: number | null | undefined; after: number | null | undefined }[],
): EffectSummary | null => {
  const valid = pairs
    .filter((p): p is { before: number; after: number } =>
      typeof p.before === "number" && typeof p.after === "number",
    )
    .map((p) => ({ delta: p.after - p.before, sign: improvementSign(metric, p.after - p.before) }));
  if (valid.length === 0) return null;
  const meanDelta =
    valid.reduce((s, v) => s + v.delta, 0) / valid.length;
  const improvedShare =
    valid.filter((v) => v.sign === 1).length / valid.length;
  return {
    metric,
    n: valid.length,
    meanDelta: Math.round(meanDelta * 10) / 10,
    improvedShare: Math.round(improvedShare * 100) / 100,
  };
};
