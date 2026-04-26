import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Returns the user's most recently logged activity slugs (de-duplicated,
 * newest first). Used by ActivityPicker to surface a "Senast använda"
 * section so the most likely picks are always one tap away.
 */
export const useRecentActivities = (limit = 4) => {
  const { user } = useAuth();
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setSlugs([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("activity_slug, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(40);
      if (cancelled || !data) return;
      const seen = new Set<string>();
      const out: string[] = [];
      for (const row of data) {
        const slug = (row as { activity_slug: string }).activity_slug;
        if (!slug || seen.has(slug)) continue;
        seen.add(slug);
        out.push(slug);
        if (out.length >= limit) break;
      }
      setSlugs(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, limit]);

  return slugs;
};
