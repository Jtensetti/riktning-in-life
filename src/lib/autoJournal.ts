/**
 * Auto-journal — bygger korta svenska sammanfattningar från övningssessioner
 * och aktivitetsloggar, redo att skrivas till `journal_entries` när
 * användarens flagga `auto_journal` är på.
 *
 * Inga sidoeffekter här — funktionerna returnerar bara objekt. Det är
 * anroparen (ExerciseDetail / ActivityPicker) som ansvarar för INSERT mot
 * Supabase. Det gör dem testbara utan att mocka klienten.
 */

import { formatDelta, improvementSign } from "./valence";

export type ExerciseSessionDraftInput = {
  exerciseTitle: string;
  before: { anxiety: number; energy: number; mood: number };
  after: { anxiety: number; energy: number; mood: number };
};

export type ActivityDraftInput = {
  label: string;
  category?: string | null;
  durationMinutes?: number | null;
  moodDelta?: number | null;
};

export type JournalDraft = {
  /** template_type i journal_entries. */
  template_type: "auto_session" | "auto_activity";
  /** Visningsbar titel — visas i journal-listan. */
  title: string;
  /** Brödtext, en mening eller två. */
  free_text: string;
  /** Föreslå för rapport om förändringen är stor (|delta| ≥ 2 skalsteg). */
  suggested_for_report: boolean;
  /** include_in_report — alltid true för auto-journal så det räknas i veckorapport. */
  include_in_report: boolean;
};

const fmtPair = (metric: string, before: number, after: number): string => {
  const d = formatDelta(metric, before, after);
  return `${metric === "anxiety" ? "oro" : metric === "energy" ? "energi" : "mående"} ${before} → ${after} (${d.text})`;
};

/** Bygg en utkast-journalpost från en övningssession. */
export const buildExerciseJournalDraft = (input: ExerciseSessionDraftInput): JournalDraft => {
  const { exerciseTitle, before, after } = input;
  const parts = [
    fmtPair("anxiety", before.anxiety, after.anxiety),
    fmtPair("energy", before.energy, after.energy),
    fmtPair("mood", before.mood, after.mood),
  ];
  // Markera "stor förändring" om någon dimension rörde sig ≥2 åt rätt håll.
  const bigImprovement =
    (improvementSign("anxiety", after.anxiety - before.anxiety) === 1 && Math.abs(after.anxiety - before.anxiety) >= 2) ||
    (improvementSign("energy", after.energy - before.energy) === 1 && Math.abs(after.energy - before.energy) >= 2) ||
    (improvementSign("mood", after.mood - before.mood) === 1 && Math.abs(after.mood - before.mood) >= 2);
  return {
    template_type: "auto_session",
    title: exerciseTitle,
    free_text: parts.join(" · "),
    suggested_for_report: bigImprovement,
    include_in_report: true,
  };
};

/** Bygg en utkast-journalpost från en aktivitetslogg. */
export const buildActivityJournalDraft = (input: ActivityDraftInput): JournalDraft => {
  const { label, durationMinutes, moodDelta } = input;
  const meta: string[] = [];
  if (durationMinutes != null) meta.push(`${durationMinutes} min`);
  if (moodDelta != null) {
    const sign = moodDelta > 0 ? "+" : moodDelta < 0 ? "−" : "";
    const num = Math.abs(moodDelta);
    meta.push(`mående ${sign}${num}`);
  }
  const big = moodDelta != null && Math.abs(moodDelta) >= 2 && moodDelta > 0;
  return {
    template_type: "auto_activity",
    title: label,
    free_text: meta.length ? meta.join(" · ") : "Loggad aktivitet.",
    suggested_for_report: big,
    include_in_report: true,
  };
};
