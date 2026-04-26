// Today-modulväljare: deterministisk regel-motor som svarar på frågan
// "vilka block ska visas, i vilken ordning, just nu?".
//
// Mål från briefen:
//   - Max 5 synliga block innan scroll
//   - En primär handling
//   - Max 2 sekundära rekommendationer
//   - Dölj irrelevant
//
// Vi rör inte rendering-logiken — Today.tsx mappar dessa ModuleId:n till JSX.
// Allt här är ren funktion → enkelt testbart.

import type { TimeContext, PartOfDay } from "./timeContext";

export type ModuleId =
  | "safety"            // röd kris-kort
  | "weatherPermission" // engångskort om plats inte beviljats
  | "returneeNote"      // "Välkommen tillbaka" om frånvaro 3+ dagar
  | "streak"            // StreakRing
  | "eveningWindDown"   // "Stäng dagen mjukt"-kort när inget loggat på kvällen
  | "state"             // huvud-stateCard (alltid)
  | "quickStarts"       // 3 mikro-chips när !checkin (under state)
  | "baselineProgress"  // "Dag X av 14"-kompakt rad
  | "quickLog"          // QuickLogPills
  | "primary"           // "Rekommenderat just nu" (gamla rec-kortet)
  | "forYou"            // ForYouCarousel (3 picks)
  | "eveningPrediction" // EveningPredictionCard
  | "forecast"          // TomorrowForecastCard + ForecastEvidenceStrip
  | "todayRoutine"      // sequence-kort
  | "reportShortcut"    // klinisk veckorapport-genväg
  | "learn"             // featured article
  | "weekDirection"     // 3 InsightCards
  | "latestActivity";   // tidslinjen längst ner

export type TodayContext = {
  hasCheckin: boolean;
  partOfDay: PartOfDay;
  safetyFlag: boolean;
  daysSinceLastSeen: number | null;
  baselineDays: number;        // antal dagar med data, capped behövs ej
  baselineReady: boolean;      // ≥ 14 dagar
  hasInsights: boolean;        // ≥4 dagar med data senaste 7
  hasPicks: boolean;
  hasEveningPrediction: boolean;
  hasForecast: boolean;
  hasTodayRoutine: boolean;
  hasFeaturedArticle: boolean;
  hasRecentActivity: boolean;
  hasWeather: boolean;
  showWeatherPermission: boolean;
  reportShortcutDue: boolean;  // PHQ/GAD due ELLER ≥7d data utan recent export ELLER safety flagga senaste 7d
  activitiesToday: number;
};

export type LayoutDecision = {
  modules: ModuleId[];
  /** För debug/test — säger varför vissa block valdes/utelämnades. */
  notes: string[];
};

const SAFETY_LAYOUT = (ctx: TodayContext): LayoutDecision => {
  // Säkerhetsläge: bara det livsviktiga. Inga rekommendationer, inget brus.
  const modules: ModuleId[] = ["safety", "state", "quickLog"];
  return {
    modules,
    notes: ["safety-mode: hides all recommendations and secondary content"],
  };
};

export const decideTodayLayout = (ctx: TodayContext): LayoutDecision => {
  if (ctx.safetyFlag) return SAFETY_LAYOUT(ctx);

  const notes: string[] = [];
  const out: ModuleId[] = [];

  // --- Toppblock som alltid kan komma först ---
  if (ctx.showWeatherPermission) out.push("weatherPermission");

  // Returnee-mikrokort innan state om frånvaro 3+ dagar
  if (ctx.daysSinceLastSeen != null && ctx.daysSinceLastSeen >= 3) {
    out.push("returneeNote");
    notes.push(`returnee: ${ctx.daysSinceLastSeen}d`);
  }

  out.push("streak");

  // Kvällsläge utan check-in: lyft fram "Stäng dagen mjukt" istället för full prompt
  const isEvening = ctx.partOfDay === "evening" || ctx.partOfDay === "night";
  if (!ctx.hasCheckin && isEvening) {
    out.push("eveningWindDown");
    notes.push("evening wind-down (no checkin)");
  }

  // --- State-kortet är alltid med ---
  out.push("state");

  // Mikro-chips bara när !checkin (snabb start, time-of-day specifik)
  if (!ctx.hasCheckin) {
    out.push("quickStarts");
    notes.push(`quickStarts for ${ctx.partOfDay}`);
  }

  // Baseline-progress under state OM baslinjen inte är klar än
  if (!ctx.baselineReady && ctx.baselineDays > 0) {
    out.push("baselineProgress");
    notes.push(`baseline ${ctx.baselineDays}/14`);
  }

  out.push("quickLog");

  // --- Sekundär-budget ---
  // Reglerna i briefen: max 2 sekundära rekommendationer.
  // Prioritet: eveningPrediction > forecast > todayRoutine > forYou > reportShortcut > learn
  // Med specialfall:
  //   - forYou är "primary" om vi har picks och ingen check-in finns ännu (då blir den primär).
  //   - Om !checkin: göm weekDirection, learn, todayRoutine.

  const SECONDARY_BUDGET = 2;
  let used = 0;

  // Primär: visa "rekommenderat just nu"-kortet alltid (det är vår primära handling).
  out.push("primary");

  const tryAdd = (id: ModuleId, available: boolean, why?: string): boolean => {
    if (!available) return false;
    if (used >= SECONDARY_BUDGET) {
      notes.push(`skip ${id}: secondary budget full`);
      return false;
    }
    out.push(id);
    used++;
    if (why) notes.push(`add ${id}: ${why}`);
    return true;
  };

  // Sekundär 1: eveningPrediction har högst prioritet om den finns
  tryAdd("eveningPrediction", ctx.hasEveningPrediction, "evening signal present");
  // Sekundär 2: forecast om vi inte redan tagit eveningPrediction
  if (!ctx.hasEveningPrediction) tryAdd("forecast", ctx.hasForecast, "tomorrow forecast confident");

  // forYou-karusellen — bara om check-in finns (innan dess är fokus "logga dagen")
  tryAdd("forYou", ctx.hasCheckin && ctx.hasPicks, "personalized picks");

  // Dagens rutin matchar partOfDay (vi har redan filtrerat i query)
  tryAdd("todayRoutine", ctx.hasCheckin && ctx.hasTodayRoutine, "matches part of day");

  // reportShortcut: bara när relevant (dagsfärsk export ⇒ inget kort)
  tryAdd("reportShortcut", ctx.reportShortcutDue, "report due");

  // learn: lägst prioritet, bara om budget kvar OCH check-in finns
  tryAdd("learn", ctx.hasCheckin && ctx.hasFeaturedArticle, "featured article");

  // --- Botten: weekDirection bara om baslinjen är "byggd nog" (≥4 dagar) OCH check-in finns ---
  if (ctx.hasCheckin && ctx.hasInsights) {
    out.push("weekDirection");
  } else {
    notes.push("hide weekDirection: not enough data yet or no check-in");
  }

  if (ctx.hasRecentActivity) {
    out.push("latestActivity");
  }

  return { modules: out, notes };
};
