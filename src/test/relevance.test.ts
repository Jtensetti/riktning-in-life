import { describe, it, expect } from "vitest";
import { scoreRelevance, sortByRelevance } from "@/lib/relevance";
import { getTimeContext } from "@/lib/timeContext";

const baseCtx = {
  ctx: getTimeContext(new Date("2026-04-27T08:00:00Z")), // morgon
  latestCheckin: null,
  history: {},
};

describe("relevance", () => {
  it("scores higher when tag matches dominant pain", () => {
    const withPain = {
      ...baseCtx,
      latestCheckin: {
        date: "2026-04-27",
        anxiety: 8,
        mood_heaviness: 3,
        energy: 5,
        function_score: 5,
        sleep_hours: 7,
      },
    };
    const a = scoreRelevance({ id: "a", tags: ["anxiety"] }, withPain);
    const b = scoreRelevance({ id: "b", tags: ["other"] }, withPain);
    expect(a).toBeGreaterThan(b);
  });

  it("dampens recently shown items", () => {
    const fresh = scoreRelevance({ id: "a" }, baseCtx);
    const recent = scoreRelevance({ id: "a", lastShownSecondsAgo: 60 }, baseCtx);
    expect(recent).toBeLessThan(fresh);
  });

  it("sortByRelevance returns deterministic order", () => {
    const items = [
      { id: "a", tags: ["other"] },
      { id: "b", tags: ["anxiety"] },
    ];
    const ctx = {
      ...baseCtx,
      latestCheckin: {
        date: "2026-04-27",
        anxiety: 9, mood_heaviness: 2, energy: 5, function_score: 5, sleep_hours: 7,
      },
    };
    const sorted = sortByRelevance(items, ctx);
    expect(sorted[0].id).toBe("b");
  });
});
