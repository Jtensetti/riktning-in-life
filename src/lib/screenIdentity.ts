/**
 * Single source of truth for per-screen visual identity.
 *
 * Every screen header, bottom-nav tab and screen title pulls color, icon
 * and "screen question" from here. Do NOT introduce ad-hoc colors or
 * icons in pages — extend this map instead and the rest of the app
 * follows automatically.
 *
 * Color roles (locked, semantic — see plan.md / index.css):
 *   orange  = action, start, primary CTA
 *   yellow  = journal, reflection
 *   purple  = sleep, evening, calming down
 *   blue    = care, report, medication, structure
 *   green   = recovery, function, stability, insights
 *   pink    = movement, social, soft energy, exploration
 *   red     = safety / risk only
 */
import type { IconName } from "@/components/AbstractIcon";

export type ScreenKey =
  | "today"
  | "explore"
  | "log"
  | "insights"
  | "journal"
  | "care"
  | "more"
  | "report";

export interface ScreenIdentity {
  /** HSL token, used as `hsl(var(--…))` background for headers + accents. */
  toneVar: string;
  /** Centered abstract icon for the screen header. */
  icon: IconName;
  /** Short Swedish title shown under the header. */
  title: string;
  /** The single question the screen exists to answer. */
  question: string;
  /** Tailwind color class for active nav state (text + dot). */
  navActiveClass: string;
}

/**
 * Returns the time-of-day tone for the Idag tab.
 * Lila är reserverat för faktiska sömn/insomningsmoduler — inte för
 * hela kvälls/natt-headern. Kvällen får en varm landning, natten en
 * lugn blå.
 *  morning   05–10 → orange-start (start av dagen)
 *  day       10–17 → green-recovery (återhämtning, stabilitet)
 *  evening   17–22 → orange-deep (varm landning)
 *  night     22–05 → blue-calm (lugn, men inte sömn-lila)
 */
export const todayToneVar = (date = new Date()): string => {
  const h = date.getHours();
  if (h >= 5 && h < 10) return "--orange-start";
  if (h >= 10 && h < 17) return "--green-recovery";
  if (h >= 17 && h < 22) return "--orange-deep";
  return "--blue-calm";
};

const BASE: Record<ScreenKey, ScreenIdentity> = {
  today: {
    toneVar: "--orange-start", // overridden at render-time by todayToneVar
    icon: "house-soft",
    title: "Idag",
    question: "Vilket litet steg passar nu?",
    navActiveClass: "text-orange-start",
  },
  explore: {
    toneVar: "--pink-move",
    icon: "spark",
    title: "Utforska",
    question: "Vilken sorts stöd behöver jag?",
    navActiveClass: "text-pink-move",
  },
  log: {
    toneVar: "--orange-start",
    icon: "spark",
    title: "Logga",
    question: "Vad vill jag logga snabbt?",
    navActiveClass: "text-orange-start",
  },
  insights: {
    toneVar: "--green-recovery",
    icon: "pie",
    title: "Insikter",
    question: "Vad visar veckan?",
    navActiveClass: "text-green-recovery",
  },
  journal: {
    toneVar: "--yellow-journal",
    icon: "pencil-soft",
    title: "Journal",
    question: "Vad vill jag skriva?",
    navActiveClass: "text-yellow-journal",
  },
  care: {
    toneVar: "--blue-calm",
    icon: "stethoscope",
    title: "Vård",
    question: "Vad behöver vården veta?",
    navActiveClass: "text-blue-calm",
  },
  more: {
    toneVar: "--cream-card",
    icon: "book-open",
    title: "Mer",
    question: "Vad vill jag ändra?",
    navActiveClass: "text-foreground",
  },
  report: {
    toneVar: "--surface",
    icon: "book-open",
    title: "Rapport",
    question: "Vad har jag att visa vården?",
    navActiveClass: "text-foreground",
  },
};

export const getScreenIdentity = (key: ScreenKey): ScreenIdentity => {
  if (key === "today") {
    return { ...BASE.today, toneVar: todayToneVar() };
  }
  return BASE[key];
};
