import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { AbstractIcon, type IconName } from "@/components/AbstractIcon";
import { HeroBanner } from "@/components/HeroBanner";
import { ColorCard } from "@/components/ColorCard";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, Clock, History, Plus, Minus, Trash2 } from "lucide-react";
import { toast } from "sonner";

// === Types ===
type TemplateKey = "sleep" | "movement" | "mood" | "medication";
type Tone = "purple" | "pink" | "orange" | "blue";

type Template = {
  key: TemplateKey;
  title: string;
  blurb: string;
  tone: Tone;
  icon: IconName;
};

const TEMPLATES: Template[] = [
  { key: "sleep", title: "Sömn", blurb: "Hur sov du i natt?", tone: "purple", icon: "bed-soft" },
  { key: "movement", title: "Rörelse", blurb: "Vad gjorde din kropp?", tone: "pink", icon: "walk-figure" },
  { key: "mood", title: "Mående", blurb: "Hur känns det just nu?", tone: "orange", icon: "blob-smile" },
  { key: "medication", title: "Medicin", blurb: "Tagit dagens dos?", tone: "blue", icon: "pill" },
];

const toneBg = (t: Tone): string => {
  switch (t) {
    case "purple": return "bg-purple-sleep text-white";
    case "pink": return "bg-pink-move text-white";
    case "orange": return "bg-orange-start text-white";
    case "blue": return "bg-blue-calm text-white";
  }
};

const todayISO = () => new Date().toISOString().split("T")[0];
const dateLabel = (iso: string) => {
  const today = todayISO();
  const d = new Date(iso);
  if (iso === today) return "Idag";
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (iso === y.toISOString().split("T")[0]) return "Igår";
  return d.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "short" });
};
const timeLabel = (ts: string) => new Date(ts).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

// === Aggregated daily entry (uniform shape across sources) ===
type DayEntry = {
  id: string;
  source: TemplateKey;
  ts: string;          // created_at
  date: string;        // YYYY-MM-DD
  title: string;
  detail: string;
  tone: Tone;
  icon: IconName;
};

// === Page ===
type MoodEdit = { id: string; heaviness: number; anxiety: number; energy: number };

const QuickLog = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [openTpl, setOpenTpl] = useState<TemplateKey | null>(null);
  const [tab, setTab] = useState<"today" | "history">("today");
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [meds, setMeds] = useState<{ id: string; name: string; dose: string | null }[]>([]);
  const [fetching, setFetching] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [moodEdit, setMoodEdit] = useState<MoodEdit | null>(null);
  const [savingMoodEdit, setSavingMoodEdit] = useState(false);
  const [moodEditSaved, setMoodEditSaved] = useState<MoodEdit | null>(null);

  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [user, loading, navigate]);

  // Load last 14 days of entries from all 4 sources
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setFetching(true);
      const since = new Date(); since.setDate(since.getDate() - 13);
      const sinceISO = since.toISOString().split("T")[0];

      const [checkRes, actsRes, medLogsRes, medsRes] = await Promise.all([
        supabase.from("daily_checkins")
          .select("id,date,created_at,sleep_hours,sleep_quality,mood_heaviness,anxiety,energy,note")
          .eq("user_id", user.id).gte("date", sinceISO).order("created_at", { ascending: false }),
        supabase.from("activity_logs")
          .select("id,date,created_at,label,icon,color,duration_minutes,mood_delta,category,note")
          .eq("user_id", user.id).gte("date", sinceISO).order("created_at", { ascending: false }),
        supabase.from("medication_logs")
          .select("id,date,created_at,taken_status,note,medication_id,medications(name,dose)")
          .eq("user_id", user.id).gte("date", sinceISO).order("created_at", { ascending: false }),
        supabase.from("medications")
          .select("id,name,dose").eq("user_id", user.id).eq("active", true).order("name"),
      ]);

      if (cancelled) return;

      const out: DayEntry[] = [];

      for (const c of checkRes.data ?? []) {
        // Sleep entry (if sleep_hours provided)
        if (c.sleep_hours != null) {
          out.push({
            id: `sleep-${c.id}`,
            source: "sleep",
            ts: c.created_at,
            date: c.date,
            title: `${Number(c.sleep_hours).toFixed(1)}h sömn`,
            detail: c.sleep_quality != null ? `Kvalitet ${c.sleep_quality}/10` : "Ingen kvalitet angiven",
            tone: "purple",
            icon: "moon-soft",
          });
        }
        // Mood entry (if any mood-axis value provided)
        if (c.mood_heaviness != null || c.anxiety != null || c.energy != null) {
          const parts: string[] = [];
          if (c.mood_heaviness != null) parts.push(`Tyngd ${c.mood_heaviness}`);
          if (c.anxiety != null) parts.push(`Oro ${c.anxiety}`);
          if (c.energy != null) parts.push(`Energi ${c.energy}`);
          out.push({
            id: `mood-${c.id}`,
            source: "mood",
            ts: c.created_at,
            date: c.date,
            title: "Mående",
            detail: parts.join(" · ") || "Loggad",
            tone: "orange",
            icon: "blob-smile",
          });
        }
      }
      for (const a of actsRes.data ?? []) {
        out.push({
          id: `mov-${a.id}`,
          source: "movement",
          ts: a.created_at,
          date: a.date,
          title: a.label,
          detail: `${a.duration_minutes ?? 0} min${a.category ? " · " + a.category : ""}`,
          tone: "pink",
          icon: (a.icon as IconName) ?? "bike",
        });
      }
      for (const m of medLogsRes.data ?? []) {
        const med: any = (m as any).medications;
        const name = med?.name ?? "Medicin";
        const dose = med?.dose ?? "";
        const status = m.taken_status === "yes" ? "Tagen"
                     : m.taken_status === "skipped" ? "Hoppade över"
                     : m.taken_status === "partial" ? "Delvis" : m.taken_status;
        out.push({
          id: `med-${m.id}`,
          source: "medication",
          ts: m.created_at,
          date: m.date,
          title: name,
          detail: `${status}${dose ? " · " + dose : ""}`,
          tone: "blue",
          icon: "pill",
        });
      }

      out.sort((a, b) => b.ts.localeCompare(a.ts));
      setEntries(out);
      setMeds((medsRes.data ?? []) as any);
      setFetching(false);
    })();
    return () => { cancelled = true; };
  }, [user, reloadKey]);

  const today = todayISO();
  const todayEntries = useMemo(() => entries.filter(e => e.date === today), [entries, today]);
  const grouped = useMemo(() => {
    const map = new Map<string, DayEntry[]>();
    for (const e of entries) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries]);

  // Coverage chips per template for today
  const todayCoverage = useMemo(() => {
    const sources = new Set(todayEntries.map(e => e.source));
    return TEMPLATES.map(t => ({ ...t, done: sources.has(t.key) }));
  }, [todayEntries]);

  const onSaved = () => {
    setOpenTpl(null);
    setReloadKey(k => k + 1);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(10);
  };

  /** Anropas av MoodForm efter spara — visar toast med "Ändra känsla"-action
   *  som öppnar samma typ av redigeringsdrawer som aktivitets-snabbloggen. */
  const onMoodSaved = (id: string, heaviness: number, anxiety: number, energy: number) => {
    setOpenTpl(null);
    setReloadKey(k => k + 1);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(10);
    toast.success("Mående loggat", {
      description: `Tyngd ${heaviness} · Oro ${anxiety} · Energi ${energy}`,
      action: {
        label: "Ändra känsla",
        onClick: () => setMoodEdit({ id, heaviness, anxiety, energy }),
      },
    });
  };

  const saveMoodEdit = async () => {
    if (!moodEdit || !user || savingMoodEdit) return;
    setSavingMoodEdit(true);
    const { error } = await supabase
      .from("daily_checkins")
      .update({
        mood_heaviness: moodEdit.heaviness,
        anxiety: moodEdit.anxiety,
        energy: moodEdit.energy,
      })
      .eq("id", moodEdit.id)
      .eq("user_id", user.id);
    setSavingMoodEdit(false);
    if (error) { toast.error("Kunde inte spara"); return; }
    toast.success("Känsla uppdaterad");
    setMoodEdit(null);
    setReloadKey(k => k + 1);
  };

  const deleteEntry = async (e: DayEntry) => {
    if (!user) return;
    const rawId = e.id.replace(/^(sleep|mood|mov|med)-/, "");

    if (e.source === "sleep" || e.source === "mood") {
      // Snapshot current values, then null them. Undo restores via UPDATE.
      const fields = e.source === "sleep"
        ? ["sleep_hours", "sleep_quality"] as const
        : ["mood_heaviness", "anxiety", "energy"] as const;
      const { data: snap, error: snapErr } = await supabase
        .from("daily_checkins")
        .select(fields.join(","))
        .eq("id", rawId).eq("user_id", user.id).maybeSingle();
      if (snapErr || !snap) { toast.error("Kunde inte ta bort"); return; }
      const updates: any = Object.fromEntries(fields.map(f => [f, null]));
      const { error } = await supabase
        .from("daily_checkins").update(updates).eq("id", rawId).eq("user_id", user.id);
      if (error) { toast.error("Kunde inte ta bort"); return; }
      setReloadKey(k => k + 1);
      toast.success("Borttagen", {
        duration: 6000,
        action: {
          label: "Ångra",
          onClick: async () => {
            const restore: any = Object.fromEntries(fields.map(f => [f, (snap as any)[f]]));
            const { error: rErr } = await supabase
              .from("daily_checkins").update(restore).eq("id", rawId).eq("user_id", user.id);
            if (rErr) { toast.error("Kunde inte ångra"); return; }
            toast.success("Återställd");
            setReloadKey(k => k + 1);
          },
        },
      });
      return;
    }

    if (e.source === "movement") {
      const { data: snap, error: snapErr } = await supabase
        .from("activity_logs")
        .select("id,user_id,date,activity_slug,label,category,icon,color,duration_minutes,mood_delta,note,created_at")
        .eq("id", rawId).eq("user_id", user.id).maybeSingle();
      if (snapErr || !snap) { toast.error("Kunde inte ta bort"); return; }
      const { error } = await supabase.from("activity_logs").delete().eq("id", rawId).eq("user_id", user.id);
      if (error) { toast.error("Kunde inte ta bort"); return; }
      setReloadKey(k => k + 1);
      toast.success("Borttagen", {
        duration: 6000,
        action: {
          label: "Ångra",
          onClick: async () => {
            const { error: rErr } = await supabase.from("activity_logs").insert(snap as any);
            if (rErr) { toast.error("Kunde inte ångra"); return; }
            toast.success("Återställd");
            setReloadKey(k => k + 1);
          },
        },
      });
      return;
    }

    if (e.source === "medication") {
      const { data: snap, error: snapErr } = await supabase
        .from("medication_logs")
        .select("id,user_id,date,medication_id,taken_status,note,side_effects_json,created_at")
        .eq("id", rawId).eq("user_id", user.id).maybeSingle();
      if (snapErr || !snap) { toast.error("Kunde inte ta bort"); return; }
      const { error } = await supabase.from("medication_logs").delete().eq("id", rawId).eq("user_id", user.id);
      if (error) { toast.error("Kunde inte ta bort"); return; }
      setReloadKey(k => k + 1);
      toast.success("Borttagen", {
        duration: 6000,
        action: {
          label: "Ångra",
          onClick: async () => {
            const { error: rErr } = await supabase.from("medication_logs").insert(snap as any);
            if (rErr) { toast.error("Kunde inte ångra"); return; }
            toast.success("Återställd");
            setReloadKey(k => k + 1);
          },
        },
      });
    }
  };

  if (loading || fetching) {
    return <AppShell><div className="h-40 rounded-3xl bg-surface-alt animate-pulse" /></AppShell>;
  }

  return (
    <AppShell>
      <HeroBanner
        tone="var(--orange-start)"
        icon="spark"
        iconColor="hsl(var(--surface))"
        iconAccent="hsl(var(--yellow-journal))"
      />

      <h1 className="text-[32px] leading-[38px] mb-1">Snabblogg</h1>
      <p className="text-sm text-text-secondary mb-6">Logga på under 30 sekunder. Välj en mall och kör.</p>

      {/* === FOUR TEMPLATE BUTTONS === */}
      <section className="grid grid-cols-2 gap-3 mb-7">
        {TEMPLATES.map((t, i) => {
          const done = todayCoverage.find(c => c.key === t.key)?.done;
          return (
            <ColorCard
              key={t.key}
              tone={t.tone}
              icon={t.icon}
              iconPosition="bottom-right"
              size="sm"
              index={i}
              onClick={() => setOpenTpl(t.key)}
              ariaLabel={`Logga ${t.title}`}
              badge={done ? (
                <span className="grid place-items-center w-6 h-6 rounded-full bg-white/30">
                  <Check size={14} strokeWidth={3} />
                </span>
              ) : undefined}
            >
              <p className="text-[17px] font-extrabold leading-tight">{t.title}</p>
              <p className="text-[11px] opacity-90 font-bold">{t.blurb}</p>
            </ColorCard>
          );
        })}
      </section>

      {/* === TABS === */}
      <div className="flex items-center gap-1 mb-3 bg-surface-alt rounded-full p-1">
        {([
          { key: "today" as const, label: "Dagens loggar", count: todayEntries.length },
          { key: "history" as const, label: "Tidigare", count: entries.length - todayEntries.length },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-extrabold transition-colors ${
              tab === t.key ? "bg-foreground text-background" : "text-text-secondary"
            }`}
          >
            {t.label} {t.count > 0 && <span className="opacity-70 tabular-nums">· {t.count}</span>}
          </button>
        ))}
      </div>

      {tab === "today" && (
        <section className="mb-7">
          {todayEntries.length === 0 ? (
            <div className="card-cream p-5 text-center animate-fade-in-up">
              <p className="text-sm font-extrabold mb-1">Inget loggat idag än</p>
              <p className="text-xs text-text-secondary">Tryck på en av knapparna ovan för att börja.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {todayEntries.map((e, i) => (
                <EntryRow key={e.id} e={e} i={i} onDelete={() => deleteEntry(e)} />
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "history" && (
        <section className="mb-7 space-y-4">
          {grouped.filter(([d]) => d !== today).length === 0 ? (
            <div className="card-cream p-5 text-center animate-fade-in-up">
              <History size={20} className="mx-auto mb-2 text-text-secondary" />
              <p className="text-sm font-extrabold mb-1">Ingen historik än</p>
              <p className="text-xs text-text-secondary">Loggar från senaste 14 dagar visas här.</p>
            </div>
          ) : (
            grouped.filter(([d]) => d !== today).map(([d, list], gi) => (
              <div key={d} className="animate-fade-in-up" style={{ animationDelay: `var(--stagger-${Math.min(gi, 4)})` }}>
                <p className="text-xs font-extrabold uppercase tracking-wider text-text-secondary mb-2 capitalize">
                  {dateLabel(d)} <span className="opacity-60">· {list.length} st</span>
                </p>
                <ul className="space-y-2">
                  {list.map((e, i) => <EntryRow key={e.id} e={e} i={i} onDelete={() => deleteEntry(e)} />)}
                </ul>
              </div>
            ))
          )}
        </section>
      )}

      {/* === TEMPLATE DRAWERS === */}
      <Drawer open={openTpl !== null} onOpenChange={(o) => !o && setOpenTpl(null)}>
        <DrawerContent className="px-5 pb-8 max-h-[88vh]">
          <DrawerHeader className="px-0 pt-2">
            <DrawerTitle className="text-2xl">
              {openTpl ? TEMPLATES.find(t => t.key === openTpl)?.title : ""}
            </DrawerTitle>
          </DrawerHeader>
          {openTpl === "sleep" && <SleepForm onSaved={onSaved} userId={user?.id} />}
          {openTpl === "movement" && <MovementForm onSaved={onSaved} userId={user?.id} />}
          {openTpl === "mood" && <MoodForm onSaved={onMoodSaved} userId={user?.id} />}
          {openTpl === "medication" && <MedicationForm onSaved={onSaved} userId={user?.id} meds={meds} />}
        </DrawerContent>
      </Drawer>

      {/* === MOOD EDIT DRAWER — samma "Ändra känsla"-mönster som aktivitetsloggen === */}
      <Drawer open={!!moodEdit} onOpenChange={(o) => !o && !savingMoodEdit && setMoodEdit(null)}>
        <DrawerContent className="px-5 pb-8 max-h-[88vh]">
          <DrawerHeader className="px-0 pt-2">
            <DrawerTitle className="text-2xl">Ändra känsla</DrawerTitle>
          </DrawerHeader>
          {moodEdit && (
            <div className="space-y-5">
              <MoodSliderRow
                label="Tyngd / nedstämdhet"
                value={moodEdit.heaviness}
                set={(n) => setMoodEdit(s => s ? { ...s, heaviness: n } : s)}
                tone="orange"
              />
              <MoodSliderRow
                label="Oro / ångest"
                value={moodEdit.anxiety}
                set={(n) => setMoodEdit(s => s ? { ...s, anxiety: n } : s)}
                tone="blue"
              />
              <MoodSliderRow
                label="Energi"
                value={moodEdit.energy}
                set={(n) => setMoodEdit(s => s ? { ...s, energy: n } : s)}
                tone="pink"
              />
              <Button
                onClick={saveMoodEdit}
                disabled={savingMoodEdit}
                variant="pill-strong"
                size="pill-lg"
                className="w-full"
              >
                {savingMoodEdit ? "Sparar…" : "Spara ändring"}
              </Button>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </AppShell>
  );
};

// === Entry row ===
const EntryRow = ({ e, i, onDelete }: { e: DayEntry; i: number; onDelete: () => void }) => (
  <li
    className="card-cream p-3.5 flex items-center gap-3 animate-fade-in-up"
    style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
  >
    <div className={`shrink-0 w-11 h-11 rounded-2xl grid place-items-center ${toneBg(e.tone)}`}>
      <AbstractIcon name={e.icon} size={22} color="currentColor" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[15px] font-extrabold leading-tight truncate">{e.title}</p>
      <p className="text-[11px] text-text-secondary font-bold flex items-center gap-1.5">
        <Clock size={11} /> {timeLabel(e.ts)} · {e.detail}
      </p>
    </div>
    <button
      onClick={onDelete}
      aria-label="Ta bort logg"
      className="shrink-0 w-9 h-9 rounded-full grid place-items-center text-text-secondary hover:bg-surface-alt press-soft"
    >
      <Trash2 size={16} />
    </button>
  </li>
);

// ====================================================================
// === FORM: SLEEP ===
// ====================================================================
const SleepForm = ({ onSaved, userId }: { onSaved: () => void; userId: string | undefined }) => {
  const presets = [5, 6, 7, 8, 9];
  const [hours, setHours] = useState<number>(7);
  const [quality, setQuality] = useState<number>(6);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!userId) return;
    setBusy(true);
    // Upsert today's checkin: keep other fields intact
    const today = todayISO();
    const { data: existing } = await supabase
      .from("daily_checkins").select("id").eq("user_id", userId).eq("date", today).maybeSingle();

    const payload: any = { sleep_hours: hours, sleep_quality: quality };
    const { error } = existing
      ? await supabase.from("daily_checkins").update(payload).eq("id", existing.id)
      : await supabase.from("daily_checkins").insert({ ...payload, user_id: userId, date: today });
    setBusy(false);
    if (error) { toast.error("Kunde inte spara"); return; }
    toast.success(`${hours}h sömn loggad`);
    onSaved();
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-wider text-text-secondary mb-2">Hur många timmar?</p>
        <div className="flex gap-2 mb-3">
          {presets.map(p => (
            <button key={p}
              onClick={() => setHours(p)}
              className={`flex-1 py-3 rounded-2xl text-base font-extrabold tabular-nums press-soft ${
                hours === p ? toneBg("purple") : "bg-surface-alt text-foreground"
              }`}
            >{p}h</button>
          ))}
        </div>
        <div className="flex items-center gap-3 bg-surface-alt rounded-2xl p-2">
          <button onClick={() => setHours(Math.max(0, +(hours - 0.5).toFixed(1)))} className="w-10 h-10 rounded-full bg-surface grid place-items-center press-soft">
            <Minus size={16} />
          </button>
          <p className="flex-1 text-center text-2xl font-extrabold tabular-nums">{hours.toFixed(1)}h</p>
          <button onClick={() => setHours(Math.min(14, +(hours + 0.5).toFixed(1)))} className="w-10 h-10 rounded-full bg-surface grid place-items-center press-soft">
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs font-extrabold uppercase tracking-wider text-text-secondary mb-2">Kvalitet (0–10)</p>
        <div className="grid grid-cols-11 gap-1">
          {Array.from({ length: 11 }, (_, n) => (
            <button key={n}
              onClick={() => setQuality(n)}
              className={`aspect-square rounded-xl text-xs font-extrabold tabular-nums press-soft ${
                quality === n ? toneBg("purple") : "bg-surface-alt text-foreground"
              }`}
            >{n}</button>
          ))}
        </div>
      </div>

      <Button onClick={save} disabled={busy} variant="pill-strong" size="pill-lg" className="w-full">
        Spara sömn
      </Button>
    </div>
  );
};

// ====================================================================
// === FORM: MOVEMENT ===
// ====================================================================
const MovementForm = ({ onSaved, userId }: { onSaved: () => void; userId: string | undefined }) => {
  const presets: { slug: string; label: string; icon: IconName; mins: number; category: string }[] = [
    { slug: "walk", label: "Promenad", icon: "bike", mins: 30, category: "Rörelse" },
    { slug: "outdoor", label: "Ute i ljuset", icon: "weather-sun", mins: 15, category: "Rörelse" },
    { slug: "stretch", label: "Stretch", icon: "stretch-figure", mins: 10, category: "Rörelse" },
    { slug: "household", label: "Hushåll", icon: "house-soft", mins: 20, category: "Rörelse" },
    { slug: "bike", label: "Cykla", icon: "bike", mins: 30, category: "Rörelse" },
    { slug: "workout", label: "Träning", icon: "run-figure", mins: 45, category: "Rörelse" },
  ];
  const [pick, setPick] = useState(presets[0]);
  const [mins, setMins] = useState(presets[0].mins);
  const [delta, setDelta] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setMins(pick.mins); }, [pick]);

  const save = async () => {
    if (!userId) return;
    setBusy(true);
    const { error } = await supabase.from("activity_logs").insert({
      user_id: userId,
      date: todayISO(),
      activity_slug: pick.slug,
      label: pick.label,
      category: pick.category,
      icon: pick.icon,
      color: "pink",
      duration_minutes: mins,
      mood_delta: delta,
    });
    setBusy(false);
    if (error) { toast.error("Kunde inte spara"); return; }
    toast.success(`${pick.label} · ${mins} min loggad`);
    onSaved();
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-wider text-text-secondary mb-2">Vad gjorde du?</p>
        <div className="grid grid-cols-3 gap-2">
          {presets.map(p => (
            <button key={p.slug}
              onClick={() => setPick(p)}
              className={`p-3 rounded-2xl text-left press-soft flex flex-col gap-2 ${
                pick.slug === p.slug ? toneBg("pink") : "bg-surface-alt text-foreground"
              }`}
            >
              <AbstractIcon name={p.icon} size={20} color="currentColor" />
              <span className="text-xs font-extrabold leading-tight">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-extrabold uppercase tracking-wider text-text-secondary mb-2">Hur länge?</p>
        <div className="flex gap-2">
          {[10, 20, 30, 45, 60].map(m => (
            <button key={m}
              onClick={() => setMins(m)}
              className={`flex-1 py-3 rounded-2xl text-sm font-extrabold tabular-nums press-soft ${
                mins === m ? toneBg("pink") : "bg-surface-alt text-foreground"
              }`}
            >{m}m</button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-extrabold uppercase tracking-wider text-text-secondary mb-2">Hur kändes det?</p>
        <div className="grid grid-cols-5 gap-1">
          {[
            { v: -2, e: "😔" }, { v: -1, e: "🙁" }, { v: 0, e: "😐" }, { v: 1, e: "🙂" }, { v: 2, e: "😊" },
          ].map(x => (
            <button key={x.v}
              onClick={() => setDelta(x.v)}
              className={`aspect-square rounded-2xl text-2xl press-soft ${
                delta === x.v ? toneBg("pink") : "bg-surface-alt"
              }`}
            >{x.e}</button>
          ))}
        </div>
      </div>

      <Button onClick={save} disabled={busy} variant="pill-strong" size="pill-lg" className="w-full">
        Spara rörelse
      </Button>
    </div>
  );
};

// ====================================================================
// === FORM: MOOD ===
// ====================================================================
/** Delad slider-rad för både MoodForm (nylog) och mood-edit-drawern. */
const MoodSliderRow = ({
  label, value, set, tone,
}: { label: string; value: number; set: (n: number) => void; tone: Tone }) => (
  <div>
    <div className="flex items-baseline justify-between mb-2">
      <p className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">{label}</p>
      <p className="text-base font-extrabold tabular-nums">{value}/10</p>
    </div>
    <div className="grid grid-cols-11 gap-1">
      {Array.from({ length: 11 }, (_, n) => (
        <button key={n}
          onClick={() => set(n)}
          className={`aspect-square rounded-xl text-xs font-extrabold tabular-nums press-soft ${
            value === n ? toneBg(tone) : "bg-surface-alt text-foreground"
          }`}
        >{n}</button>
      ))}
    </div>
  </div>
);

const MoodForm = ({
  onSaved, userId,
}: {
  onSaved: (id: string, heaviness: number, anxiety: number, energy: number) => void;
  userId: string | undefined;
}) => {
  const [heaviness, setHeaviness] = useState<number>(5);
  const [anxiety, setAnxiety] = useState<number>(5);
  const [energy, setEnergy] = useState<number>(5);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!userId) return;
    setBusy(true);
    const today = todayISO();
    const { data: existing } = await supabase
      .from("daily_checkins").select("id").eq("user_id", userId).eq("date", today).maybeSingle();

    const payload: any = { mood_heaviness: heaviness, anxiety, energy };
    let savedId: string | null = existing?.id ?? null;
    if (existing) {
      const { error } = await supabase.from("daily_checkins").update(payload).eq("id", existing.id);
      if (error) { setBusy(false); toast.error("Kunde inte spara"); return; }
    } else {
      const { data: ins, error } = await supabase
        .from("daily_checkins")
        .insert({ ...payload, user_id: userId, date: today })
        .select("id").maybeSingle();
      if (error || !ins?.id) { setBusy(false); toast.error("Kunde inte spara"); return; }
      savedId = ins.id;
    }
    setBusy(false);
    if (!savedId) return;
    onSaved(savedId, heaviness, anxiety, energy);
  };

  return (
    <div className="space-y-5">
      <MoodSliderRow label="Tyngd / nedstämdhet" value={heaviness} set={setHeaviness} tone="orange" />
      <MoodSliderRow label="Oro / ångest" value={anxiety} set={setAnxiety} tone="blue" />
      <MoodSliderRow label="Energi" value={energy} set={setEnergy} tone="pink" />
      <Button onClick={save} disabled={busy} variant="pill-strong" size="pill-lg" className="w-full">
        Spara mående
      </Button>
    </div>
  );
};

// ====================================================================
// === FORM: MEDICATION ===
// ====================================================================
const MedicationForm = ({
  onSaved, userId, meds,
}: { onSaved: () => void; userId: string | undefined; meds: { id: string; name: string; dose: string | null }[] }) => {
  const navigate = useNavigate();
  const [pickedId, setPickedId] = useState<string | null>(meds[0]?.id ?? null);
  const [status, setStatus] = useState<"yes" | "skipped" | "partial">("yes");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!userId || !pickedId) return;
    setBusy(true);
    const { error } = await supabase.from("medication_logs").insert({
      user_id: userId,
      medication_id: pickedId,
      date: todayISO(),
      taken_status: status,
    });
    setBusy(false);
    if (error) { toast.error("Kunde inte spara"); return; }
    toast.success("Medicin loggad");
    onSaved();
  };

  if (meds.length === 0) {
    return (
      <div className="space-y-4">
        <div className="card-cream p-4">
          <p className="text-sm font-extrabold mb-1">Inga aktiva mediciner</p>
          <p className="text-xs text-text-secondary">Lägg till en medicin under Vård för att kunna logga den här.</p>
        </div>
        <Button
          variant="pill-strong"
          size="pill-lg"
          onClick={() => navigate("/vard")}
          className="w-full"
        >
          Gå till Vård <ChevronRight size={18} />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-wider text-text-secondary mb-2">Vilken medicin?</p>
        <div className="space-y-2">
          {meds.map(m => (
            <button key={m.id}
              onClick={() => setPickedId(m.id)}
              className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 press-soft ${
                pickedId === m.id ? toneBg("blue") : "bg-surface-alt text-foreground"
              }`}
            >
              <div className={`w-9 h-9 rounded-full grid place-items-center ${pickedId === m.id ? "bg-white/25" : "bg-blue-calm/15 text-blue-calm"}`}>
                <AbstractIcon name="pill" size={18} color="currentColor" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold leading-tight truncate">{m.name}</p>
                {m.dose && <p className="text-[11px] opacity-90 font-bold">{m.dose}</p>}
              </div>
              {pickedId === m.id && <Check size={18} strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-extrabold uppercase tracking-wider text-text-secondary mb-2">Status</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { k: "yes" as const, label: "Tagen", emoji: "✅" },
            { k: "partial" as const, label: "Delvis", emoji: "🟡" },
            { k: "skipped" as const, label: "Hoppade", emoji: "⛔" },
          ]).map(s => (
            <button key={s.k}
              onClick={() => setStatus(s.k)}
              className={`py-3 rounded-2xl text-xs font-extrabold press-soft flex flex-col items-center gap-1 ${
                status === s.k ? toneBg("blue") : "bg-surface-alt text-foreground"
              }`}
            >
              <span className="text-xl leading-none">{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={save} disabled={busy || !pickedId} variant="pill-strong" size="pill-lg" className="w-full">
        Spara medicin
      </Button>
    </div>
  );
};

export default QuickLog;
