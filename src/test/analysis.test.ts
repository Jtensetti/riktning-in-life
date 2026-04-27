import { describe, it, expect } from "vitest";
import { buildMetricTrends, overallVerdict, loggedDaysLastWeek } from "@/lib/analysis";
import type { Checkin } from "@/lib/metrics";

const isoDaysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

const mkCheckin = (n: number, patch: Partial<Checkin>): Checkin => ({
  id: `c-${n}`,
  date: isoDaysAgo(n),
  mood_heaviness: null, anxiety: null, guilt_selfcriticism: null, hopelessness: null,
  energy: null, getting_started: null, function_score: null,
  daytime_bed_sofa_time_minutes: null, sleep_hours: null, sleep_quality: null,
  movement_today: null, meaningful_activity: null, safety_status: null,
  ...patch,
});

describe("analysis — buildMetricTrends", () => {
  it("flags lower anxiety as better with green tone", () => {
    const checkins: Checkin[] = [
      // föregående vecka (dag 8-13): hög oro
      ...[8, 9, 10, 11, 12, 13].map((d) => mkCheckin(d, { anxiety: 7 })),
      // denna vecka (dag 0-6): lägre oro
      ...[0, 1, 2, 3, 4, 5].map((d) => mkCheckin(d, { anxiety: 4 })),
    ];
    const trends = buildMetricTrends(checkins);
    const oro = trends.find((t) => t.meta.metric === "anxiety")!;
    expect(oro.movement).toBe("better");
    expect(oro.delta?.tone).toBe("good");
    expect(oro.verdict).toMatch(/mindre oro/i);
  });

  it("flags higher energy as better", () => {
    const checkins: Checkin[] = [
      ...[8, 9, 10, 11, 12, 13].map((d) => mkCheckin(d, { energy: 3 })),
      ...[0, 1, 2, 3, 4, 5].map((d) => mkCheckin(d, { energy: 6 })),
    ];
    const trends = buildMetricTrends(checkins);
    const energi = trends.find((t) => t.meta.metric === "energy")!;
    expect(energi.movement).toBe("better");
    expect(energi.verdict).toMatch(/högre/i);
  });

  it("treats small change as stable", () => {
    const checkins: Checkin[] = [
      ...[8, 9, 10, 11, 12, 13].map((d) => mkCheckin(d, { anxiety: 5 })),
      ...[0, 1, 2, 3, 4, 5].map((d) => mkCheckin(d, { anxiety: 5.2 })),
    ];
    const trends = buildMetricTrends(checkins);
    expect(trends.find((t) => t.meta.metric === "anxiety")!.movement).toBe("stable");
  });

  it("returns unknown verdict when one week has no data", () => {
    const checkins: Checkin[] = [0, 1, 2, 3, 4, 5].map((d) => mkCheckin(d, { anxiety: 4 }));
    const trends = buildMetricTrends(checkins);
    expect(trends.find((t) => t.meta.metric === "anxiety")!.movement).toBe("unknown");
  });

  it("counts movement days where yes=1, little=0.5", () => {
    const checkins: Checkin[] = [
      ...[8, 9, 10, 11, 12, 13].map((d) => mkCheckin(d, { movement_today: "none" })),
      ...[0, 1, 2].map((d) => mkCheckin(d, { movement_today: "yes" })),
      ...[3, 4].map((d) => mkCheckin(d, { movement_today: "little" })),
    ];
    const t = buildMetricTrends(checkins).find((x) => x.meta.metric === "movement")!;
    expect(t.movement).toBe("better");
  });
});

describe("analysis — overallVerdict", () => {
  it("returns sparse-data headline when fewer than 3 logged days", () => {
    const checkins: Checkin[] = [0, 1].map((d) => mkCheckin(d, { anxiety: 5 }));
    const trends = buildMetricTrends(checkins);
    const v = overallVerdict(trends, loggedDaysLastWeek(checkins));
    expect(v.headline).toMatch(/mer data/i);
  });

  it("highlights improving metrics when most go right way", () => {
    const checkins: Checkin[] = [
      ...[8, 9, 10, 11, 12, 13].map((d) => mkCheckin(d, { anxiety: 7, energy: 3 })),
      ...[0, 1, 2, 3, 4, 5].map((d) => mkCheckin(d, { anxiety: 4, energy: 6 })),
    ];
    const trends = buildMetricTrends(checkins);
    const v = overallVerdict(trends, loggedDaysLastWeek(checkins));
    expect(v.headline).toMatch(/rätt håll/i);
    expect(v.better).toBeGreaterThanOrEqual(2);
  });
});
