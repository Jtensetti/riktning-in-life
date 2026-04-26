// Riktning weekly metrics — formulas from product spec.
// All scores normalized to 0–100.

export type Checkin = {
  id: string;
  date: string;
  mood_heaviness: number | null;
  anxiety: number | null;
  guilt_selfcriticism: number | null;
  hopelessness: number | null;
  energy: number | null;
  getting_started: number | null;
  function_score: number | null;
  daytime_bed_sofa_time_minutes: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  movement_today: string | null;
  meaningful_activity: string | null;
  safety_status: string | null;
};

export type WeeklyFormScore = {
  phq9?: number; // raw 0-27
  gad7?: number; // raw 0-21
  who5?: number; // raw 0-25 (final 0-100)
};

const norm10 = (v: number | null) => v == null ? null : (v / 10) * 100;

const sleepDeficitNorm = (h: number | null) => {
  if (h == null) return null;
  if (h >= 7) return 0;
  if (h <= 3) return 100;
  return ((7 - h) / 4) * 100;
};

const daytimeBedNorm = (m: number | null) => {
  if (m == null) return null;
  if (m <= 0) return 0;
  if (m >= 240) return 100;
  return (m / 240) * 100;
};

const movementNorm = (s: string | null) =>
  s === "yes" ? 100 : s === "little" ? 50 : s === "none" ? 0 : null;

const meaningfulNorm = (s: string | null) =>
  s === "yes" ? 100 : s === "little" ? 50 : s === "none" ? 0 : null;

const avg = (values: (number | null)[]) => {
  const v = values.filter((x): x is number => x != null);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
};

const std = (values: number[]) => {
  if (values.length < 2) return 0;
  const m = values.reduce((s, x) => s + x, 0) / values.length;
  const variance = values.reduce((s, x) => s + (x - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

/**
 * Burden score with optional weekly forms.
 * Returns { value, withWeekly } so UI can label "utan veckoskattning" when missing.
 */
export const burdenScore = (cs: Checkin[], weekly?: WeeklyFormScore): { value: number | null; withWeekly: boolean } => {
  const m = avg(cs.map(c => norm10(c.mood_heaviness)));
  const h = avg(cs.map(c => norm10(c.hopelessness)));
  const a = avg(cs.map(c => norm10(c.anxiety)));
  const g = avg(cs.map(c => norm10(c.guilt_selfcriticism)));
  const sd = avg(cs.map(c => sleepDeficitNorm(c.sleep_hours == null ? null : Number(c.sleep_hours))));
  const dbs = avg(cs.map(c => daytimeBedNorm(c.daytime_bed_sofa_time_minutes)));

  const phq = weekly?.phq9 != null ? (weekly.phq9 / 27) * 100 : null;
  const gad = weekly?.gad7 != null ? (weekly.gad7 / 21) * 100 : null;
  const withWeekly = phq != null && gad != null;

  let parts: [number | null, number][];
  if (withWeekly) {
    // Per spec: 0.20 PHQ + 0.15 GAD + 0.15 hop + 0.15 anx + 0.15 guilt + 0.10 sleep_def + 0.10 bed
    parts = [[phq, 0.20], [gad, 0.15], [h, 0.15], [a, 0.15], [g, 0.15], [sd, 0.10], [dbs, 0.10]];
  } else {
    // Daily-only fallback
    parts = [[m, 0.30], [h, 0.20], [a, 0.20], [g, 0.15], [sd, 0.10], [dbs, 0.05]];
  }
  const valid = parts.filter(([v]) => v != null) as [number, number][];
  if (valid.length === 0) return { value: null, withWeekly };
  const totalWeight = valid.reduce((s, [, w]) => s + w, 0);
  return { value: valid.reduce((s, [v, w]) => s + v * w, 0) / totalWeight, withWeekly };
};

export const functionScore = (cs: Checkin[]) => {
  const gs = avg(cs.map(c => norm10(c.getting_started)));
  const fn = avg(cs.map(c => norm10(c.function_score)));
  const en = avg(cs.map(c => norm10(c.energy)));
  const mn = avg(cs.map(c => meaningfulNorm(c.meaningful_activity)));
  const dbs = avg(cs.map(c => daytimeBedNorm(c.daytime_bed_sofa_time_minutes)));
  const inverseDbs = dbs == null ? null : 100 - dbs;
  const parts = [[gs, 0.25], [fn, 0.25], [en, 0.20], [mn, 0.15], [inverseDbs, 0.15]] as const;
  const valid = parts.filter(([v]) => v != null) as [number, number][];
  if (valid.length === 0) return null;
  const totalWeight = valid.reduce((s, [, w]) => s + w, 0);
  return valid.reduce((s, [v, w]) => s + v * w, 0) / totalWeight;
};

export const recoveryScore = (cs: Checkin[]) => {
  const sq = avg(cs.map(c => norm10(c.sleep_quality)));
  const en = avg(cs.map(c => norm10(c.energy)));
  const an = avg(cs.map(c => norm10(c.anxiety)));
  const calmInverse = an == null ? null : 100 - an;
  const mv = avg(cs.map(c => movementNorm(c.movement_today)));
  const mn = avg(cs.map(c => meaningfulNorm(c.meaningful_activity)));
  const parts = [[sq, 0.30], [en, 0.20], [calmInverse, 0.20], [mv, 0.15], [mn, 0.15]] as const;
  const valid = parts.filter(([v]) => v != null) as [number, number][];
  if (valid.length === 0) return null;
  const totalWeight = valid.reduce((s, [, w]) => s + w, 0);
  return valid.reduce((s, [v, w]) => s + v * w, 0) / totalWeight;
};

export const stabilityScore = (cs: Checkin[]) => {
  const daily = cs.map(c => {
    const parts = [norm10(c.mood_heaviness), norm10(c.anxiety), norm10(c.hopelessness)].filter((x): x is number => x != null);
    return parts.length ? parts.reduce((s, x) => s + x, 0) / parts.length : null;
  }).filter((x): x is number => x != null);
  if (daily.length < 2) return null;
  return Math.max(0, 100 - std(daily));
};

export const stabilityLabel = (current: number | null, prev: number | null): string => {
  if (current == null) return "—";
  const delta = prev != null ? current - prev : 0;
  if (delta > 5) return "Mer stabil";
  if (delta < -5) return "Mindre stabil";
  return "Stabil";
};

export const pctChange = (current: number | null, prev: number | null) => {
  if (current == null || prev == null || prev === 0) return null;
  return ((current - prev) / prev) * 100;
};

export const isoDaysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

export const splitWeeks = (cs: Checkin[]) => {
  const d7 = isoDaysAgo(6);
  const d14 = isoDaysAgo(13);
  const current = cs.filter(c => c.date >= d7);
  const previous = cs.filter(c => c.date >= d14 && c.date < d7);
  return { current, previous };
};

/**
 * Generate deterministic insights from the current week's checkins.
 */
export const generateInsights = (cs: Checkin[]): string[] => {
  const insights: string[] = [];
  if (cs.length < 3) return insights;

  // 1. Movement → next-day anxiety
  const moveNext: number[] = [];
  const noMoveNext: number[] = [];
  for (let i = 0; i < cs.length - 1; i++) {
    const moved = cs[i].movement_today === "yes";
    const nextAnx = cs[i + 1].anxiety;
    if (nextAnx == null) continue;
    (moved ? moveNext : noMoveNext).push(nextAnx);
  }
  if (moveNext.length && noMoveNext.length) {
    const a1 = moveNext.reduce((s, x) => s + x, 0) / moveNext.length;
    const a2 = noMoveNext.reduce((s, x) => s + x, 0) / noMoveNext.length;
    if (a2 - a1 >= 1) insights.push("Dagar med rörelse följs ofta av lägre oro.");
  }

  // 2. Sleep < 5h → next-day anxiety higher
  const lowSleepNext: number[] = [];
  const okSleepNext: number[] = [];
  for (let i = 0; i < cs.length - 1; i++) {
    const sh = cs[i].sleep_hours == null ? null : Number(cs[i].sleep_hours);
    const nextAnx = cs[i + 1].anxiety;
    if (sh == null || nextAnx == null) continue;
    (sh < 5 ? lowSleepNext : okSleepNext).push(nextAnx);
  }
  if (lowSleepNext.length && okSleepNext.length) {
    const a1 = lowSleepNext.reduce((s, x) => s + x, 0) / lowSleepNext.length;
    const a2 = okSleepNext.reduce((s, x) => s + x, 0) / okSleepNext.length;
    if (a1 - a2 >= 1) insights.push("Sömn under 5 h följs ofta av högre oro.");
  }

  // 3. Bed/sofa > 120 min same-day → lower function
  const highBed: number[] = [];
  const lowBed: number[] = [];
  for (const c of cs) {
    if (c.function_score == null || c.daytime_bed_sofa_time_minutes == null) continue;
    (c.daytime_bed_sofa_time_minutes > 120 ? highBed : lowBed).push(c.function_score);
  }
  if (highBed.length && lowBed.length) {
    const f1 = highBed.reduce((s, x) => s + x, 0) / highBed.length;
    const f2 = lowBed.reduce((s, x) => s + x, 0) / lowBed.length;
    if (f2 - f1 >= 1) insights.push("Säng/sofftid över 120 min sammanfaller med lägre funktion.");
  }

  return insights;
};
