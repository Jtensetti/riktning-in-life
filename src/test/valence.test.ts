import { describe, it, expect } from "vitest";
import {
  directionOf,
  improvementSign,
  isImprovement,
  formatDelta,
  summarizeEffect,
} from "@/lib/valence";

describe("valence — directionOf", () => {
  it("flags lower-better metrics correctly", () => {
    expect(directionOf("anxiety")).toBe("lower-better");
    expect(directionOf("mood_heaviness")).toBe("lower-better");
    expect(directionOf("side_effect_severity")).toBe("lower-better");
  });
  it("flags higher-better metrics correctly", () => {
    expect(directionOf("energy")).toBe("higher-better");
    expect(directionOf("mood")).toBe("higher-better");
    expect(directionOf("function_score")).toBe("higher-better");
  });
  it("falls back to neutral for unknown metrics", () => {
    expect(directionOf("something_unknown")).toBe("neutral");
  });
});

describe("valence — improvement detection", () => {
  it("treats decrease in anxiety as improvement", () => {
    expect(improvementSign("anxiety", -2)).toBe(1);
    expect(isImprovement("anxiety", 6, 4)).toBe("better");
  });
  it("treats increase in anxiety as worsening", () => {
    expect(improvementSign("anxiety", 2)).toBe(-1);
    expect(isImprovement("anxiety", 4, 6)).toBe("worse");
  });
  it("treats increase in energy as improvement", () => {
    expect(improvementSign("energy", 2)).toBe(1);
    expect(isImprovement("energy", 3, 5)).toBe("better");
  });
  it("treats decrease in energy as worsening", () => {
    expect(improvementSign("energy", -1)).toBe(-1);
    expect(isImprovement("energy", 5, 4)).toBe("worse");
  });
  it("returns same when no change", () => {
    expect(isImprovement("anxiety", 5, 5)).toBe("same");
    expect(improvementSign("energy", 0)).toBe(0);
  });
});

describe("valence — formatDelta", () => {
  it("formats anxiety drop as good with unicode minus", () => {
    const d = formatDelta("anxiety", 6, 4);
    expect(d.text).toBe("−2");
    expect(d.tone).toBe("good");
    expect(d.arrow).toBe("down");
  });
  it("formats energy rise as good with plus", () => {
    const d = formatDelta("energy", 3, 5);
    expect(d.text).toBe("+2");
    expect(d.tone).toBe("good");
    expect(d.arrow).toBe("up");
  });
  it("formats anxiety rise as bad", () => {
    const d = formatDelta("anxiety", 3, 5);
    expect(d.tone).toBe("bad");
    expect(d.arrow).toBe("up");
  });
  it("formats no change as neutral flat", () => {
    const d = formatDelta("anxiety", 4, 4);
    expect(d.text).toBe("0");
    expect(d.tone).toBe("neutral");
    expect(d.arrow).toBe("flat");
  });
});

describe("valence — summarizeEffect", () => {
  it("computes mean delta and improved share", () => {
    const r = summarizeEffect("anxiety", [
      { before: 7, after: 5 }, // -2 better
      { before: 6, after: 4 }, // -2 better
      { before: 5, after: 6 }, //  +1 worse
      { before: 4, after: 4 }, //   0 same
    ]);
    expect(r).not.toBeNull();
    expect(r!.n).toBe(4);
    expect(r!.meanDelta).toBe(-0.7); // -3/4 = -0.75 → JS Math.round → -0.7
    expect(r!.improvedShare).toBe(0.5);
  });
  it("returns null when no valid pairs", () => {
    expect(summarizeEffect("anxiety", [{ before: null, after: 5 }])).toBeNull();
  });
});
