/**
 * Veckans playbook (Fas F)
 *
 * Sammanfattar användarens nuvarande riktning och föreslår 3–5 konkreta
 * steg för de kommande 7 dagarna. Helt deterministisk: bygger på
 * Pattern, RiskSignal, ProgressionFact och PersonalEffect som redan
 * existerar i appen. Inga AI-anrop.
 *
 * Regler för urval och prioritering finns i `buildPlaybook` nedan.
 * Vi cappar alltid till 5 steg så listan känns hanterbar.
 */

import type { Pattern } from "./patterns";
import type { RiskSignal } from "./riskSignals";
import type { ProgressionFact } from "./progression";
import type { PersonalEffect } from "./personalEffect";
import { topLifters } from "./personalEffect";

export type PlaybookDirection = {
  /** En kort mening om vart riktningen pekar. */
  headline: string;
  /** Valfri underrad — siffrorna bakom. */
  sub?: string;
  tone: "good" | "neutral" | "warn";
};

export type PlaybookStep = {
  /** Stabilt id så React kan key:a och vi kan deduplicera. */
  id: string;
  /** Verb-lett titel — vad användaren ska göra. */
  title: string;
  /** Varför just det här steget — kort, från egna data. */
  why: string;
  /** Minsta möjliga första steg ("ikväll", "imorgon morgon"). */
  micro: string;
  /** Sortering: lägre = visas högre upp. */
  priority: number;
  tone: "alert" | "warn" | "info" | "good";
};

export type WeeklyPlaybook = {
  direction: PlaybookDirection;
  steps: PlaybookStep[];
};

export type BuildPlaybookInput = {
  patterns: Pattern[];
  risks: RiskSignal[];
  progression: ProgressionFact[];
  personalEffect?: PersonalEffect;
  /** Senaste check-in (idag eller igår) — används för "låg energi" osv. */
  recentCheckin?: {
    anxiety: number | null;
    energy: number | null;
    mood_heaviness: number | null;
    sleep_hours: number | null;
  } | null;
  /** Antal check-ins senaste 14 dagar — styr om vi visar logg-vana-steg. */
  recentCheckinDays?: number;
};

// ─────────────────────────────────────────────────────────────
// Direction
// ─────────────────────────────────────────────────────────────

const buildDirection = (
  progression: ProgressionFact[],
  patterns: Pattern[],
  risks: RiskSignal[],
): PlaybookDirection => {
  const alert = risks.find((r) => r.severity === "alert");
  if (alert) {
    return {
      headline: "Riktningen kräver omsorg just nu",
      sub: alert.headline,
      tone: "warn",
    };
  }
  const shift = progression.find((f) => f.kind === "baseline_shift");
  if (shift) {
    return {
      headline:
        shift.tone === "good"
          ? "Det rör sig åt rätt håll"
          : "Riktningen är tyngre än innan",
      sub: `${shift.label}: ${shift.value}`,
      tone: shift.tone,
    };
  }
  const trendUp = patterns.find((p) => p.kind === "trend_shift_up");
  if (trendUp) {
    return { headline: "Tydlig lyftning senaste veckorna", sub: trendUp.evidence, tone: "good" };
  }
  const trendDown = patterns.find((p) => p.kind === "trend_shift_down");
  if (trendDown) {
    return { headline: "Tyngre dagar än innan", sub: trendDown.evidence, tone: "warn" };
  }
  const streak = progression.find((f) => f.kind === "streak");
  if (streak) {
    return { headline: "Du bygger en stadig vana", sub: `${streak.label}: ${streak.value}`, tone: "good" };
  }
  return {
    headline: "Vi bygger underlag tillsammans",
    sub: "Några dagar till med data så ser vi riktningen tydligare.",
    tone: "neutral",
  };
};

// ─────────────────────────────────────────────────────────────
// Steps
// ─────────────────────────────────────────────────────────────

const dedupeById = (steps: PlaybookStep[]): PlaybookStep[] => {
  const seen = new Set<string>();
  const out: PlaybookStep[] = [];
  for (const s of steps) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    out.push(s);
  }
  return out;
};

const buildSteps = (input: BuildPlaybookInput): PlaybookStep[] => {
  const steps: PlaybookStep[] = [];
  const { patterns, risks, personalEffect, recentCheckin, recentCheckinDays = 0 } = input;

  // 1) Risksignaler → högsta prio
  const safety = risks.find((r) => r.kind === "safety_concern_repeated");
  const hopeless = risks.find((r) => r.kind === "hopelessness_rising");
  if (safety || hopeless) {
    steps.push({
      id: "risk-care",
      title: "Hör av dig till din vårdkontakt",
      why: (safety ?? hopeless)!.evidence,
      micro: "Öppna krisplanen och skicka ett kort meddelande idag.",
      priority: 0,
      tone: "alert",
    });
  }

  const adherence = risks.find((r) => r.kind === "adherence_drop");
  if (adherence) {
    steps.push({
      id: "med-adherence",
      title: "Återta medicinrutinen i 7 dagar",
      why: adherence.evidence,
      micro: "Sätt en påminnelse vid samma tid varje dag — ikväll räcker.",
      priority: 1,
      tone: "warn",
    });
  }

  const sideFx = risks.find((r) => r.kind === "side_effects_severe");
  if (sideFx) {
    steps.push({
      id: "side-effects",
      title: "Notera biverkningar inför nästa besök",
      why: sideFx.evidence,
      micro: "Lägg en kort journalrad direkt efter dagens dos.",
      priority: 2,
      tone: "warn",
    });
  }

  // 2) Top-lifter — bygg på det som faktiskt funkar
  if (personalEffect) {
    const top = topLifters(personalEffect, 1)[0];
    if (top) {
      const verb =
        top.metric === "anxiety"
          ? "sänker oro"
          : top.metric === "energy"
            ? "höjer energi"
            : "lyfter måendet";
      steps.push({
        id: `lifter-${top.key}`,
        title: `Gör ${top.key} tre gånger`,
        why: `${verb} ~${Math.abs(top.avgDelta).toFixed(1)} av 10 hos dig (${top.count} ${top.count === 1 ? "gång" : "ggr"}).`,
        micro: "Boka in tre korta pass i veckan — t.ex. mån, ons, lör.",
        priority: 3,
        tone: "good",
      });
    }
  }

  // 3) Mönsterstyrda steg
  const sleepPattern = patterns.find((p) => p.kind === "sleep_next_day_anxiety");
  if (sleepPattern) {
    steps.push({
      id: "sleep-window",
      title: "Lägg dig 30 minuter tidigare fyra nätter",
      why: sleepPattern.evidence,
      micro: "Sätt en wind-down-påminnelse 21:30 ikväll.",
      priority: 4,
      tone: "info",
    });
  }

  const stillness = patterns.find((p) => p.kind === "stillness_heaviness");
  const lowEnergy = (recentCheckin?.energy ?? 5) <= 3;
  if (stillness || lowEnergy) {
    steps.push({
      id: "movement-mwf",
      title: "Lägg in 10 minuter rörelse mån/ons/fre",
      why: stillness?.evidence ?? "Energi runt 3/10 senaste dagarna — små rörelseblock brukar lyfta dig.",
      micro: "Lägg ut promenadkläderna ikväll så blir morgonen lättare.",
      priority: 5,
      tone: "info",
    });
  }

  const weather = patterns.find((p) => p.kind === "weather_sensitivity");
  if (weather && weather.direction === "negative") {
    steps.push({
      id: "weather-plan",
      title: "Planera en inomhus-lyftare på tunga väderdagar",
      why: weather.evidence,
      micro: "Spara en favoritövning så den finns när vädret slår om.",
      priority: 6,
      tone: "info",
    });
  }

  // 4) Loggvana om vi har för lite data
  const dataGap = risks.find((r) => r.kind === "data_gap");
  if (dataGap || recentCheckinDays < 5) {
    steps.push({
      id: "checkin-habit",
      title: "Gör morgon-incheckning fem dagar",
      why: dataGap?.evidence ?? `Endast ${recentCheckinDays} av senaste 14 dagar loggade — mönstren behöver mer data.`,
      micro: "Koppla den till morgonkaffet — 30 sekunder räcker.",
      priority: 7,
      tone: "info",
    });
  }

  // 5) Variation — prova något nytt om personalEffect är tunt
  const variety = personalEffect
    ? Object.keys(personalEffect.exerciseMood.byExerciseTitle ?? {}).length +
      Object.keys(personalEffect.exerciseAnxiety.byExerciseTitle ?? {}).length
    : 0;
  if (variety > 0 && variety < 3) {
    steps.push({
      id: "explore-new",
      title: "Prova en ny övning från Utforska",
      why: `Du har testat ${variety} ${variety === 1 ? "övning" : "övningar"} med data — fler ger bättre koll på vad som funkar.`,
      micro: "Öppna Utforska och spara en favorit på 10 sekunder.",
      priority: 8,
      tone: "info",
    });
  }

  return dedupeById(steps)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5);
};

// ─────────────────────────────────────────────────────────────
// Publik API
// ─────────────────────────────────────────────────────────────

export const buildPlaybook = (input: BuildPlaybookInput): WeeklyPlaybook => ({
  direction: buildDirection(input.progression, input.patterns, input.risks),
  steps: buildSteps(input),
});
