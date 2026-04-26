// Tvådagars-prognos: deterministisk skattning av risk för sämre sömn / högre oro
// kommande 1–2 dagar, baserat på senaste 14 dagarnas check-ins och personlig
// baslinje. Inga AI-anrop, ingen ny tabell — körs i React vid render.
//
// Målet: när signalen är *tydlig* lyfter vi en enda konkret rekommendation
// ("Gör detta imorgon"). Annars visar vi inget — false positives skadar tillit.

import type { PersonalThresholds } from "./baseline";

export type ForecastInput = {
  date: string; // YYYY-MM-DD
  mood_heaviness: number | null;
  anxiety: number | null;
  energy: number | null;
  function_score: number | null;
  sleep_hours: number | null;
};

export type ForecastRiskKind = "sleep" | "anxiety" | "both";

export type Forecast = {
  /** Vilken risk som dominerar — null när inget når tröskel. */
  kind: ForecastRiskKind | null;
  /** 0–1, hur säkra vi är. Vi visar kort först vid >= 0.55. */
  confidence: number;
  /** Människovänlig orsaksrad ("3 av 4 senaste nätter under 6h"). */
  reason: string;
  /** Konkret förslag, max ~80 tecken. */
  suggestion: string;
  /** Sökterm eller kategori att slå upp i exercises. */
  exerciseHint: { category: string; preferType?: "andning" | "sömn" | "rörelse" };
};

const last = <T,>(xs: T[], n: number): T[] => xs.slice(Math.max(0, xs.length - n));

const numericSleep = (v: number | null): number | null =>
  v == null ? null : Number(v);

const countNonNull = <T,>(xs: (T | null)[]): number =>
  xs.filter((x): x is T => x != null).length;

/**
 * Bygg prognos. `rows` ska vara sorterad ASCENDING (äldst → nyast).
 *
 * Heuristiken (deterministisk, lätt att förklara):
 *  - Sömnrisk: ≥2 av senaste 3 nätterna under personlig "kort sömn"-tröskel,
 *    *eller* sjunkande trend (snitt-3 är minst 1h kortare än snitt-7).
 *  - Orosrisk: ≥2 av senaste 3 dagarna över personlig "hög oro"-tröskel,
 *    *eller* dagens oro klart över snitt-7.
 *  - Båda samtidigt → kind = "both", lyfts som "kombinerad belastning".
 *
 * Confidence ökar med antal träffar och hur långt över tröskeln vi ligger.
 */
export const buildForecast = (
  rows: ForecastInput[],
  t: PersonalThresholds,
): Forecast => {
  const empty: Forecast = {
    kind: null,
    confidence: 0,
    reason: "",
    suggestion: "",
    exerciseHint: { category: "" },
  };
  if (rows.length < 4) return empty;

  const last7 = last(rows, 7);
  const last3 = last(rows, 3);

  // ---- Sömn ----
  const sleeps3 = last3.map((r) => numericSleep(r.sleep_hours));
  const sleeps7 = last7.map((r) => numericSleep(r.sleep_hours));
  const shortNights = sleeps3.filter((s): s is number => s != null && s < t.shortSleep).length;
  const sleepObs3 = countNonNull(sleeps3);
  const sleepObs7 = countNonNull(sleeps7);
  const avg3Sleep = sleepObs3 > 0 ? sleeps3.filter((s): s is number => s != null).reduce((a, b) => a + b, 0) / sleepObs3 : null;
  const avg7Sleep = sleepObs7 > 0 ? sleeps7.filter((s): s is number => s != null).reduce((a, b) => a + b, 0) / sleepObs7 : null;
  const sleepDownTrend = avg3Sleep != null && avg7Sleep != null && avg7Sleep - avg3Sleep >= 1;
  const sleepRisk = (sleepObs3 >= 2 && shortNights >= 2) || sleepDownTrend;

  // ---- Oro ----
  const anx3 = last3.map((r) => r.anxiety);
  const anx7 = last7.map((r) => r.anxiety);
  const highAnxDays = anx3.filter((a): a is number => a != null && a >= t.highAnxiety).length;
  const anxObs3 = countNonNull(anx3);
  const anxObs7 = countNonNull(anx7);
  const avg3Anx = anxObs3 > 0 ? anx3.filter((a): a is number => a != null).reduce((a, b) => a + b, 0) / anxObs3 : null;
  const avg7Anx = anxObs7 > 0 ? anx7.filter((a): a is number => a != null).reduce((a, b) => a + b, 0) / anxObs7 : null;
  const anxUpTrend = avg3Anx != null && avg7Anx != null && avg3Anx - avg7Anx >= 1.5;
  const anxRisk = (anxObs3 >= 2 && highAnxDays >= 2) || anxUpTrend;

  if (!sleepRisk && !anxRisk) return empty;

  // ---- Confidence ----
  // Bas 0.45, +0.1 per "hit" (kort natt / hög oro), +0.1 om båda riskerna,
  // +0.1 om trenden klart visar samma sak som puls-mätningen.
  let confidence = 0.45;
  if (sleepRisk) {
    confidence += 0.05 * shortNights;
    if (sleepDownTrend) confidence += 0.1;
  }
  if (anxRisk) {
    confidence += 0.05 * highAnxDays;
    if (anxUpTrend) confidence += 0.1;
  }
  if (sleepRisk && anxRisk) confidence += 0.1;
  confidence = Math.min(0.95, Math.max(0, confidence));

  // ---- Välj kind, reason, suggestion ----
  let kind: ForecastRiskKind = sleepRisk && anxRisk ? "both" : sleepRisk ? "sleep" : "anxiety";
  let reason = "";
  let suggestion = "";
  let exerciseHint: Forecast["exerciseHint"] = { category: "" };

  if (kind === "sleep") {
    const detail = shortNights >= 2
      ? `${shortNights} av ${sleepObs3} senaste nätterna under ${t.shortSleep.toFixed(1)} h`
      : `Sömnen har kortats av (${avg3Sleep?.toFixed(1)} h vs ${avg7Sleep?.toFixed(1)} h)`;
    reason = detail;
    suggestion = "Lägg in en kvällsritual ikväll — 10 min nedvarvning före sänggåendet.";
    exerciseHint = { category: "Sov bättre", preferType: "sömn" };
  } else if (kind === "anxiety") {
    const detail = highAnxDays >= 2
      ? `Oron har varit hög ${highAnxDays} av ${anxObs3} senaste dagarna`
      : `Oron har stigit (${avg3Anx?.toFixed(1)} vs ${avg7Anx?.toFixed(1)} av 10)`;
    reason = detail;
    suggestion = "Boka in 5 min andning imorgon förmiddag — innan oron hinner bygga.";
    exerciseHint = { category: "Lugna kroppen", preferType: "andning" };
  } else {
    reason = `Kort sömn ${shortNights}/${sleepObs3} + hög oro ${highAnxDays}/${anxObs3} senaste dagarna`;
    suggestion = "Mjuk kvällsritual ikväll, kort andning imorgon morgon. En sak i taget.";
    exerciseHint = { category: "Sov bättre", preferType: "sömn" };
  }

  return { kind, confidence, reason, suggestion, exerciseHint };
};

/** Tröskel för när vi visar kortet i UI. Allt under göms tyst. */
export const FORECAST_VISIBLE_THRESHOLD = 0.55;
