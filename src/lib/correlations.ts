/**
 * Correlations — letar enkla, mänskligt begripliga samband mellan
 * användarens beteenden och dagsutfall över rullande 21–28 dagar.
 *
 * Allt deterministiskt, ingen statistik-magi: vi splittrar dagarna i
 * "X gjort" / "X inte gjort" (eller högt/lågt tröskelbaserat) och jämför
 * snittutfall mellan grupperna. Vi visar bara samband när vi har minst
 * 5 dagar i båda grupperna och absolutdelta ≥ 0.6 skalsteg.
 *
 * Resultaten är för Analys-vyns "Vad hänger ihop" — inte för diagnos.
 */
import type { Checkin } from "./metrics";

export type CorrelationKey =
  | "sleep_to_direction"
  | "movement_to_mood"
  | "meaningful_to_energy"
  | "stillness_to_heaviness";

export type Correlation = {
  key: CorrelationKey;
  /** Kort rubrik, t.ex. "Bättre sömn → lättare dag". */
  headline: string;
  /** En förklarande mening i klartext. */
  detail: string;
  /** Tone-token för kortet. */
  tone: "green" | "purple" | "pink" | "orange" | "blue" | "yellow";
  /** Hur många dagar samband byggdes på (per grupp). */
  sample: { high: number; low: number };
  /** Snittvärden för "hög/ja" vs "låg/nej". Visas som badge. */
  values: { highLabel: string; highValue: string; lowLabel: string; lowValue: string };
  /** Delta i klartext — alltid skalstegsenhet. */
  deltaLabel: string;
};

type ActivityLite = {
  date: string;
  duration_minutes: number | null;
  semantic_kind: string | null;
  mood_delta: number | null;
};

const mean = (xs: (number | null | undefined)[]): number | null => {
  const v = xs.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
};

const MIN_GROUP = 4;
const MIN_DELTA = 0.6;

/** Bygg dagsindex för aktivitetsdata så vi kan slå upp per dag i O(1). */
const indexByDate = (acts: ActivityLite[]) => {
  const m = new Map<string, ActivityLite[]>();
  for (const a of acts) {
    const cur = m.get(a.date);
    if (cur) cur.push(a);
    else m.set(a.date, [a]);
  }
  return m;
};

/**
 * Slå ihop till en lista av samband sorterad efter styrka (|delta|).
 * Returnerar tomt om för lite data — UI:t visar då en mjuk hint.
 */
export const buildCorrelations = (
  checkins: Checkin[],
  activities: ActivityLite[],
): Correlation[] => {
  const out: Correlation[] = [];
  const actsByDate = indexByDate(activities);

  // 1) Sömn (föregående natt) → dagens lätthet (100 - mood_heaviness*10)
  //    Vi använder sömnen som loggades samma datum som checkinen och
  //    jämför dagar med ≥7h vs <7h.
  {
    const high: number[] = [];
    const low: number[] = [];
    for (const c of checkins) {
      if (c.sleep_hours == null || c.mood_heaviness == null) continue;
      const lightness = 10 - c.mood_heaviness; // högre = lättare
      if (Number(c.sleep_hours) >= 7) high.push(lightness);
      else low.push(lightness);
    }
    if (high.length >= MIN_GROUP && low.length >= MIN_GROUP) {
      const h = mean(high)!;
      const l = mean(low)!;
      const delta = h - l;
      if (Math.abs(delta) >= MIN_DELTA) {
        out.push({
          key: "sleep_to_direction",
          headline: delta > 0 ? "Mer sömn → lättare dag" : "Mer sömn → tyngre dag",
          detail: delta > 0
            ? `När du sover ≥7h känns dagen i snitt ${delta.toFixed(1)} skalsteg lättare än korta nätter.`
            : `Oväntat: nätter ≥7h har följts av tyngre dagar (${Math.abs(delta).toFixed(1)} skalsteg). Värt att märka.`,
          tone: "purple",
          sample: { high: high.length, low: low.length },
          values: {
            highLabel: "≥7h sömn",
            highValue: `${h.toFixed(1)}`,
            lowLabel: "<7h sömn",
            lowValue: `${l.toFixed(1)}`,
          },
          deltaLabel: `${delta > 0 ? "+" : ""}${delta.toFixed(1)} skalsteg`,
        });
      }
    }
  }

  // 2) Rörelse-dag → energi samma dag
  {
    const moved: number[] = [];
    const still: number[] = [];
    for (const c of checkins) {
      if (c.energy == null) continue;
      const actsToday = actsByDate.get(c.date) ?? [];
      const movedToday =
        c.movement_today === "yes" ||
        actsToday.some((a) => a.semantic_kind === "rorelse" && (a.duration_minutes ?? 0) >= 10);
      if (movedToday) moved.push(c.energy);
      else if (c.movement_today === "none") still.push(c.energy);
    }
    if (moved.length >= MIN_GROUP && still.length >= MIN_GROUP) {
      const h = mean(moved)!;
      const l = mean(still)!;
      const delta = h - l;
      if (Math.abs(delta) >= MIN_DELTA) {
        out.push({
          key: "movement_to_mood",
          headline: delta > 0 ? "Rörelse → mer energi" : "Rörelse → mindre energi",
          detail: delta > 0
            ? `Dagar du rört på dig har du i snitt ${delta.toFixed(1)} skalsteg mer energi.`
            : `Rörelsedagar har inte gett extra energi den här månaden — kanske för intensiv form?`,
          tone: "pink",
          sample: { high: moved.length, low: still.length },
          values: {
            highLabel: "Rörde dig",
            highValue: `${h.toFixed(1)}`,
            lowLabel: "Stilla",
            lowValue: `${l.toFixed(1)}`,
          },
          deltaLabel: `${delta > 0 ? "+" : ""}${delta.toFixed(1)} skalsteg`,
        });
      }
    }
  }

  // 3) Meningsfull aktivitet → energi
  {
    const yes: number[] = [];
    const no: number[] = [];
    for (const c of checkins) {
      if (c.energy == null) continue;
      if (c.meaningful_activity === "yes") yes.push(c.energy);
      else if (c.meaningful_activity === "none") no.push(c.energy);
    }
    if (yes.length >= MIN_GROUP && no.length >= MIN_GROUP) {
      const h = mean(yes)!;
      const l = mean(no)!;
      const delta = h - l;
      if (Math.abs(delta) >= MIN_DELTA) {
        out.push({
          key: "meaningful_to_energy",
          headline: delta > 0 ? "Mening → mer energi" : "Mening → mindre energi",
          detail: delta > 0
            ? `Dagar med något meningsfullt har gett ${delta.toFixed(1)} skalsteg mer energi i snitt.`
            : `Meningsdagar har inte gett extra energi — det kan vara värt att vila utan krav också.`,
          tone: "yellow",
          sample: { high: yes.length, low: no.length },
          values: {
            highLabel: "Mening",
            highValue: `${h.toFixed(1)}`,
            lowLabel: "Inget särskilt",
            lowValue: `${l.toFixed(1)}`,
          },
          deltaLabel: `${delta > 0 ? "+" : ""}${delta.toFixed(1)} skalsteg`,
        });
      }
    }
  }

  // 4) Mycket stilla tid (säng/soffa ≥120 min) → tyngd samma dag
  {
    const stillHi: number[] = [];
    const stillLo: number[] = [];
    for (const c of checkins) {
      if (c.daytime_bed_sofa_time_minutes == null || c.mood_heaviness == null) continue;
      if (c.daytime_bed_sofa_time_minutes >= 120) stillHi.push(c.mood_heaviness);
      else if (c.daytime_bed_sofa_time_minutes <= 30) stillLo.push(c.mood_heaviness);
    }
    if (stillHi.length >= MIN_GROUP && stillLo.length >= MIN_GROUP) {
      const h = mean(stillHi)!;
      const l = mean(stillLo)!;
      const delta = h - l; // positivt = mer tyngd på stilla-dagar
      if (Math.abs(delta) >= MIN_DELTA) {
        out.push({
          key: "stillness_to_heaviness",
          headline: delta > 0 ? "Mycket stilla → tyngre" : "Mycket stilla → lättare",
          detail: delta > 0
            ? `Dagar med ≥2h stilla tid har varit ${delta.toFixed(1)} skalsteg tyngre i snitt.`
            : `Stilla dagar har faktiskt känts lite lättare — vila gör jobbet.`,
          tone: delta > 0 ? "orange" : "green",
          sample: { high: stillHi.length, low: stillLo.length },
          values: {
            highLabel: "≥2h stilla",
            highValue: `${h.toFixed(1)}`,
            lowLabel: "≤30 min",
            lowValue: `${l.toFixed(1)}`,
          },
          deltaLabel: `${delta > 0 ? "+" : ""}${delta.toFixed(1)} skalsteg`,
        });
      }
    }
  }

  // Sortera efter styrka (absolut delta) — mest tydliga samband först.
  out.sort((a, b) => {
    const da = Math.abs(parseFloat(a.deltaLabel));
    const db = Math.abs(parseFloat(b.deltaLabel));
    return db - da;
  });

  return out.slice(0, 4);
};
