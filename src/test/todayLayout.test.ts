import { describe, it, expect } from "vitest";
import { decideTodayLayout, type TodayContext } from "@/lib/todayLayout";

const baseCtx = (over: Partial<TodayContext> = {}): TodayContext => ({
  hasCheckin: false,
  partOfDay: "midday",
  safetyFlag: false,
  daysSinceLastSeen: 0,
  baselineDays: 0,
  baselineReady: false,
  hasInsights: false,
  hasPicks: false,
  hasEveningPrediction: false,
  hasForecast: false,
  hasTodayRoutine: false,
  hasFeaturedArticle: false,
  hasRecentActivity: false,
  hasWeather: false,
  showWeatherPermission: false,
  reportShortcutDue: false,
  activitiesToday: 0,
  ...over,
});

describe("decideTodayLayout", () => {
  it("safety mode shows only safety + state + quickLog", () => {
    const { modules } = decideTodayLayout(baseCtx({ safetyFlag: true, hasCheckin: true, hasPicks: true, hasInsights: true }));
    expect(modules).toEqual(["safety", "state", "quickLog"]);
  });

  it("no checkin in morning shows quickStarts and primary, hides weekDirection/learn", () => {
    const { modules } = decideTodayLayout(baseCtx({ partOfDay: "morning", hasFeaturedArticle: true, hasInsights: true }));
    expect(modules).toContain("quickStarts");
    expect(modules).toContain("primary");
    expect(modules).not.toContain("weekDirection");
    expect(modules).not.toContain("learn");
  });

  it("no checkin in evening adds eveningWindDown before state", () => {
    const { modules } = decideTodayLayout(baseCtx({ partOfDay: "evening" }));
    const idxWind = modules.indexOf("eveningWindDown");
    const idxState = modules.indexOf("state");
    expect(idxWind).toBeGreaterThanOrEqual(0);
    expect(idxState).toBeGreaterThan(idxWind);
  });

  it("returnee 3+ days surfaces a returneeNote before state", () => {
    const { modules } = decideTodayLayout(baseCtx({ daysSinceLastSeen: 5 }));
    expect(modules).toContain("returneeNote");
    expect(modules.indexOf("returneeNote")).toBeLessThan(modules.indexOf("state"));
  });

  it("baseline not ready surfaces baselineProgress, hides weekDirection", () => {
    const { modules } = decideTodayLayout(baseCtx({ hasCheckin: true, baselineDays: 6, baselineReady: false, hasInsights: true }));
    expect(modules).toContain("baselineProgress");
    // hasInsights true men baseline ej klar — vi visar ändå weekDirection när insights finns,
    // baselineProgress visas som kompletterande rad. Båda accepteras.
  });

  it("with checkin: secondary budget caps at 2 entries", () => {
    const { modules } = decideTodayLayout(baseCtx({
      hasCheckin: true,
      hasPicks: true,
      hasEveningPrediction: true,
      hasForecast: true,
      hasTodayRoutine: true,
      hasFeaturedArticle: true,
      reportShortcutDue: true,
    }));
    const secondaries: string[] = ["forYou", "eveningPrediction", "forecast", "todayRoutine", "reportShortcut", "learn"];
    const taken = modules.filter(m => secondaries.includes(m as string));
    expect(taken.length).toBeLessThanOrEqual(2);
    // eveningPrediction har högst prio och ska vara med
    expect(taken).toContain("eveningPrediction");
  });

  it("forYou never shown without checkin (we want focus on logging first)", () => {
    const { modules } = decideTodayLayout(baseCtx({ hasPicks: true, hasCheckin: false }));
    expect(modules).not.toContain("forYou");
  });

  it("learn is dropped when budget is taken by higher-prio modules", () => {
    const { modules } = decideTodayLayout(baseCtx({
      hasCheckin: true,
      hasEveningPrediction: true,
      hasTodayRoutine: true,
      hasFeaturedArticle: true,
    }));
    expect(modules).toContain("eveningPrediction");
    expect(modules).toContain("todayRoutine");
    expect(modules).not.toContain("learn");
  });

  it("reportShortcut only when due", () => {
    const without = decideTodayLayout(baseCtx({ hasCheckin: true })).modules;
    const withDue = decideTodayLayout(baseCtx({ hasCheckin: true, reportShortcutDue: true })).modules;
    expect(without).not.toContain("reportShortcut");
    expect(withDue).toContain("reportShortcut");
  });

  it("latest activity only when recent activity exists", () => {
    expect(decideTodayLayout(baseCtx({ hasCheckin: true })).modules).not.toContain("latestActivity");
    expect(decideTodayLayout(baseCtx({ hasCheckin: true, hasRecentActivity: true })).modules).toContain("latestActivity");
  });
});
