import { supabase } from "@/integrations/supabase/client";
import type { ActivityDraft } from "@/components/ActivityPicker";
import { toast } from "sonner";

/**
 * Shared activity-log writer used by both BottomNav (mobile) and SideNav
 * (desktop). Keeps the insert payload identical across breakpoints so a
 * row written from desktop is indistinguishable from a mobile one.
 */
export const insertActivityLog = async (userId: string, a: ActivityDraft) => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.(10);
  }
  const { error } = await supabase.from("activity_logs").insert({
    user_id: userId,
    date: new Date().toISOString().split("T")[0],
    activity_slug: a.slug,
    label: a.label,
    category: a.category,
    icon: a.icon,
    color: a.color,
    duration_minutes: a.duration_minutes,
    mood_delta: a.mood_delta,
    semantic_kind: a.semantic_kind ?? null,
    intensity: a.intensity ?? null,
    with_who: a.with_who ?? null,
    sleep_quality: a.sleep_quality ?? null,
    location: a.location ?? null,
  } as any);
  if (error) {
    toast.error("Kunde inte logga. Försök igen.");
    return false;
  }
  toast.success(`${a.label} loggad`);
  return true;
};
