import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AbstractIcon, type IconName } from "./AbstractIcon";
import { Plus, Sparkles, Info, Star } from "lucide-react";
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
      const { data: cat } = await supabase
        .from("activity_catalog")
        .select("slug,label,category,icon,color,default_minutes")
        .in("slug", slugs);
      if (!cancelled) setFavs(((cat ?? []) as any[]).slice(0, 3));
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
            {favs.map((f, i) => (
              <button
                key={f.slug}
                onClick={() => quickLog(f)}
                disabled={busy === f.slug}
                className={`w-full ${colorBg(f.color)} rounded-2xl px-4 py-3 flex items-center gap-3 shadow-card press-soft animate-pop-in ${busy === f.slug ? "opacity-60" : ""}`}
                style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
              >
                <div className="shrink-0 w-10 h-10 rounded-full bg-white/25 grid place-items-center">
                  <AbstractIcon name={f.icon as IconName} size={22} color="currentColor" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-extrabold text-[15px] leading-tight truncate">{f.label}</p>
                  <p className="text-[11px] opacity-90 font-bold">{f.default_minutes} min · ett klick = loggad</p>
                </div>
                <div className="shrink-0 w-8 h-8 rounded-full bg-white/25 grid place-items-center">
                  <Plus size={16} />
                </div>
              </button>
            ))}
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
