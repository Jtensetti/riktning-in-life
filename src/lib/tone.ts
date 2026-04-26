// Adaptiv ton för rubriker på Today.
// "tender" = mjukare, lägger inga krav. "steady" = stabilt och uppmuntrande.
// "energized" = lite mer framåtlutad, för dagar då användaren har resurser.

import type { PersonalThresholds } from "./baseline";

export type Tone = "tender" | "steady" | "energized";

type ToneInput = {
  mood_heaviness: number | null;
  anxiety: number | null;
  energy: number | null;
  function_score: number | null;
  sleep_hours: number | null;
  safety_status: string | null;
};

/** Härled tonen utifrån dagens checkin (eller fallback om saknas). */
export const getToneFor = (c: ToneInput | null, t: PersonalThresholds): Tone => {
  if (!c) return "steady";
  // Säkerhet trumfar allt — håll mjukast möjliga ton.
  if (c.safety_status === "active_thoughts" || c.safety_status === "acute") return "tender";

  const heavy = c.mood_heaviness != null && c.mood_heaviness >= t.highMood;
  const anxious = c.anxiety != null && c.anxiety >= t.highAnxiety;
  const tired = c.sleep_hours != null && Number(c.sleep_hours) < t.shortSleep;
  const lowEnergy = c.energy != null && c.energy <= t.lowEnergy;
  const lowFn = c.function_score != null && c.function_score <= 3;

  // Två eller fler tunga signaler → tender.
  const tenderSignals = [heavy, anxious, tired, lowEnergy, lowFn].filter(Boolean).length;
  if (tenderSignals >= 2) return "tender";
  if (tenderSignals === 1 && (heavy || anxious)) return "tender";

  const goodSleep = c.sleep_hours != null && Number(c.sleep_hours) >= 7;
  const goodEnergy = c.energy != null && c.energy >= 7;
  const lightMood = c.mood_heaviness != null && c.mood_heaviness <= 3;
  const goodFn = c.function_score != null && c.function_score >= 7;
  const energizedSignals = [goodSleep, goodEnergy, lightMood, goodFn].filter(Boolean).length;
  if (energizedSignals >= 2) return "energized";

  return "steady";
};

/** Liten ord-lookup så Today-copyn kan variera utan att vi kopierar den. */
export type Phrasebook = {
  /** Knapp-CTA: "Logga dagen" / "Uppdatera dagen". */
  ctaLog: string;
  ctaUpdate: string;
  /** Mjuk inledningsrad ovanför state-rubriken. */
  whisper: string;
};

export const phrasebookFor = (tone: Tone): Phrasebook => {
  switch (tone) {
    case "tender":
      return {
        ctaLog: "Hur har du det? — mjukt",
        ctaUpdate: "Uppdatera mjukt",
        whisper: "Idag räcker det att andas.",
      };
    case "steady":
      return {
        ctaLog: "Hur har du det?",
        ctaUpdate: "Uppdatera dagen",
        whisper: "Det här räcker idag.",
      };
    case "energized":
      return {
        ctaLog: "Hur har du det?",
        ctaUpdate: "Uppdatera dagen",
        whisper: "Bra ingång — använd den.",
      };
  }
};
