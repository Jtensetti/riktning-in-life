// Synkar localStorage-cachade inställningar med databastabellen user_settings.
// Skrivningar går både till localStorage (snabb läsning) och till databasen
// (kontinuitet mellan enheter). Vid första inloggning på en ny enhet hämtas
// servervärdena ner och skriver över lokal cache.
//
// All data är skyddad av Row-Level Security: bara den inloggade användaren
// kan läsa/skriva sin egen rad. Krypterad at-rest (AES-256) och i transit (TLS).

import { supabase } from "@/integrations/supabase/client";
import type { Reminders, ActionPreferences } from "./settings";
import type { PersonalBaseline } from "./baseline";

export type UserSettingsRow = {
  reminders: Reminders;
  onboarded_at: string | null;
  action_prefs: ActionPreferences;
  doctor_email: string | null;
  weekly_questions: string[];
  last_seen_at: string | null;
  baseline: PersonalBaseline | null;
};

const LS_KEYS = {
  reminders: "riktning_reminders",
  onboarded: "riktning_onboarded_at",
  actionPrefs: "riktning_action_prefs",
  doctorEmail: "riktning_doctor_email",
  weeklyQuestions: "riktning_weekly_questions",
  lastSeen: "riktning_last_seen_at",
  baseline: "riktning_personal_baseline",
} as const;

const safeJSON = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
};

/** Läs alla lokala värden som ett objekt — används vid första uppladdning. */
const readLocal = (): Partial<UserSettingsRow> => ({
  reminders: safeJSON<Reminders>(localStorage.getItem(LS_KEYS.reminders)) ?? undefined,
  onboarded_at: localStorage.getItem(LS_KEYS.onboarded) ?? null,
  action_prefs: safeJSON<ActionPreferences>(localStorage.getItem(LS_KEYS.actionPrefs)) ?? undefined,
  doctor_email: localStorage.getItem(LS_KEYS.doctorEmail) ?? null,
  weekly_questions: safeJSON<string[]>(localStorage.getItem(LS_KEYS.weeklyQuestions)) ?? undefined,
  last_seen_at: localStorage.getItem(LS_KEYS.lastSeen) ?? null,
  baseline: safeJSON<PersonalBaseline>(localStorage.getItem(LS_KEYS.baseline)) ?? null,
});

/** Skriv ner ett serversvar i lokal cache så att synkrona getters funkar direkt. */
const writeLocal = (row: UserSettingsRow): void => {
  try {
    localStorage.setItem(LS_KEYS.reminders, JSON.stringify(row.reminders));
    if (row.onboarded_at) localStorage.setItem(LS_KEYS.onboarded, row.onboarded_at);
    else localStorage.removeItem(LS_KEYS.onboarded);
    localStorage.setItem(LS_KEYS.actionPrefs, JSON.stringify(row.action_prefs));
    if (row.doctor_email) localStorage.setItem(LS_KEYS.doctorEmail, row.doctor_email);
    else localStorage.removeItem(LS_KEYS.doctorEmail);
    localStorage.setItem(LS_KEYS.weeklyQuestions, JSON.stringify(row.weekly_questions));
    if (row.last_seen_at) localStorage.setItem(LS_KEYS.lastSeen, row.last_seen_at);
    if (row.baseline) localStorage.setItem(LS_KEYS.baseline, JSON.stringify(row.baseline));
  } catch { /* quota — ignorera */ }
  // Notifiera UI:t att synkad serverdata nu finns i cachen — komponenter som
  // läser via synkrona getters kan då tvinga omläsning utan att veta att de
  // låg på en ny enhet.
  try {
    window.dispatchEvent(new CustomEvent("riktning:settings-hydrated", { detail: row }));
  } catch { /* SSR-säkerhet — ignorera */ }
};

/** Event som fires när serverdata har skrivits till lokal cache. */
export const SETTINGS_HYDRATED_EVENT = "riktning:settings-hydrated";

/**
 * Anropas en gång efter inloggning. Hämtar serverraden, skapar den om den
 * saknas (fyllt med ev. lokala värden), och uppdaterar lokal cache.
 */
export const hydrateUserSettings = async (userId: string): Promise<UserSettingsRow | null> => {
  const { data, error } = await supabase
    .from("user_settings")
    .select("reminders,onboarded_at,action_prefs,doctor_email,weekly_questions,last_seen_at,baseline")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return null;

  if (!data) {
    // Första inloggning på den här användaren — skapa rad från lokal data.
    const local = readLocal();
    const seed = {
      user_id: userId,
      reminders: local.reminders ?? { morning_checkin: false, evening_journal: false, weekly_forms: false },
      onboarded_at: local.onboarded_at ?? null,
      action_prefs: local.action_prefs ?? { time: "auto", length: "auto" },
      doctor_email: local.doctor_email ?? null,
      weekly_questions: local.weekly_questions ?? [],
      last_seen_at: local.last_seen_at ?? null,
      baseline: local.baseline ?? null,
    };
    const { data: inserted } = await supabase
      .from("user_settings")
      .insert(seed as never)
      .select("reminders,onboarded_at,action_prefs,doctor_email,weekly_questions,last_seen_at,baseline")
      .maybeSingle();
    if (inserted) {
      const row = inserted as unknown as UserSettingsRow;
      writeLocal(row);
      return row;
    }
    return null;
  }

  const row = data as unknown as UserSettingsRow;
  writeLocal(row);
  return row;
};

/** Generisk patch — skriv ett delfält både lokalt och till databasen. */
export const patchUserSettings = async (
  patch: Partial<UserSettingsRow>,
): Promise<void> => {
  // Lokal cache uppdateras synkront av specifika setters, så här fokuserar
  // vi bara på databasen. Tyst fallback om ej inloggad.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, ...patch } as never, { onConflict: "user_id" });
};
