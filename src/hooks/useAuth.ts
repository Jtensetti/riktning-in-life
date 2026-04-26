import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { hydrateUserSettings } from "@/lib/userSettingsSync";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let hydratedFor: string | null = null;
    const maybeHydrate = (uid: string | undefined) => {
      if (uid && hydratedFor !== uid) {
        hydratedFor = uid;
        // Synka inställningar från databasen så att enhetsbyte fungerar.
        void hydrateUserSettings(uid);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      maybeHydrate(newSession?.user?.id);
    });

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      maybeHydrate(existing?.user?.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, session, loading };
}
