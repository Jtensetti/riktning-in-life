// Lightweight reminder + onboarding settings stored in localStorage.

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
