/**
 * Progression — vad har faktiskt rört sig sedan du började?
 *
 * Tar daily_checkins (sorterade på datum) + en valfri PersonalEffect och
 * returnerar 3–5 korta påståenden som höger-cockpiten kan rendera. Allt
 * deterministiskt, inga AI-anrop, ingen design — bara siffror i text.
 */

import type { PersonalEffect } from "./personalEffect";
import { topLifters } from "./personalEffect";

export type ProgressionFact = {
  kind: "streak" | "baseline_shift" | "top_lifter" | "variety" | "consistency";
  label: string;
  value: string;
  /** Liten klargörande rad — visas mindre. */
  sub?: string;
  tone: "good" | "neutral" | "warn";
};

type CheckinRow = {
  date: string;
  mood_heaviness: number | null;
  anxiety: number | null;
  energy: number | null;
  function_score: number | null;
};

const isoDaysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

const avg = (xs: (number | null)[]): number | null => {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
};

/** Sammanhängande dagar med check-in räknat bakåt från idag eller igår. */
const computeStreak = (rows: CheckinRow[]): number => {
  if (rows.length === 0) return 0;
  const days = new Set(rows.map((r) => r.date));
  const today = new Date();
  // Tillåt att dagens incheckning saknas — börja från igår om så.
  let start = 0;
  if (!days.has(today.toISOString().split("T")[0])) start = 1;
  let n = 0;
  for (let i = start; i < 365; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const k = d.toISOString().split("T")[0];
    if (days.has(k)) n++;
    else break;
  }
  return n;
};

const metricFmt = (n: number) => Math.round(n * 10) / 10;

const labelForLifter = (metric: string): string => {
  switch (metric) {
    case "anxiety": return "sänker oro";
    case "energy": return "höjer energi";
    case "mood":
    default: return "lyfter måendet";
  }
};

export const computeProgression = (
  rows: CheckinRow[],
  personalEffect?: PersonalEffect,
): ProgressionFact[] => {
  const facts: ProgressionFact[] = [];
  if (rows.length === 0) return facts;

  // 1) Streak
  const streak = computeStreak(rows);
  if (streak >= 3) {
    facts.push({
      kind: "streak",
      label: "Loggat i rad",
      value: `${streak} dagar`,
      sub: streak >= 14 ? "Stark vana." : streak >= 7 ? "Bra rytm." : "Bygger en vana.",
      tone: "good",
    });
  }

  // 2) Baseline-skift — första 14 dagar vs senaste 14 dagar
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const total = sorted.length;
  if (total >= 21) {
    const early = sorted.slice(0, 14);
    const recent = sorted.slice(-14);
    const compare = (
      pick: (r: CheckinRow) => number | null,
      label: string,
      goodWhenLower: boolean,
    ) => {
      const e = avg(early.map(pick));
      const r = avg(recent.map(pick));
      if (e == null || r == null) return;
      const delta = r - e;
      if (Math.abs(delta) < 0.5) return;
      const improved = goodWhenLower ? delta < 0 : delta > 0;
      const arrow = delta > 0 ? "→" : "→";
      facts.push({
        kind: "baseline_shift",
        label: `${label} sedan start`,
        value: `${metricFmt(e)} ${arrow} ${metricFmt(r)}`,
        sub: improved ? "Det rör sig åt rätt håll." : "Värt att se över.",
        tone: improved ? "good" : "warn",
      });
    };
    compare((r) => r.anxiety, "Oro i snitt", true);
    compare((r) => r.mood_heaviness, "Tyngd i snitt", true);
    compare((r) => r.energy, "Energi i snitt", false);
  } else if (total >= 7) {
    // Ungt dataset → 7 vs 7 dagar
    const cur = sorted.slice(-7);
    const prev = sorted.slice(-14, -7);
    if (prev.length >= 3) {
      const e = avg(prev.map((r) => r.anxiety));
      const r = avg(cur.map((r) => r.anxiety));
      if (e != null && r != null && Math.abs(r - e) >= 0.6) {
        const improved = r < e;
        facts.push({
          kind: "baseline_shift",
          label: "Oro senaste veckan",
          value: `${metricFmt(e)} → ${metricFmt(r)}`,
          sub: improved ? "Lättar." : "Tyngre än veckan innan.",
          tone: improved ? "good" : "warn",
        });
      }
    }
  }

  // 3) Top-lifter från personlig effekt
  if (personalEffect) {
    const top = topLifters(personalEffect, 1)[0];
    if (top) {
      facts.push({
        kind: "top_lifter",
        label: `Bäst för dig: ${top.key}`,
        value: `${labelForLifter(top.metric)} ~${Math.abs(top.avgDelta).toFixed(1)}`,
        sub: `Baserat på ${top.count} ${top.count === 1 ? "gång" : "gånger"}.`,
        tone: "good",
      });
    }
    const totalCount = Object.keys(personalEffect.exerciseMood.byExerciseTitle ?? {}).length
      + Object.keys(personalEffect.exerciseAnxiety.byExerciseTitle ?? {}).length;
    if (totalCount >= 4) {
      facts.push({
        kind: "variety",
        label: "Du har provat",
        value: `${totalCount} olika övningar`,
        sub: "Variation hjälper att se vad som funkar.",
        tone: "neutral",
      });
    }
  }

  // 4) Konsistens — andel dagar med data senaste 30
  const cutoff = isoDaysAgo(29);
  const last30 = sorted.filter((r) => r.date >= cutoff);
  if (last30.length >= 10) {
    const pct = Math.round((last30.length / 30) * 100);
    facts.push({
      kind: "consistency",
      label: "Senaste 30 dagarna",
      value: `${pct} % loggade`,
      tone: pct >= 70 ? "good" : "neutral",
    });
  }

  return facts.slice(0, 5);
};
