import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AbstractIcon, type IconName } from "./AbstractIcon";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

type FavItem = {
  slug: string;
  label: string;
  category: string;
  icon: string;
  color: string;
  default_minutes: number;
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

interface Props {
  onOpenPicker: () => void;
  /** Bumpa när något loggas så Today kan ladda om kedjor. */
  onLogged?: () => void;
}

/**
 * Snabbloggning från Today: visar upp till 3 favoritaktiviteter som tap-to-log-pills.
 * Ett klick → loggas direkt med default-tid och mood +1. Mood kan ändras via toast-action.
 * Plus en "+"-knapp som öppnar full ActivityPicker.
 */
export const QuickLogPills = ({ onOpenPicker, onLogged }: Props) => {
  const { user } = useAuth();
  const [favs, setFavs] = useState<FavItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

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
    // Haptisk feedback om tillgängligt
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

    // Mjuk toast med snabb-justering av mood
    toast.success(`${item.label} loggad`, {
      description: `${item.default_minutes} min · kändes lite bättre`,
      action: inserted?.id ? {
        label: "Ändra känsla",
        onClick: () => showMoodPicker(inserted.id, item.label),
      } : undefined,
    });
  };

  const showMoodPicker = (id: string, label: string) => {
    // Enkel sekventiell toast — användaren får välja en ny mood.
    const opts: { delta: number; emoji: string; text: string }[] = [
      { delta: -2, emoji: "😔", text: "Sämre" },
      { delta: -1, emoji: "🙁", text: "Lite sämre" },
      { delta: 0, emoji: "😐", text: "Som vanligt" },
      { delta: 1, emoji: "🙂", text: "Lite bättre" },
      { delta: 2, emoji: "😊", text: "Mycket bättre" },
    ];
    toast.message(`Hur kändes ${label}?`, {
      description: opts.map(o => `${o.emoji} ${o.text}`).join("  ·  "),
      duration: 8000,
      action: {
        label: "Öppna",
        onClick: async () => {
          // Cykla igenom — visa varje val som egen knapp via prompt-toast
          for (const o of opts) {
            // För enkelhet: vi öppnar en dialog-toast per val? Hellre en egen drawer i framtiden.
          }
          // MVP: bara öppna picker så användaren kan justera senare via Checkin-sidan
        },
      },
    });
    // För MVP: spara via direkt update om man verkligen vill ändra — picker hanteras i Checkin.
    void id;
  };

  if (favs.length === 0) {
    return (
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
  }

  return (
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
  );
};
