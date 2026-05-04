/**
 * useTodayActivities — hämta dagens activity_logs för cockpit/DayMat.
 *
 * Liten dedikerad hook eftersom Today bara behöver count idag, men
 * DayMat behöver färg/ikon/label/effekt per logg. Auto-uppdaterar när
 * `riktning:activity-logged`-eventet kommer från QuickLog/ActivityPicker
 * så användaren ser sin nya bricka direkt.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type TodayActivity = {
  id: string;
  activity_slug: string;
  label: string;
  category: string;
  icon: string;
  color: string;
  duration_minutes: number | null;
  mood_delta: number | null;
  semantic_kind: string | null;
  created_at: string;
};

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const useTodayActivities = () => {
  const { user } = useAuth();
  const [data, setData] = useState<TodayActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: rows } = await supabase
        .from("activity_logs")
        .select(
          "id, activity_slug, label, category, icon, color, duration_minutes, mood_delta, semantic_kind, created_at",
        )
        .eq("user_id", user.id)
        .eq("date", todayISO())
        .order("created_at", { ascending: true });
      if (cancelled) return;
      setData((rows ?? []) as TodayActivity[]);
      setLoading(false);
    })();
    const onLogged = () => setReloadKey((k) => k + 1);
    window.addEventListener("riktning:activity-logged", onLogged);
    return () => {
      cancelled = true;
      window.removeEventListener("riktning:activity-logged", onLogged);
    };
  }, [user, reloadKey]);

  return { data, loading };
};
