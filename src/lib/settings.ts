// Inställningar lagras både lokalt (snabb läsning) och i databasen (kontinuitet
// mellan enheter). Setters är fire-and-forget mot servern; läsare är synkrona
// och svarar från lokal cache som fylls vid inloggning av hydrateUserSettings.
import { patchUserSettings } from "./userSettingsSync";

export type Reminders = {
  morning_checkin: boolean;
  evening_journal: boolean;
  weekly_forms: boolean;
};

const REMINDERS_KEY = "riktning_reminders";
const ONBOARDED_KEY = "riktning_onboarded_at";

export const defaultReminders: Reminders = {
  morning_checkin: false,
  evening_journal: false,
  weekly_forms: false,
};

export const loadReminders = (): Reminders => {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    if (!raw) return defaultReminders;
    return { ...defaultReminders, ...JSON.parse(raw) };
  } catch {
    return defaultReminders;
  }
};

export const saveReminders = (r: Reminders) => {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(r));
};

export const isOnboarded = () => !!localStorage.getItem(ONBOARDED_KEY);

export const markOnboarded = () => {
  localStorage.setItem(ONBOARDED_KEY, new Date().toISOString());
};

export const resetOnboarded = () => {
  localStorage.removeItem(ONBOARDED_KEY);
};

// ─────────────────────────────────────────────────────────────
// Action preferences — styr personalisering av "Föreslagna handlingar".
// Auto = härled från tid på dygnet just nu (default).
// ─────────────────────────────────────────────────────────────

export type PreferredTime = "auto" | "morning" | "day" | "evening";
export type PreferredLength = "auto" | "short" | "medium" | "long";

export type ActionPreferences = {
  time: PreferredTime;
  length: PreferredLength;
};

const ACTION_PREFS_KEY = "riktning_action_prefs";

export const defaultActionPreferences: ActionPreferences = {
  time: "auto",
  length: "auto",
};

export const loadActionPreferences = (): ActionPreferences => {
  try {
    const raw = localStorage.getItem(ACTION_PREFS_KEY);
    if (!raw) return defaultActionPreferences;
    return { ...defaultActionPreferences, ...JSON.parse(raw) };
  } catch {
    return defaultActionPreferences;
  }
};

export const saveActionPreferences = (p: ActionPreferences) => {
  localStorage.setItem(ACTION_PREFS_KEY, JSON.stringify(p));
};

/** Översätt "auto" till en konkret bucket utifrån tid på dygnet. */
export const resolvePreferredTime = (pref: PreferredTime, hour: number): "morning" | "day" | "evening" => {
  if (pref !== "auto") return pref;
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "day";
  return "evening";
};

/** Översätt "auto" till längd-bucket utifrån tid på dygnet (sent → kortare). */
export const resolvePreferredLength = (pref: PreferredLength, hour: number): "short" | "medium" | "long" => {
  if (pref !== "auto") return pref;
  if (hour >= 21 || hour < 6) return "short";
  if (hour >= 17) return "short";
  return "medium";
};

/** Min/max-minuter för längd-bucket. */
export const lengthRange = (b: "short" | "medium" | "long"): [number, number] => {
  if (b === "short") return [0, 5];
  if (b === "medium") return [6, 12];
  return [13, 60];
};

