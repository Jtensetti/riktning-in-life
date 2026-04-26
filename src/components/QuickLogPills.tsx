import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AbstractIcon, type IconName } from "./AbstractIcon";
import { Plus, Sparkles, Info, Star, Loader2, AlertCircle, RefreshCw, Trash2, Pencil, Minus } from "lucide-react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";

type FavItem = {
  slug: string;
  label: string;
  category: string;
  icon: string;
  color: string;
  default_minutes: number;
  lastLoggedDays: number | null;
  logCount30d: number;
};

const colorBg = (color: string): string => {
  switch (color) {
    case "orange": return "bg-orange-start text-white";
    case "blue": return "bg-blue-calm text-white";
    case "yellow": return "bg-yellow-journal text-foreground";
    case "purple": return "bg-purple-sleep text-white";
    case "pink": return "bg-pink-move text-white";
    case "green": return "bg-green-recovery text-white";
    default: return "bg-cream-card text-foreground";
  }
};

const todayISO = () => new Date().toISOString().split("T")[0];

const whyReason = (f: { lastLoggedDays: number | null; logCount30d: number; category: string }): { text: string; icon: "star" | "info" } => {
  if (f.logCount30d === 0) {
    return { text: "Du har stjärnmärkt den som favorit.", icon: "star" };
  }
  if (f.lastLoggedDays === 0) {
    return { text: "Loggad idag — fortsätt din kedja.", icon: "info" };
  }
  if (f.lastLoggedDays === 1) {
    return { text: "Loggad igår — håll i rytmen.", icon: "info" };
  }
  if (f.lastLoggedDays !== null && f.lastLoggedDays <= 3) {
    return { text: `Senast för ${f.lastLoggedDays} dagar sedan.`, icon: "info" };
  }
  if (f.logCount30d >= 8) {
    return { text: `En av dina vanor — ${f.logCount30d} ggr senaste månaden.`, icon: "info" };
  }
  if (f.lastLoggedDays !== null && f.lastLoggedDays >= 7) {
    return { text: `Inte loggad på ${f.lastLoggedDays} dagar — dags igen?`, icon: "info" };
  }
  return { text: "Favorit du brukar återvända till.", icon: "info" };
};

const MOOD_OPTIONS: { delta: number; emoji: string; text: string; tone: string }[] = [
  { delta: -2, emoji: "😔", text: "Sämre", tone: "bg-purple-sleep/15 text-purple-sleep" },
  { delta: -1, emoji: "🙁", text: "Lite sämre", tone: "bg-blue-calm/15 text-blue-calm" },
  { delta: 0, emoji: "😐", text: "Som vanligt", tone: "bg-cream-card text-foreground" },
  { delta: 1, emoji: "🙂", text: "Lite bättre", tone: "bg-yellow-journal/30 text-foreground" },
  { delta: 2, emoji: "😊", text: "Mycket bättre", tone: "bg-green-recovery/20 text-green-recovery" },
];

interface Props {
  onOpenPicker: () => void;
  onLogged?: () => void;
}

export const QuickLogPills = ({ onOpenPicker, onLogged }: Props) => {
  const { user } = useAuth();
  const [favs, setFavs] = useState<FavItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [moodSheet, setMoodSheet] = useState<{ id: string; label: string; current: number } | null>(null);
  const [savingMood, setSavingMood] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data: favRows } = await supabase
        .from("activity_favorites")
        .select("activity_slug")
        .eq("user_id", user.id);
      const slugs = (favRows ?? []).map((r: any) => r.activity_slug);
      if (slugs.length === 0) {
        if (!cancelled) setFavs([]);
        return;
      }
      const since = new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0];
      const [{ data: cat }, { data: logs }] = await Promise.all([
        supabase
          .from("activity_catalog")
          .select("slug,label,category,icon,color,default_minutes")
          .in("slug", slugs),
        supabase
          .from("activity_logs")
          .select("activity_slug,date")
          .eq("user_id", user.id)
          .in("activity_slug", slugs)
          .gte("date", since)
          .order("date", { ascending: false }),
      ]);
      const today = todayISO();
      const stats = new Map<string, { last: string | null; count: number }>();
      for (const l of (logs ?? []) as any[]) {
        const cur = stats.get(l.activity_slug) ?? { last: null, count: 0 };
        cur.count += 1;
        if (!cur.last || l.date > cur.last) cur.last = l.date;
        stats.set(l.activity_slug, cur);
      }
      const enriched: FavItem[] = ((cat ?? []) as any[]).slice(0, 3).map((c) => {
        const s = stats.get(c.slug);
        let lastLoggedDays: number | null = null;
        if (s?.last) {
          const diffMs = new Date(today).getTime() - new Date(s.last).getTime();
          lastLoggedDays = Math.max(0, Math.round(diffMs / 86_400_000));
        }
        return { ...c, lastLoggedDays, logCount30d: s?.count ?? 0 };
      });
      if (!cancelled) setFavs(enriched);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const quickLog = async (item: FavItem) => {
    if (!user || busy) return;
    setBusy(item.slug);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(10);

    const { data: inserted, error } = await supabase.from("activity_logs").insert({
      user_id: user.id,
      date: todayISO(),
      activity_slug: item.slug,
      label: item.label,
      category: item.category,
      icon: item.icon,
      color: item.color,
      duration_minutes: item.default_minutes,
      mood_delta: 1,
    }).select("id").maybeSingle();

    setBusy(null);
    if (error) {
      toast.error("Kunde inte logga. Försök igen.");
      return;
    }

    onLogged?.();

    toast.success(`${item.label} loggad`, {
      description: `${item.default_minutes} min · kändes lite bättre`,
      action: inserted?.id ? {
        label: "Ändra känsla",
        onClick: () => setMoodSheet({ id: inserted.id, label: item.label, current: 1 }),
      } : undefined,
    });
  };

  const updateMood = async (delta: number) => {
    if (!moodSheet || !user) return;
    setSavingMood(delta);
    const { error } = await supabase
      .from("activity_logs")
      .update({ mood_delta: delta })
      .eq("id", moodSheet.id)
      .eq("user_id", user.id);
    setSavingMood(null);
    if (error) {
      toast.error("Kunde inte uppdatera känslan.");
      return;
    }
    const picked = MOOD_OPTIONS.find(o => o.delta === delta);
    toast.success(`Känsla uppdaterad`, { description: picked ? `${picked.emoji} ${picked.text}` : undefined });
    setMoodSheet(null);
    onLogged?.();
  };

  const renderEmpty = () => (
    <section className="mb-6 animate-fade-in-up">
      <div className="card-cream p-4 flex items-center gap-3">
        <div className="shrink-0 w-11 h-11 rounded-2xl bg-orange-start/15 grid place-items-center">
          <Sparkles size={20} className="text-orange-deep" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold leading-tight">Snabblogga din vardag</p>
          <p className="text-xs text-text-secondary">Stjärnmarkera favoriter för att logga med ett klick.</p>
        </div>
        <button
          onClick={onOpenPicker}
          className="shrink-0 h-10 px-4 rounded-full bg-foreground text-background text-xs font-extrabold press-soft inline-flex items-center gap-1"
        >
          <Plus size={14} /> Logga
        </button>
      </div>
    </section>
  );

  return (
    <>
      {favs.length === 0 ? renderEmpty() : (
        <section className="mb-6 animate-fade-in-up">
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-text-secondary">Snabblogga</h3>
            <button onClick={onOpenPicker} className="text-xs font-extrabold text-orange-deep press-soft">
              Fler val
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {favs.map((f, i) => {
              const why = whyReason(f);
              return (
                <div
                  key={f.slug}
                  className={`${colorBg(f.color)} rounded-2xl shadow-card animate-pop-in ${busy === f.slug ? "opacity-60" : ""}`}
                  style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
                >
                  <button
                    onClick={() => quickLog(f)}
                    disabled={busy === f.slug}
                    className="w-full px-4 pt-3 pb-2 flex items-center gap-3 press-soft text-left"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-full bg-white/25 grid place-items-center">
                      <AbstractIcon name={f.icon as IconName} size={22} color="currentColor" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-[15px] leading-tight truncate">{f.label}</p>
                      <p className="text-[11px] opacity-90 font-bold">{f.default_minutes} min · ett klick = loggad</p>
                    </div>
                    <div className="shrink-0 w-8 h-8 rounded-full bg-white/25 grid place-items-center">
                      <Plus size={16} />
                    </div>
                  </button>
                  <div className="mx-3 mb-2 px-3 py-1.5 rounded-full bg-white/20 flex items-center gap-1.5">
                    {why.icon === "star" ? (
                      <Star size={11} className="shrink-0" fill="currentColor" />
                    ) : (
                      <Info size={11} className="shrink-0" />
                    )}
                    <p className="text-[11px] font-bold leading-tight opacity-95 truncate">
                      <span className="opacity-75">Varför den här? </span>{why.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Drawer open={!!moodSheet} onOpenChange={(o) => !o && setMoodSheet(null)}>
        <DrawerContent className="bg-cream-bg">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl font-extrabold">
              Hur kändes {moodSheet?.label.toLowerCase()}?
            </DrawerTitle>
            <DrawerDescription className="text-text-secondary">
              Välj hur du mår efteråt — du kan alltid ändra senare.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 grid grid-cols-1 gap-2">
            {MOOD_OPTIONS.map((o, i) => {
              const active = moodSheet?.current === o.delta;
              return (
                <button
                  key={o.delta}
                  onClick={() => updateMood(o.delta)}
                  disabled={savingMood !== null}
                  className={`w-full rounded-2xl px-4 py-4 flex items-center gap-4 press-soft animate-pop-in border-2 ${
                    active ? "border-foreground" : "border-transparent"
                  } ${o.tone} ${savingMood === o.delta ? "opacity-60" : ""}`}
                  style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
                >
                  <span className="text-3xl leading-none">{o.emoji}</span>
                  <span className="flex-1 text-left font-extrabold text-[15px]">{o.text}</span>
                  {active && <span className="text-xs font-extrabold uppercase tracking-wider opacity-70">Vald</span>}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
