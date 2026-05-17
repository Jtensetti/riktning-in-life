// Mönsterdetektor — hittar deterministiska, förklarbara mönster i användarens
// senaste 28 dagar av check-ins, activity_logs, exercise_sessions och
// medication_logs.
//
// Inga AI-anrop. Allt är ren funktion → snabbt, testbart och kan förklaras
// rad för rad i UI:t. Vi visar aldrig ett mönster utan tillräcklig evidens.
//
// Tröskel: minst 5 observationer i jämförelsegruppen OCH effektstorlek ≥ 1
// skalsteg (av 10) eller ≥ 1 timme (sömn). Lägre än så är det brus.

import type { Checkin } from "./metrics";
import type { PersonalThresholds } from "./baseline";
import { improvementSign } from "./valence";

export type PatternKind =
  | "sleep_next_day_anxiety"
  | "weekday_dip"
  | "stillness_heaviness"
  | "med_miss_next_day"
  | "lifter_delayed"
  | "drainer_next_day"
  | "weather_sensitivity"
  | "trend_shift_up"
  | "trend_shift_down";

export type Pattern = {
  kind: PatternKind;
  /** Människovänlig huvudrad — en mening, inga jargong. */
  headline: string;
  /** Förklaring med konkreta siffror från användarens egna data. */
  evidence: string;
  /** "Du brukar må X bättre/sämre" — riktning. positive = lyfter, negative = drar ner.
   *  Härleds nu via valens-modulen så grön/röd alltid betyder samma sak. */
  direction: "positive" | "negative";
  /** Vilket mått (i valens-tabellen) mönstret refererar till. UI använder
   *  detta för att färga delta-pillen konsekvent via deltaChipClass. */
  metric: string;
  /** Antal datapunkter mönstret bygger på (jämförelsegrupp). */
  sample: number;
  /** Hur stark effekten är — högre värde = vi visar den högre upp. */
  strength: number;
};

type ActivityLite = {
  date: string;
  activity_slug: string;
  label: string;
  mood_delta: number | null;
};

type SessionLite = {
  date: string;
  category: string | null;
  title: string | null;
  mood_before: number | null;
  mood_after: number | null;
  anxiety_before: number | null;
  anxiety_after: number | null;
};

type MedLogLite = {
  date: string;
  taken_status: string;
};

const MIN_SAMPLE = 5;

const avg = (xs: number[]): number => xs.reduce((s, x) => s + x, 0) / xs.length;

const isoDayBefore = (iso: string): string => {
  const d = new Date(iso);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

/** Bygg en lookup date → checkin för O(1)-uppslag. */
const indexCheckins = (rows: Checkin[]): Map<string, Checkin> => {
  const m = new Map<string, Checkin>();
  for (const r of rows) m.set(r.date, r);
  return m;
};

// ─────────────────────────────────────────────────────────────
// 1. Kort sömn → oro nästa dag
// ─────────────────────────────────────────────────────────────
const detectSleepAnxiety = (
  rows: Checkin[],
  thresholds: PersonalThresholds,
): Pattern | null => {
  const idx = indexCheckins(rows);
  const lowNext: number[] = [];
  const okNext: number[] = [];
  for (const c of rows) {
    const sh = c.sleep_hours == null ? null : Number(c.sleep_hours);
    if (sh == null) continue;
    const next = idx.get(
      new Date(new Date(c.date).getTime() + 86_400_000).toISOString().split("T")[0],
    );
    if (!next || next.anxiety == null) continue;
    if (sh < thresholds.shortSleep) lowNext.push(next.anxiety);
    else okNext.push(next.anxiety);
  }
  if (lowNext.length < MIN_SAMPLE || okNext.length < MIN_SAMPLE) return null;
  const diff = avg(lowNext) - avg(okNext);
  if (Math.abs(diff) < 1) return null;
  // Vi mäter oro nästa dag (lower-better). diff > 0 = mer oro efter kort sömn.
  const sign = improvementSign("anxiety", diff);
  return {
    kind: "sleep_next_day_anxiety",
    headline:
      sign === -1
        ? "Korta nätter följs ofta av högre oro dagen efter"
        : "Korta nätter verkar inte trigga oro hos dig",
    evidence: `Efter nätter under ${thresholds.shortSleep.toFixed(1)} h ligger oron i snitt ${avg(lowNext).toFixed(1)}/10 — mot ${avg(okNext).toFixed(1)}/10 efter längre nätter.`,
    direction: sign === 1 ? "positive" : "negative",
    metric: "anxiety",
    sample: lowNext.length + okNext.length,
    strength: Math.abs(diff),
  };
};

// ─────────────────────────────────────────────────────────────
// 2. Veckodags-mönster (måndag/söndag-dipp etc.)
// ─────────────────────────────────────────────────────────────
const WEEKDAYS_SV = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];

const detectWeekdayDip = (rows: Checkin[]): Pattern | null => {
  if (rows.length < 14) return null;
  const burdenByDay: number[][] = Array.from({ length: 7 }, () => []);
  for (const c of rows) {
    if (c.mood_heaviness == null && c.anxiety == null) continue;
    const d = new Date(c.date).getDay();
    const burden =
      ((c.mood_heaviness ?? 0) + (c.anxiety ?? 0)) /
      ((c.mood_heaviness != null ? 1 : 0) + (c.anxiety != null ? 1 : 0) || 1);
    burdenByDay[d].push(burden);
  }
  const meanByDay = burdenByDay.map((arr) => (arr.length >= 2 ? avg(arr) : null));
  const valid = meanByDay
    .map((m, i) => ({ i, m }))
    .filter((x): x is { i: number; m: number } => x.m != null);
  if (valid.length < 5) return null;
  const overall = avg(valid.map((v) => v.m));
  const worst = valid.reduce((a, b) => (b.m > a.m ? b : a));
  const diff = worst.m - overall;
  if (diff < 1) return null;
  if (burdenByDay[worst.i].length < MIN_SAMPLE) return null;
  return {
    kind: "weekday_dip",
    headline: `${WEEKDAYS_SV[worst.i].charAt(0).toUpperCase() + WEEKDAYS_SV[worst.i].slice(1)}ar har varit tyngre hos dig`,
    evidence: `Snittbelastning ${worst.m.toFixed(1)}/10 — mot ${overall.toFixed(1)}/10 övriga veckodagar (${burdenByDay[worst.i].length} ${WEEKDAYS_SV[worst.i]}ar mätta).`,
    direction: "negative",
    metric: "burden",
    sample: burdenByDay[worst.i].length,
    strength: diff,
  };
};

// ─────────────────────────────────────────────────────────────
// 3. Mycket stillasittande → tyngd samma dag
// ─────────────────────────────────────────────────────────────
const detectStillness = (
  rows: Checkin[],
  thresholds: PersonalThresholds,
): Pattern | null => {
  const high: number[] = [];
  const low: number[] = [];
  for (const c of rows) {
    if (c.daytime_bed_sofa_time_minutes == null || c.mood_heaviness == null) continue;
    if (c.daytime_bed_sofa_time_minutes >= thresholds.highBedSofa) high.push(c.mood_heaviness);
    else low.push(c.mood_heaviness);
  }
  if (high.length < MIN_SAMPLE || low.length < MIN_SAMPLE) return null;
  const diff = avg(high) - avg(low);
  if (diff < 1) return null;
  return {
    kind: "stillness_heaviness",
    headline: "Stilla dagar tenderar att kännas tyngre",
    evidence: `När du varit stilla ≥ ${thresholds.highBedSofa} min ligger tyngden i snitt ${avg(high).toFixed(1)}/10 — mot ${avg(low).toFixed(1)}/10 övriga dagar.`,
    direction: "negative",
    metric: "mood_heaviness",
    sample: high.length + low.length,
    strength: diff,
  };
};

// ─────────────────────────────────────────────────────────────
// 4. Missad medicin → tyngre nästa dag
// ─────────────────────────────────────────────────────────────
const detectMedMiss = (rows: Checkin[], medLogs: MedLogLite[]): Pattern | null => {
  if (medLogs.length < 10) return null;
  const idx = indexCheckins(rows);
  const missDays = new Set(medLogs.filter((l) => l.taken_status === "missed").map((l) => l.date));
  const takenDays = new Set(medLogs.filter((l) => l.taken_status === "taken").map((l) => l.date));
  const missNext: number[] = [];
  const takenNext: number[] = [];
  for (const day of missDays) {
    const next = idx.get(
      new Date(new Date(day).getTime() + 86_400_000).toISOString().split("T")[0],
    );
    if (next?.mood_heaviness != null) missNext.push(next.mood_heaviness);
  }
  for (const day of takenDays) {
    const next = idx.get(
      new Date(new Date(day).getTime() + 86_400_000).toISOString().split("T")[0],
    );
    if (next?.mood_heaviness != null) takenNext.push(next.mood_heaviness);
  }
  if (missNext.length < MIN_SAMPLE || takenNext.length < MIN_SAMPLE) return null;
  const diff = avg(missNext) - avg(takenNext);
  if (diff < 1) return null;
  return {
    kind: "med_miss_next_day",
    headline: "Dagar utan medicin tenderar att följas av tyngre dag",
    evidence: `Efter missad dos: tyngd ${avg(missNext).toFixed(1)}/10 i snitt — mot ${avg(takenNext).toFixed(1)}/10 efter taget.`,
    direction: "negative",
    metric: "mood_heaviness",
    sample: missNext.length + takenNext.length,
    strength: diff,
  };
};

// ─────────────────────────────────────────────────────────────
// 5. Aktivitet/övning → bättre nästa dag (fördröjd lyft-effekt)
// ─────────────────────────────────────────────────────────────
const detectDelayedLift = (
  rows: Checkin[],
  activities: ActivityLite[],
  sessions: SessionLite[],
): Pattern[] => {
  const idx = indexCheckins(rows);
  type Bucket = { label: string; deltas: number[] };
  const buckets = new Map<string, Bucket>();

  const addObs = (key: string, label: string, todayBurden: number, nextBurden: number) => {
    const cur = buckets.get(key) ?? { label, deltas: [] };
    cur.deltas.push(todayBurden - nextBurden); // positivt = nästa dag är lättare
    buckets.set(key, cur);
  };

  const burdenOf = (c: Checkin | undefined): number | null => {
    if (!c) return null;
    if (c.mood_heaviness == null && c.anxiety == null) return null;
    const parts = [c.mood_heaviness, c.anxiety].filter((x): x is number => x != null);
    return avg(parts);
  };

  // Aktiviteter
  for (const a of activities) {
    const today = idx.get(a.date);
    const next = idx.get(
      new Date(new Date(a.date).getTime() + 86_400_000).toISOString().split("T")[0],
    );
    const tb = burdenOf(today);
    const nb = burdenOf(next);
    if (tb == null || nb == null) continue;
    addObs(`act:${a.activity_slug}`, a.label, tb, nb);
  }

  // Sessioner
  for (const s of sessions) {
    if (!s.title) continue;
    const today = idx.get(s.date);
    const next = idx.get(
      new Date(new Date(s.date).getTime() + 86_400_000).toISOString().split("T")[0],
    );
    const tb = burdenOf(today);
    const nb = burdenOf(next);
    if (tb == null || nb == null) continue;
    addObs(`sess:${s.title}`, s.title, tb, nb);
  }

  const out: Pattern[] = [];
  for (const b of buckets.values()) {
    if (b.deltas.length < MIN_SAMPLE) continue;
    const m = avg(b.deltas);
    if (Math.abs(m) < 1) continue;
    out.push({
      kind: m > 0 ? "lifter_delayed" : "drainer_next_day",
      headline:
        m > 0
          ? `“${b.label}” följs ofta av en lättare dag`
          : `“${b.label}” verkar göra dagen efter tyngre`,
      evidence:
        m > 0
          ? `I snitt ${m.toFixed(1)} skalsteg lättare nästa morgon (över ${b.deltas.length} gånger).`
          : `I snitt ${Math.abs(m).toFixed(1)} skalsteg tyngre nästa morgon (över ${b.deltas.length} gånger).`,
      direction: m > 0 ? "positive" : "negative",
      metric: "burden",
      sample: b.deltas.length,
      strength: Math.abs(m),
    });
  }
  return out;
};

// ─────────────────────────────────────────────────────────────
// 6. Väderkänslighet — burden på regn/kallt vs sol/mildt
// ─────────────────────────────────────────────────────────────
const burdenOfRow = (c: Checkin): number | null => {
  if (c.mood_heaviness == null && c.anxiety == null) return null;
  const parts = [c.mood_heaviness, c.anxiety].filter((x): x is number => x != null);
  return avg(parts);
};

type DailyWeatherLite = {
  date: string;
  temp_avg_c: number | null;
  precip_mm: number | null;
  weather_code: number | null;
};

const detectWeatherSensitivity = (
  rows: Checkin[],
  dailyWeather: DailyWeatherLite[] = [],
): Pattern | null => {
  const wxByDate = new Map<string, DailyWeatherLite>();
  for (const w of dailyWeather) wxByDate.set(w.date, w);

  const heavyWeather: number[] = [];
  const lightWeather: number[] = [];
  for (const c of rows) {
    const b = burdenOfRow(c);
    if (b == null) continue;

    // Prefer authoritative daily_weather data when available; fall back to
    // checkin-attached fields (geolocation snapshot vid morgon-incheckning).
    const wx = wxByDate.get(c.date);
    const inline = c as unknown as { weather_kind?: string | null; weather_temp_c?: number | string | null };
    const kind = (wx ? weatherCodeKind(wx.weather_code) : (inline.weather_kind ?? "")).toLowerCase();
    const temp = wx?.temp_avg_c ?? (inline.weather_temp_c == null ? null : Number(inline.weather_temp_c));
    const precip = wx?.precip_mm ?? null;

    const isHeavy =
      kind.includes("rain") || kind.includes("snow") || kind.includes("storm") || kind.includes("fog") ||
      kind.includes("regn") || kind.includes("mulet") || kind.includes("cloud") ||
      (temp != null && temp <= 2) ||
      (precip != null && precip >= 5);
    const isLight =
      kind.includes("sun") || kind.includes("clear") || kind.includes("sol") ||
      (temp != null && temp >= 12 && (precip == null || precip < 1));
    if (isHeavy) heavyWeather.push(b);
    else if (isLight) lightWeather.push(b);
  }
  if (heavyWeather.length < MIN_SAMPLE || lightWeather.length < MIN_SAMPLE) return null;
  const diff = avg(heavyWeather) - avg(lightWeather);
  if (Math.abs(diff) < 1) return null;
  return {
    kind: "weather_sensitivity",
    headline:
      diff > 0
        ? "Gråa/kalla dagar tenderar att kännas tyngre"
        : "Du verkar klara dåligt väder bra",
    evidence: `Vid regn, moln eller ≤ 2 °C ligger belastningen i snitt ${avg(heavyWeather).toFixed(1)}/10 — mot ${avg(lightWeather).toFixed(1)}/10 vid sol eller mildare väder.`,
    direction: diff > 0 ? "negative" : "positive",
    metric: "burden",
    sample: heavyWeather.length + lightWeather.length,
    strength: Math.abs(diff),
  };
};

// ─────────────────────────────────────────────────────────────
// 7. Trend-skifte — sista 7 d jämfört med föregående 7 d
// ─────────────────────────────────────────────────────────────
const detectTrendShift = (rows: Checkin[]): Pattern | null => {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7).map(burdenOfRow).filter((x): x is number => x != null);
  const prev = sorted.slice(-14, -7).map(burdenOfRow).filter((x): x is number => x != null);
  if (recent.length < 4 || prev.length < 4) return null;
  const diff = avg(recent) - avg(prev);
  if (Math.abs(diff) < 1) return null;
  if (diff > 0) {
    return {
      kind: "trend_shift_up",
      headline: "Belastningen har stigit senaste veckan",
      evidence: `Snittbelastning ${avg(recent).toFixed(1)}/10 — mot ${avg(prev).toFixed(1)}/10 veckan innan.`,
      direction: "negative",
      metric: "burden",
      sample: recent.length + prev.length,
      strength: diff,
    };
  }
  return {
    kind: "trend_shift_down",
    headline: "Det har vänt nedåt — riktningen är bättre",
    evidence: `Snittbelastning ${avg(recent).toFixed(1)}/10 — mot ${avg(prev).toFixed(1)}/10 veckan innan.`,
    direction: "positive",
    metric: "burden",
    sample: recent.length + prev.length,
    strength: -diff,
  };
};
// ─────────────────────────────────────────────────────────────

export type DetectPatternsInput = {
  checkins: Checkin[];
  activities: ActivityLite[];
  sessions: SessionLite[];
  medLogs: MedLogLite[];
  thresholds: PersonalThresholds;
};

/**
 * Returnera de starkaste mönstren (max `limit`), sorterade efter strength.
 * Filtrerar bort kvalitativa duplicates och håller listan kort.
 */
export const detectPatterns = (
  input: DetectPatternsInput,
  limit = 3,
): Pattern[] => {
  const all: Pattern[] = [];
  const sleep = detectSleepAnxiety(input.checkins, input.thresholds);
  if (sleep) all.push(sleep);
  const weekday = detectWeekdayDip(input.checkins);
  if (weekday) all.push(weekday);
  const still = detectStillness(input.checkins, input.thresholds);
  if (still) all.push(still);
  const med = detectMedMiss(input.checkins, input.medLogs);
  if (med) all.push(med);
  const weather = detectWeatherSensitivity(input.checkins);
  if (weather) all.push(weather);
  const trend = detectTrendShift(input.checkins);
  if (trend) all.push(trend);
  for (const p of detectDelayedLift(input.checkins, input.activities, input.sessions)) {
    all.push(p);
  }
  // Sortera: störst effekt först. Boost positiva lyftare lite — vi vill hellre
  // visa "vad som hjälper" än enbart "vad som drar ner".
  all.sort((a, b) => {
    const aw = a.strength + (a.direction === "positive" ? 0.3 : 0);
    const bw = b.strength + (b.direction === "positive" ? 0.3 : 0);
    return bw - aw;
  });
  return all.slice(0, limit);
};

void isoDayBefore; // exporterad indirekt — håll funktionen för ev. framtida bruk
