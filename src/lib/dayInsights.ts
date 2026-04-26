// Per-dag-insikter: "varför var den här dagen bra/tung?" och "vad säger ikväll
// om imorgon?". Allt deterministiskt, inga AI-anrop.

import { burdenScore, type Checkin } from "./metrics";
import type { PersonalThresholds } from "./baseline";

export type DayHighlight = {
  iso: string;
  /** 0–100, högre = bättre. */
  direction: number;
  /** Två korta orsaks-stycken som förklarar varför dagen sticker ut. */
  reasons: string[];
};

export type DayHighlights = {
  best: DayHighlight | null;
  worst: DayHighlight | null;
};

const dayLabel = (iso: string): string => {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = iso === today.toISOString().split("T")[0];
  if (isToday) return "Idag";
  return d.toLocaleDateString("sv-SE", { weekday: "long" });
};
void dayLabel;

const avg = (xs: (number | null | undefined)[]): number | null => {
  const v = xs.filter((x): x is number => typeof x === "number");
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
};

/** Bygg orsaker för en dag genom att jämföra mot veckosnittet. */
const buildReasons = (c: Checkin, week: Checkin[]): string[] => {
  const reasons: string[] = [];

  const sleepAvg = avg(week.map((x) => x.sleep_hours == null ? null : Number(x.sleep_hours)));
  const moodAvg = avg(week.map((x) => x.mood_heaviness));
  const anxAvg = avg(week.map((x) => x.anxiety));
  const energyAvg = avg(week.map((x) => x.energy));
  const bedAvg = avg(week.map((x) => x.daytime_bed_sofa_time_minutes));

  // Sömn
  if (c.sleep_hours != null && sleepAvg != null) {
    const sh = Number(c.sleep_hours);
    if (sh - sleepAvg >= 1) reasons.push(`Sömnen var bättre (${sh.toFixed(1)} h)`);
    else if (sleepAvg - sh >= 1) reasons.push(`Sömnen var kort (${sh.toFixed(1)} h)`);
  }

  // Rörelse
  if (c.movement_today === "yes") reasons.push("Du rörde på dig");
  else if (c.movement_today === "none" && week.some((x) => x.movement_today === "yes")) {
    reasons.push("Ingen rörelse den här dagen");
  }

  // Mening
  if (c.meaningful_activity === "yes") reasons.push("Något meningsfullt hände");

  // Oro
  if (c.anxiety != null && anxAvg != null) {
    if (c.anxiety - anxAvg >= 2) reasons.push(`Oron var högre (${c.anxiety}/10)`);
    else if (anxAvg - c.anxiety >= 2) reasons.push(`Oron var lägre (${c.anxiety}/10)`);
  }

  // Mood
  if (c.mood_heaviness != null && moodAvg != null) {
    if (c.mood_heaviness - moodAvg >= 2) reasons.push(`Tyngden låg högre`);
  }

  // Energi
  if (c.energy != null && energyAvg != null) {
    if (c.energy - energyAvg >= 2) reasons.push(`Energin var högre`);
    else if (energyAvg - c.energy >= 2) reasons.push(`Energin var lägre`);
  }

  // Stilla tid
  if (c.daytime_bed_sofa_time_minutes != null && bedAvg != null) {
    const m = c.daytime_bed_sofa_time_minutes;
    if (m - bedAvg >= 60) reasons.push(`Mycket stilla tid (${Math.round(m)} min)`);
  }

  return reasons.slice(0, 2);
};

/** Plocka bästa & tyngsta dag i veckan med förklaringar. */
export const buildDayHighlights = (week: Checkin[]): DayHighlights => {
  if (week.length < 3) return { best: null, worst: null };

  const scored = week
    .map((c) => {
      const { value } = burdenScore([c]);
      return value == null ? null : { c, direction: Math.max(0, Math.min(100, 100 - value)) };
    })
    .filter((x): x is { c: Checkin; direction: number } => x !== null);

  if (scored.length < 2) return { best: null, worst: null };

  scored.sort((a, b) => b.direction - a.direction);
  const top = scored[0];
  const bottom = scored[scored.length - 1];

  // Behöver ett tydligt avstånd för att alls visa
  if (top.direction - bottom.direction < 10) return { best: null, worst: null };

  return {
    best: { iso: top.c.date, direction: Math.round(top.direction), reasons: buildReasons(top.c, week) },
    worst: { iso: bottom.c.date, direction: Math.round(bottom.direction), reasons: buildReasons(bottom.c, week) },
  };
};

// ─────────────────────────────────────────────────────────────
// Spår C — Riktning ikväll: prediktiv mikronudge
// ─────────────────────────────────────────────────────────────

export type EveningPrediction = {
  /** En kort ledande mening, t.ex. "En kvällsritual gör mest skillnad ikväll." */
  headline: string;
  /** En radförklaring kopplad till användarens egen data. */
  reason: string;
  /** Vilken slot/kategori som passar bäst — så vi kan deep-linka till rekommendation. */
  matchCategory: "Sov bättre" | "Lugna kroppen" | "Rör dig mjukt" | "Bryt ältande";
  /** Tone för kortet. */
  tone: "purple" | "blue" | "pink" | "orange";
};

/**
 * Givet senaste 7+ dagars check-ins och dagens checkin → ge en mjuk
 * fokusrekommendation att göra ikväll. Returnerar null om datan är för tunn
 * eller om inget mönster är tydligt nog.
 */
export const buildEveningPrediction = (
  recent: Checkin[],
  today: Checkin | null,
  thresholds: PersonalThresholds,
): EveningPrediction | null => {
  if (recent.length < 7) return null;

  // Kort sömn två-eller-fler-nätter senaste 3 dagarna → kvällsritual.
  const last3 = recent.slice(-3);
  const shortNights = last3.filter(
    (c) => c.sleep_hours != null && Number(c.sleep_hours) < thresholds.shortSleep,
  ).length;
  if (shortNights >= 2) {
    return {
      headline: "En kvällsritual gör mest skillnad ikväll",
      reason: `${shortNights} av senaste 3 nätter har varit korta för dig — kroppen behöver ett mjukt slut.`,
      matchCategory: "Sov bättre",
      tone: "purple",
    };
  }

  // Hög oro idag (eller snitt senaste 3) → andning/ältande-bryt.
  const todayAnxious = today?.anxiety != null && today.anxiety >= thresholds.highAnxiety;
  const recentAnxAvg = avg(last3.map((c) => c.anxiety));
  if (todayAnxious || (recentAnxAvg != null && recentAnxAvg >= thresholds.highAnxiety)) {
    return {
      headline: "Lugna kroppen innan natten",
      reason: todayAnxious
        ? "Du loggade högre oro idag — utandning sänker pulsen snabbast."
        : "Oron har legat högt senaste dagarna — en kort paus räcker långt.",
      matchCategory: "Lugna kroppen",
      tone: "blue",
    };
  }

  // Mycket stilla tid idag → mjuk rörelse innan kvällen tar över.
  const bedToday = today?.daytime_bed_sofa_time_minutes;
  if (bedToday != null && bedToday >= thresholds.highBedSofa) {
    return {
      headline: "En kort förflyttning gör skillnad",
      reason: `Du har haft ${Math.round(bedToday)} min stilla tid idag — kroppen tackar för 5 min.`,
      matchCategory: "Rör dig mjukt",
      tone: "pink",
    };
  }

  // Hög tyngd idag → bryta ältande.
  if (today?.mood_heaviness != null && today.mood_heaviness >= thresholds.highMood) {
    return {
      headline: "Bryt loopen innan natten",
      reason: "Tyngden låg högt idag — en mikrohandling stör mönstret.",
      matchCategory: "Bryt ältande",
      tone: "orange",
    };
  }

  return null;
};

// ─────────────────────────────────────────────────────────────
// Spår A — Vad lyfter / vad drar ner (slå ihop activities + sessions)
// ─────────────────────────────────────────────────────────────

export type LiftEvidence = {
  label: string;
  icon: string;
  color: string;
  count: number;
  /** Genomsnittligt humörutfall i skalsteg (positivt = lyfter, negativt = drar ner). */
  avgDelta: number;
  /** Kort förklarande etikett: "Lyfte mycket" / "Lyfte" / "Neutralt" / "Drog ner". */
  effectLabel: string;
};

export type LiftSummary = {
  lifters: LiftEvidence[];
  drainers: LiftEvidence[];
};

type ActivityLogLite = {
  activity_slug: string;
  label: string;
  icon: string;
  color: string;
  mood_delta: number | null;
};

type SessionLite = {
  exercises: { title: string; category: string; color: string } | null;
  mood_before: number | null;
  mood_after: number | null;
  anxiety_before: number | null;
  anxiety_after: number | null;
};

const effectLabelFor = (avgDelta: number, count: number): string => {
  // Med få observationer är vi försiktiga.
  if (count < 3) return count >= 2 ? "Tidig signal" : "För lite data";
  if (avgDelta >= 1.5) return "Lyfte mycket";
  if (avgDelta >= 0.5) return "Lyfte";
  if (avgDelta >= -0.5) return "Neutralt";
  if (avgDelta >= -1.5) return "Drog ner";
  return "Drog ner mycket";
};

/**
 * Slå ihop activity_logs + exercise_sessions till evidens-baserad lista över
 * vad som lyfter respektive sänker användaren. Kräv minst 3 observationer
 * innan vi alls kallar något "bevisat".
 */
export const buildLiftSummary = (
  activities: ActivityLogLite[],
  sessions: SessionLite[],
): LiftSummary => {
  const map = new Map<string, { label: string; icon: string; color: string; deltas: number[] }>();

  for (const a of activities) {
    if (a.mood_delta == null) continue;
    const cur = map.get(a.activity_slug) ?? {
      label: a.label,
      icon: a.icon,
      color: a.color,
      deltas: [],
    };
    cur.deltas.push(Number(a.mood_delta));
    map.set(a.activity_slug, cur);
  }

  for (const s of sessions) {
    if (!s.exercises) continue;
    // Härled "delta" som humörlyft + orosänkning. Skala: före/efter på 0–10
    // → vi konverterar till en grov skalsteg-bedömning genom (after-before)/3.
    const moodDelta = s.mood_before != null && s.mood_after != null
      ? (s.mood_after - s.mood_before) / 3
      : 0;
    const anxRelief = s.anxiety_before != null && s.anxiety_after != null
      ? (s.anxiety_before - s.anxiety_after) / 3
      : 0;
    const combined = moodDelta + anxRelief;
    if (s.mood_before == null && s.anxiety_before == null) continue;

    const key = `ex:${s.exercises.title}`;
    const cur = map.get(key) ?? {
      label: s.exercises.title,
      icon: "spark",
      color: s.exercises.color,
      deltas: [],
    };
    cur.deltas.push(combined);
    map.set(key, cur);
  }

  const items: LiftEvidence[] = Array.from(map.values()).map((v) => {
    const sum = v.deltas.reduce((s, x) => s + x, 0);
    const avgDelta = sum / v.deltas.length;
    return {
      label: v.label,
      icon: v.icon,
      color: v.color,
      count: v.deltas.length,
      avgDelta: Math.round(avgDelta * 10) / 10,
      effectLabel: effectLabelFor(avgDelta, v.deltas.length),
    };
  });

  // Bevisade lyftare: minst 3 obs och avgDelta >= 0.4
  const lifters = items
    .filter((x) => x.count >= 3 && x.avgDelta >= 0.4)
    .sort((a, b) => b.avgDelta - a.avgDelta || b.count - a.count)
    .slice(0, 3);

  // Bevisade dragare: minst 3 obs och avgDelta <= -0.6 (lite hårdare tröskel — vi vill inte lättvindigt skuldbelägga)
  const drainers = items
    .filter((x) => x.count >= 3 && x.avgDelta <= -0.6)
    .sort((a, b) => a.avgDelta - b.avgDelta)
    .slice(0, 1);

  return { lifters, drainers };
};
