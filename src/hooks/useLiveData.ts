// useLiveData — Supabase Realtime-prenumeration på de tabeller där en logg
// från en annan enhet ska få Today att uppdatera sig direkt.
//
// Vi exponerar bara en räknare `version` som ökar vid varje INSERT/UPDATE/DELETE
// — konsumenter listar `version` i sin egen useEffect-deps och kör då en
// refetch. Det hindrar oss från att duplicera all hämtningslogik här.
//
// Tabellerna kräver REPLICA IDENTITY FULL och att vara tillagda i
// supabase_realtime-publikationen — det är gjort i migrationen.

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const TABLES = [
  "daily_checkins",
  "activity_logs",
  "exercise_sessions",
  "medication_logs",
  "journal_entries",
] as const;

export const useLiveData = (): { version: number } => {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`live-${user.id}`);
    TABLES.forEach((table) => {
      channel.on(
        // @ts-expect-error postgres_changes saknar narrow types
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `user_id=eq.${user.id}` },
        () => setVersion((v) => v + 1),
      );
    });
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  return { version };
};
