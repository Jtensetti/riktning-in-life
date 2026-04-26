import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type RecentCheckin = {
  date: string;
  mood_heaviness: number | null;
  anxiety: number | null;
  energy: number | null;
  function_score: number | null;
  sleep_hours: number | null;
};

const isoDaysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

/** Senaste N dagars check-ins, sorterade i kronologisk ordning. */
export const useRecentCheckins = (days: number = 14) => {
  const { user } = useAuth();
  const [data, setData] = useState<RecentCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const since = isoDaysAgo(days - 1);
      const { data: rows } = await supabase
        .from("daily_checkins")
        .select("date,mood_heaviness,anxiety,energy,function_score,sleep_hours")
        .eq("user_id", user.id)
        .gte("date", since)
        .order("date", { ascending: true });
      if (!cancelled) {
        setData((rows ?? []).map((r) => ({
          ...r,
          sleep_hours: r.sleep_hours == null ? null : Number(r.sleep_hours),
        })) as RecentCheckin[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, days]);

  return { data, loading };
};

/** Plocka serie för ett fält + fyll luckor med null så datesarrayen alltid matchar. */
export const seriesForField = (
  rows: RecentCheckin[],
  days: number,
  field: keyof RecentCheckin,
): { dates: string[]; values: (number | null)[] } => {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) dates.push(isoDaysAgo(i));
  const map = new Map(rows.map((r) => [r.date, r]));
  const values = dates.map((d) => {
    const r = map.get(d);
    if (!r) return null;
    const v = r[field];
    return typeof v === "number" ? v : null;
  });
  return { dates, values };
};
