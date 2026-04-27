/**
 * Analys — sammanfattar veckotrendförändringar i klartext.
 *
 * Bygger på `valence.ts` (vad är "bra/dåligt") och `metrics.ts` (splitWeeks,
 * Checkin). Returnerar bara data + svenska meningar; ingen UI här så att
 * vi kan unit-testa allt.
 */

import { splitWeeks, type Checkin } from "./metrics";
import { directionOf, formatDelta, improvementSign, type FormattedDelta } from "./valence";

/** Mått vi presenterar i analysvyn — kanonisk ordning. */
export type AnalysisMetric =
  | "anxiety"
  | "mood_heaviness"
  | "sleep_hours"
  | "energy"
  | "function_score"
  | "movement";

export type MetricMeta = {
  metric: AnalysisMetric;
  /** Användarvänligt namn på svenska. */
  label: string;
  /** Kort beskrivning som hjälper när delta saknas. */
  hint: string;
  /** Färg-token (matchar `ChartTone` i chartColors). */
  tone: "orange" | "blue" | "yellow" | "purple" | "pink" | "green";
  /** Skala för sparkline-värden. */
  scale: "0-10" | "hours" | "share";
};

export const METRIC_META: Record<AnalysisMetric, MetricMeta> = {
  anxiety:        { metric: "anxiety",        label: "Oro",      hint: "Lägre värde = mindre orolig.",  tone: "blue",   scale: "0-10" },
  mood_heaviness: { metric: "mood_heaviness", label: "Tyngd",    hint: "Lägre värde = mindre tungt.",   tone: "purple", scale: "0-10" },
  sleep_hours:    { metric: "sleep_hours",    label: "Sömn",     hint: "Timmar per natt.",              tone: "purple", scale: "hours" },
  energy:         { metric: "energy",         label: "Energi",   hint: "Högre värde = mer energi.",     tone: "yellow", scale: "0-10" },
  function_score: { metric: "function_score", label: "Funktion", hint: "Hur mycket du fick gjort.",     tone: "green",  scale: "0-10" },
  movement:       { metric: "movement",       label: "Rörelse",  hint: "Andel dagar med rörelse.",      tone: "pink",   scale: "share" },
};

export const ANALYSIS_METRICS: AnalysisMetric[] = [
  "anxiety", "mood_heaviness", "sleep_hours", "energy", "function_score", "movement",
];

const mean = (xs: (number | null | undefined)[]): number | null => {
  const v = xs.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
};

/**
 * Andel rörelsedagar (yes = 1.0, little = 0.5) skalat till 0–10 så det
 * kan jämföras med övriga 0–10-mått i sparklines/delta-text.
 */
const movementScore = (cs: Checkin[]): number | null => {
  if (cs.length === 0) return null;
  let sum = 0;
  for (const c of cs) {
    if (c.movement_today === "yes") sum += 1;
    else if (c.movement_today === "little") sum += 0.5;
  }
  return (sum / cs.length) * 10;
};

const valueFor = (metric: AnalysisMetric, cs: Checkin[]): number | null => {
  switch (metric) {
    case "anxiety":        return mean(cs.map((c) => c.anxiety));
    case "mood_heaviness": return mean(cs.map((c) => c.mood_heaviness));
    case "energy":         return mean(cs.map((c) => c.energy));
    case "function_score": return mean(cs.map((c) => c.function_score));
    case "sleep_hours":    return mean(cs.map((c) => c.sleep_hours == null ? null : Number(c.sleep_hours)));
    case "movement":       return movementScore(cs);
  }
};

/** Daglig serie för en metric — för sparkline. Behåller null för luckor. */
const dailySeries = (metric: AnalysisMetric, cs: Checkin[], dates: string[]): (number | null)[] => {
  const byDate = new Map(cs.map((c) => [c.date, c]));
  return dates.map((iso) => {
    const c = byDate.get(iso);
    if (!c) return null;
    switch (metric) {
      case "anxiety":        return c.anxiety;
      case "mood_heaviness": return c.mood_heaviness;
      case "energy":         return c.energy;
      case "function_score": return c.function_score;
      case "sleep_hours":    return c.sleep_hours == null ? null : Number(c.sleep_hours);
      case "movement":       return c.movement_today === "yes" ? 10 : c.movement_today === "little" ? 5 : c.movement_today === "none" ? 0 : null;
    }
  });
};

const last7Iso = (): string[] => {
  const out: string[] = [];
  const d = new Date();
  for (let i = 6; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    out.push(x.toISOString().split("T")[0]);
  }
  return out;
};

/** Tröskel: ändringar mindre än detta räknas som "ganska stabilt". */
const STABILITY_THRESHOLD: Record<AnalysisMetric, number> = {
  anxiety: 0.5,
  mood_heaviness: 0.5,
  energy: 0.5,
  function_score: 0.5,
  sleep_hours: 0.3,
  movement: 0.5,
};

export type MetricTrend = {
  meta: MetricMeta;
  current: number | null;
  previous: number | null;
  /** Delta after - before, eller null när ena saknas. */
  delta: FormattedDelta | null;
  /** Daglig serie (7 punkter, null för dagar utan check-in). */
  series: (number | null)[];
  /** "stable" om ändringen är inom tröskeln, oavsett tecken. */
  movement: "better" | "worse" | "stable" | "unknown";
  /** En klartextmening — alltid säker att rendera. */
  verdict: string;
};

const verdictFor = (metric: AnalysisMetric, before: number | null, after: number | null): { text: string; movement: MetricTrend["movement"] } => {
  const meta = METRIC_META[metric];
  if (before == null || after == null) {
    return { text: "Vi har inte nog data för att jämföra ännu.", movement: "unknown" };
  }
  const diff = after - before;
  const threshold = STABILITY_THRESHOLD[metric];
  if (Math.abs(diff) < threshold) {
    return { text: `${meta.label.toLowerCase() === "oro" ? "Oron" : meta.label} är ganska stabil mot förra veckan.`, movement: "stable" };
  }
  const sign = improvementSign(metric === "movement" ? "energy" : metric, diff);
  // movement är higher-better men inte i METRIC_DIRECTION → fallback via "energy".
  const better = sign === 1;
  switch (metric) {
    case "anxiety":
      return better
        ? { text: "Lite mindre oro än förra veckan.", movement: "better" }
        : { text: "Oron har gått upp lite jämfört med förra veckan.", movement: "worse" };
    case "mood_heaviness":
      return better
        ? { text: "Det känns lite lättare än förra veckan.", movement: "better" }
        : { text: "Det har känts lite tyngre än förra veckan.", movement: "worse" };
    case "sleep_hours":
      return better
        ? { text: "Du sover lite mer i snitt.", movement: "better" }
        : { text: "Du sover lite mindre i snitt.", movement: "worse" };
    case "energy":
      return better
        ? { text: "Energin är lite högre än förra veckan.", movement: "better" }
        : { text: "Energin är lite lägre än förra veckan.", movement: "worse" };
    case "function_score":
      return better
        ? { text: "Du fick gjort lite mer än förra veckan.", movement: "better" }
        : { text: "Det blev lite mindre gjort än förra veckan.", movement: "worse" };
    case "movement":
      return better
        ? { text: "Du har rört på dig fler dagar.", movement: "better" }
        : { text: "Färre rörelsedagar den här veckan.", movement: "worse" };
  }
};

/** Bygger en trend per metric. `checkins` ska täcka minst senaste 14 dagarna. */
export const buildMetricTrends = (checkins: Checkin[]): MetricTrend[] => {
  const { current, previous } = splitWeeks(checkins);
  const dates = last7Iso();
  return ANALYSIS_METRICS.map((m) => {
    const meta = METRIC_META[m];
    const cur = valueFor(m, current);
    const prev = valueFor(m, previous);
    const series = dailySeries(m, checkins, dates);
    let delta: FormattedDelta | null = null;
    if (cur != null && prev != null) {
      // För `movement` finns ingen METRIC_DIRECTION-post; vi mappar till "energy"
      // som också är higher-better så färgkodningen blir rätt.
      const valenceMetric = directionOf(m) === "neutral" ? "energy" : m;
      delta = formatDelta(valenceMetric, prev, cur);
    }
    const v = verdictFor(m, prev, cur);
    return { meta, current: cur, previous: prev, delta, series, movement: v.movement, verdict: v.text };
  });
};

export type OverallVerdict = {
  /** Hjälte-mening för toppen av vyn. */
  headline: string;
  /** Kort komplement: "baserat på X loggade dagar." */
  detail: string;
  /** Hur många mått som rör sig åt rätt håll. */
  better: number;
  worse: number;
  stable: number;
  unknown: number;
};

export const overallVerdict = (trends: MetricTrend[], loggedDaysThisWeek: number): OverallVerdict => {
  const better = trends.filter((t) => t.movement === "better");
  const worse = trends.filter((t) => t.movement === "worse");
  const stable = trends.filter((t) => t.movement === "stable");
  const unknown = trends.filter((t) => t.movement === "unknown").length;

  const detail = `Baserat på ${loggedDaysThisWeek} loggade dagar den här veckan.`;

  if (loggedDaysThisWeek < 3) {
    return {
      headline: "Vi behöver lite mer data för att säga något säkert.",
      detail,
      better: better.length, worse: worse.length, stable: stable.length, unknown,
    };
  }
  if (better.length === 0 && worse.length === 0) {
    return { headline: "Veckan ser ganska stabil ut.", detail, better: 0, worse: 0, stable: stable.length, unknown };
  }
  if (better.length >= worse.length) {
    const tops = better.slice(0, 2).map((t) => t.meta.label.toLowerCase()).join(" och ");
    const total = trends.length - unknown;
    return {
      headline: tops
        ? `${better.length} av ${total} mått pekar åt rätt håll — främst ${tops}.`
        : `${better.length} av ${total} mått pekar åt rätt håll.`,
      detail, better: better.length, worse: worse.length, stable: stable.length, unknown,
    };
  }
  const tops = worse.slice(0, 2).map((t) => t.meta.label.toLowerCase()).join(" och ");
  return {
    headline: `Några saker drar lite — främst ${tops}. Det är okej.`,
    detail, better: better.length, worse: worse.length, stable: stable.length, unknown,
  };
};

/** Antal dagar med en check-in den senaste veckan (för datatäckning). */
export const loggedDaysLastWeek = (checkins: Checkin[]): number => {
  const { current } = splitWeeks(checkins);
  return new Set(current.map((c) => c.date)).size;
};
