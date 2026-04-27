// User feature flags lagrade i user_settings.flags (jsonb).
// Lokal cache för synkron läsning, server-skrivning för persistens mellan
// enheter. Default = på för auto_journal — användaren får tillbaka kontrollen
// via Settings-sidan om hen tycker det blir för pratsamt.
import { supabase } from "@/integrations/supabase/client";

export type UserFlags = {
  auto_journal: boolean;
};

export const defaultFlags: UserFlags = {
  auto_journal: true,
};

const LS_KEY = "riktning_flags";

export const loadFlags = (): UserFlags => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultFlags;
    return { ...defaultFlags, ...JSON.parse(raw) };
  } catch {
    return defaultFlags;
  }
};

export const saveFlags = async (next: UserFlags): Promise<void> => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch { /* ignore quota */ }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("user_settings")
    .upsert(
      { user_id: user.id, flags: next as unknown as Record<string, unknown> } as never,
      { onConflict: "user_id" },
    );
};

/** Hydrera lokala flags från servern. Anropas vid inloggning. */
export const hydrateFlags = async (userId: string): Promise<UserFlags> => {
  const { data } = await supabase
    .from("user_settings")
    .select("flags")
    .eq("user_id", userId)
    .maybeSingle();
  const merged: UserFlags = { ...defaultFlags, ...((data?.flags as Partial<UserFlags>) ?? {}) };
  try { localStorage.setItem(LS_KEY, JSON.stringify(merged)); } catch { /* ignore */ }
  return merged;
};
