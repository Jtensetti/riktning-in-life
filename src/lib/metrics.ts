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

export const burdenScore = (cs: Checkin[]) => {
  const m = avg(cs.map(c => norm10(c.mood_heaviness)));
  const h = avg(cs.map(c => norm10(c.hopelessness)));
  const a = avg(cs.map(c => norm10(c.anxiety)));
  const g = avg(cs.map(c => norm10(c.guilt_selfcriticism)));
  const sd = avg(cs.map(c => sleepDeficitNorm(c.sleep_hours == null ? null : Number(c.sleep_hours))));
  const dbs = avg(cs.map(c => daytimeBedNorm(c.daytime_bed_sofa_time_minutes)));
  // Weighted (without PHQ9/GAD7 in v1)
  const parts = [
    [m, 0.30], [h, 0.20], [a, 0.20], [g, 0.15], [sd, 0.10], [dbs, 0.05],
  ] as const;
  const valid = parts.filter(([v]) => v != null) as [number, number][];
  if (valid.length === 0) return null;
  const totalWeight = valid.reduce((s, [, w]) => s + w, 0);
  return valid.reduce((s, [v, w]) => s + v * w, 0) / totalWeight;
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
  // Daily composite = burden core (mood + anxiety + hopelessness) per day
  const daily = cs.map(c => {
    const parts = [norm10(c.mood_heaviness), norm10(c.anxiety), norm10(c.hopelessness)].filter((x): x is number => x != null);
    return parts.length ? parts.reduce((s, x) => s + x, 0) / parts.length : null;
  }).filter((x): x is number => x != null);
  if (daily.length < 2) return null;
  return Math.max(0, 100 - std(daily));
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
  const d7 = isoDaysAgo(6); // last 7 days
  const d14 = isoDaysAgo(13);
  const current = cs.filter(c => c.date >= d7);
  const previous = cs.filter(c => c.date >= d14 && c.date < d7);
  return { current, previous };
};
