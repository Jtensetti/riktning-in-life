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

type EditState = {
  id: string;
  label: string;
  mood: number;
  minutes: number;
};

export const QuickLogPills = ({ onOpenPicker, onLogged }: Props) => {
  const { user } = useAuth();
  const [favs, setFavs] = useState<FavItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState<{ slug: string; message: string } | null>(null);
  const [editSheet, setEditSheet] = useState<EditState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    setFailed(null);
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
    if (error || !inserted?.id) {
      setFailed({ slug: item.slug, message: error?.message ?? "Okänt fel — försök igen." });
      toast.error(`Kunde inte logga ${item.label}`, {
        description: "Tryck på återförsök i kortet.",
      });
      return;
    }

    onLogged?.();

    toast.success(`${item.label} loggad`, {
      description: `${item.default_minutes} min · 🙂 lite bättre`,
      action: {
        label: "Ändra",
        onClick: () => setEditSheet({ id: inserted.id, label: item.label, mood: 1, minutes: item.default_minutes }),
      },
    });
  };

  const saveEdit = async () => {
    if (!editSheet || !user || savingEdit) return;
    setSavingEdit(true);
    const { error } = await supabase
      .from("activity_logs")
      .update({ mood_delta: editSheet.mood, duration_minutes: editSheet.minutes })
      .eq("id", editSheet.id)
      .eq("user_id", user.id);
    setSavingEdit(false);
    if (error) {
      toast.error("Kunde inte spara ändringen.", { description: error.message });
      return;
    }
    const picked = MOOD_OPTIONS.find(o => o.delta === editSheet.mood);
    toast.success("Sparat", {
      description: `${editSheet.minutes} min${picked ? ` · ${picked.emoji} ${picked.text}` : ""}`,
    });
    setEditSheet(null);
    onLogged?.();
  };

  const deleteLog = async () => {
    if (!editSheet || !user || deleting) return;
    setDeleting(true);
    const { error } = await supabase
      .from("activity_logs")
      .delete()
      .eq("id", editSheet.id)
      .eq("user_id", user.id);
    setDeleting(false);
    if (error) {
      toast.error("Kunde inte radera loggen.", { description: error.message });
      return;
    }
    toast.success("Loggen raderad");
    setEditSheet(null);
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
              const isBusy = busy === f.slug;
              const isLocked = !!busy && !isBusy; // another pill is saving
              const isFailed = failed?.slug === f.slug;
              return (
                <div
                  key={f.slug}
                  className={`relative overflow-hidden ${colorBg(f.color)} rounded-2xl shadow-card animate-pop-in ${isLocked ? "opacity-60" : ""}`}
                  style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
                >
                  {/* Mjuka blob-bakgrunder för visuell rytm */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-10 -right-10 w-36 h-36 rounded-full bg-white/15"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-6 -left-8 w-20 h-20 rounded-full bg-white/10"
                  />
                  <button
                    onClick={() => quickLog(f)}
                    disabled={isBusy || isLocked}
                    className={`relative z-[1] w-full px-4 pt-3 pb-2 flex items-center gap-3 press-soft text-left disabled:cursor-not-allowed ${isBusy ? "opacity-80" : ""}`}
                    aria-busy={isBusy}
                  >
                    <div className="shrink-0 w-10 h-10 rounded-full bg-white/25 grid place-items-center">
                      {isBusy ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <AbstractIcon name={f.icon as IconName} size={22} color="currentColor" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-[15px] leading-tight truncate">{f.label}</p>
                      <p className="text-[11px] opacity-90 font-bold">
                        {isBusy ? "Sparar…" : isLocked ? "Vänta…" : `${f.default_minutes} min · ett klick = loggad`}
                      </p>
                    </div>
                    <div className="shrink-0 w-8 h-8 rounded-full bg-white/25 grid place-items-center">
                      {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={16} />}
                    </div>
                  </button>

                  {isFailed ? (
                    <div className="relative z-[1] mx-3 mb-2 px-3 py-2 rounded-2xl bg-white/95 text-foreground flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0 text-destructive" />
                      <p className="flex-1 min-w-0 text-[11px] font-bold leading-tight truncate">
                        Loggning misslyckades. {failed?.message}
                      </p>
                      <button
                        onClick={() => quickLog(f)}
                        disabled={isBusy || isLocked}
                        className="shrink-0 h-7 px-3 rounded-full bg-foreground text-background text-[11px] font-extrabold press-soft inline-flex items-center gap-1 disabled:opacity-60"
                      >
                        <RefreshCw size={11} /> Försök igen
                      </button>
                    </div>
                  ) : (
                    <div className="relative z-[1] mx-3 mb-2 px-3 py-1.5 rounded-full bg-white/20 flex items-center gap-1.5">
                      {why.icon === "star" ? (
                        <Star size={11} className="shrink-0" fill="currentColor" />
                      ) : (
                        <Info size={11} className="shrink-0" />
                      )}
                      <p className="text-[11px] font-bold leading-tight opacity-95 truncate">
                        <span className="opacity-75">Varför den här? </span>{why.text}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Drawer open={!!editSheet} onOpenChange={(o) => !o && !savingEdit && !deleting && setEditSheet(null)}>
        <DrawerContent className="bg-cream-bg">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl font-extrabold">
              Ändra {editSheet?.label.toLowerCase()}
            </DrawerTitle>
            <DrawerDescription className="text-text-secondary">
              Justera tid och känsla — eller radera helt.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-6 space-y-5" aria-busy={savingEdit || deleting}>
            {/* Tid */}
            <div className={savingEdit || deleting ? "opacity-60 pointer-events-none" : ""}>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary mb-2">Tid</p>
              <div className="flex items-center gap-3 bg-cream-card rounded-2xl p-3">
                <button
                  onClick={() => setEditSheet(s => s ? { ...s, minutes: Math.max(1, s.minutes - 5) } : s)}
                  disabled={savingEdit || deleting}
                  className="shrink-0 w-10 h-10 rounded-full bg-foreground/10 grid place-items-center press-soft disabled:cursor-not-allowed"
                  aria-label="Minska 5 min"
                >
                  <Minus size={16} />
                </button>
                <div className="flex-1 text-center">
                  <p className="text-2xl font-extrabold leading-none">{editSheet?.minutes ?? 0}</p>
                  <p className="text-[11px] font-bold text-text-secondary">minuter</p>
                </div>
                <button
                  onClick={() => setEditSheet(s => s ? { ...s, minutes: s.minutes + 5 } : s)}
                  disabled={savingEdit || deleting}
                  className="shrink-0 w-10 h-10 rounded-full bg-foreground/10 grid place-items-center press-soft disabled:cursor-not-allowed"
                  aria-label="Öka 5 min"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Känsla */}
            <div className={savingEdit || deleting ? "opacity-60 pointer-events-none" : ""}>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary mb-2">Hur kändes det?</p>
              <div className="grid grid-cols-1 gap-2">
                {MOOD_OPTIONS.map((o, i) => {
                  const active = editSheet?.mood === o.delta;
                  return (
                    <button
                      key={o.delta}
                      onClick={() => setEditSheet(s => s ? { ...s, mood: o.delta } : s)}
                      disabled={savingEdit || deleting}
                      className={`w-full rounded-2xl px-4 py-3 flex items-center gap-4 press-soft border-2 disabled:cursor-not-allowed ${
                        active ? "border-foreground" : "border-transparent"
                      } ${o.tone}`}
                      style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
                    >
                      <span className="text-2xl leading-none">{o.emoji}</span>
                      <span className="flex-1 text-left font-extrabold text-[14px]">{o.text}</span>
                      {active && <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-70">Vald</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={deleteLog}
                disabled={savingEdit || deleting}
                className="shrink-0 h-12 px-4 rounded-full bg-destructive/10 text-destructive font-extrabold text-sm press-soft inline-flex items-center gap-2 disabled:opacity-60"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Radera
              </button>
              <button
                onClick={saveEdit}
                disabled={savingEdit || deleting}
                className="flex-1 h-12 rounded-full bg-foreground text-background font-extrabold text-[15px] press-soft inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {savingEdit ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
                {savingEdit ? "Sparar…" : "Spara ändringar"}
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
