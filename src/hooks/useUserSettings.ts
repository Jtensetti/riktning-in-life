// Reaktiv läsare för synkroniserade användarinställningar.
//
// Bakgrund: settings.ts/baseline.ts läser localStorage synkront. Det är snabbt,
// men på en ny enhet hinner UI:t fatta beslut (t.ex. redirect till onboarding)
// innan hydrateUserSettings() har skrivit servervärdena till cachen.
//
// Den här hooken lyssnar på `riktning:settings-hydrated` (fires av
// userSettingsSync när serverdata laddats) samt `storage`-event (för andra
// flikar) och re-renderar konsumenter automatiskt. Den exponerar också ett
// `hydrated`-flagg så att sidor kan vänta in synken innan de routar.

import { useEffect, useState } from "react";
import { isOnboarded } from "@/lib/settings";
import { loadActionPreferences, type ActionPreferences } from "@/lib/settings";
import { SETTINGS_HYDRATED_EVENT } from "@/lib/userSettingsSync";

export type UserSettingsSnapshot = {
  /** Sant när hydrateUserSettings() har körts klart minst en gång. */
  hydrated: boolean;
  onboarded: boolean;
  actionPrefs: ActionPreferences;
};

const readSnapshot = (hydrated: boolean): UserSettingsSnapshot => ({
  hydrated,
  onboarded: isOnboarded(),
  actionPrefs: loadActionPreferences(),
});

export const useUserSettings = (): UserSettingsSnapshot => {
  const [snap, setSnap] = useState<UserSettingsSnapshot>(() => readSnapshot(false));

  useEffect(() => {
    const refresh = (hydrated: boolean) => setSnap(readSnapshot(hydrated));
    const onHydrated = () => refresh(true);
    const onStorage = (e: StorageEvent) => {
      // Endast nycklar vi bryr oss om
      if (e.key && (e.key.startsWith("riktning_onboarded") || e.key.startsWith("riktning_action_prefs"))) {
        refresh(snap.hydrated);
      }
    };
    window.addEventListener(SETTINGS_HYDRATED_EVENT, onHydrated);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SETTINGS_HYDRATED_EVENT, onHydrated);
      window.removeEventListener("storage", onStorage);
    };
  }, [snap.hydrated]);

  return snap;
};
