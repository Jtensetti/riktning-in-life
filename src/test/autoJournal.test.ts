import { describe, it, expect } from "vitest";
import { buildExerciseJournalDraft, buildActivityJournalDraft } from "@/lib/autoJournal";

describe("autoJournal — exercise drafts", () => {
  it("formats anxiety drop with unicode minus and flags big improvement", () => {
    const d = buildExerciseJournalDraft({
      exerciseTitle: "Andning 4-7-8",
      before: { anxiety: 7, energy: 4, mood: 4 },
      after: { anxiety: 4, energy: 4, mood: 4 },
    });
    expect(d.title).toBe("Andning 4-7-8");
    expect(d.free_text).toContain("oro 7 → 4");
    expect(d.free_text).toContain("−3");
    expect(d.suggested_for_report).toBe(true);
    expect(d.include_in_report).toBe(true);
    expect(d.template_type).toBe("auto_session");
  });

  it("does not flag tiny changes for report", () => {
    const d = buildExerciseJournalDraft({
      exerciseTitle: "Kort paus",
      before: { anxiety: 5, energy: 5, mood: 5 },
      after: { anxiety: 4, energy: 5, mood: 5 },
    });
    expect(d.suggested_for_report).toBe(false);
  });
});

describe("autoJournal — activity drafts", () => {
  it("formats duration + mood delta", () => {
    const d = buildActivityJournalDraft({
      label: "Långpromenad",
      durationMinutes: 45,
      moodDelta: 2,
    });
    expect(d.title).toBe("Långpromenad");
    expect(d.free_text).toContain("45 min");
    expect(d.free_text).toContain("+2");
    expect(d.suggested_for_report).toBe(true);
  });

  it("falls back to neutral copy when no metadata", () => {
    const d = buildActivityJournalDraft({ label: "Något" });
    expect(d.free_text).toMatch(/loggad/i);
    expect(d.suggested_for_report).toBe(false);
  });
});
