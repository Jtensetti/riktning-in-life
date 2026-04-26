import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Illustration } from "@/components/Illustrations";
import { AbstractIcon, type IconName } from "@/components/AbstractIcon";
import { iconForActivity } from "@/lib/icons";
import { ColorCard, type CardTone } from "@/components/ColorCard";
import { HeroBanner } from "@/components/HeroBanner";
import { ArrowDown, ArrowUp, ChevronRight, Minus, Sparkles } from "lucide-react";
import {
  burdenScore, functionScore, recoveryScore, stabilityScore, stabilityLabel,
  pctChange, splitWeeks, isoDaysAgo, generateInsights, type Checkin, type WeeklyFormScore,
} from "@/lib/metrics";
import { buildPriorities, type Priority } from "@/lib/priorities";
import { refreshBaseline, loadBaseline, thresholdsFromBaseline } from "@/lib/baseline";
import { buildDayHighlights, buildLiftSummary } from "@/lib/dayInsights";
import { DayHighlightCards } from "@/components/DayHighlightCards";
import { ChartCard } from "@/components/charts/ChartCard";
import { ActivityBars } from "@/components/charts/ActivityBars";
import { StackedRecovery, type RecoveryDay } from "@/components/charts/StackedRecovery";
import { Sparkline } from "@/components/charts/Sparkline";
import { WeekDirectionChart, type DirectionPoint } from "@/components/charts/WeekDirectionChart";
import { TodayStepCard } from "@/components/TodayStepCard";
import {
  loadActionPreferences, saveActionPreferences, resolvePreferredTime, resolvePreferredLength, lengthRange,
  type ActionPreferences, type PreferredTime, type PreferredLength,
} from "@/lib/settings";

type ExerciseLite = { id: string; title: string; category: string; duration_minutes: number; color: string };
type SessionLite = {
  id: string;
  created_at: string;
  exercises: { title: string; category: string; duration_minutes: number; color: string } | null;
};
type ActivityLite = {
  id: string;
  date: string;
  label: string;
  icon: string;
  color: string;
  duration_minutes: number | null;
  mood_delta: number | null;
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

const colorHsl = (color: string): string => {
  switch (color) {
    case "orange": return "hsl(var(--orange-start))";
    case "blue": return "hsl(var(--blue-calm))";
    case "yellow": return "hsl(var(--yellow-journal))";
    case "purple": return "hsl(var(--purple-sleep))";
    case "pink": return "hsl(var(--pink-move))";
    case "green": return "hsl(var(--green-recovery))";
    default: return "hsl(var(--orange-start))";
  }
};

/** Normalisera godtycklig färg-sträng till en giltig CardTone (ColorCard). */
const asTone = (color: string): CardTone => {
  switch (color) {
    case "orange":
    case "blue":
    case "yellow":
    case "purple":
    case "pink":
    case "green":
      return color;
    default:
      return "orange";
  }
};

const last7Dates = (): string[] => {
  const out: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().split("T")[0]);
  }
  return out;
};

const dayShort = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE", { weekday: "short" }).slice(0, 1).toUpperCase();
};

const Week = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [weeklyCurrent, setWeeklyCurrent] = useState<WeeklyFormScore>({});
  const [weeklyPrev, setWeeklyPrev] = useState<WeeklyFormScore>({});
  const [topActivities, setTopActivities] = useState<{ label: string; icon: string; color: string; count: number; avgDelta: number }[]>([]);
  const [sessions, setSessions] = useState<SessionLite[]>([]);
  const [activities, setActivities] = useState<ActivityLite[]>([]);
  const [exercises, setExercises] = useState<ExerciseLite[]>([]);
  const [fetching, setFetching] = useState(true);
  // Råa 30-dagars samlingar för "Vad lyfter dig?"-evidens (Spår A)
  const [activitiesAll, setActivitiesAll] = useState<{ activity_slug: string; label: string; icon: string; color: string; mood_delta: number | null }[]>([]);
  const [sessionsAll, setSessionsAll] = useState<{ exercises: { title: string; category: string; color: string } | null; mood_before: number | null; mood_after: number | null; anxiety_before: number | null; anxiety_after: number | null }[]>([]);
  const [historyFilter, setHistoryFilter] = useState<"all" | "checkins" | "exercises" | "activeTime">("all");
  const [actionPrefs, setActionPrefs] = useState<ActionPreferences>(() => loadActionPreferences());

  const updatePrefs = (patch: Partial<ActionPreferences>) => {
    setActionPrefs((p) => {
      const next = { ...p, ...patch };
      saveActionPreferences(next);
      return next;
    });
  };

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const since = isoDaysAgo(60); // mer historik för baslinje + logg-konsekvens-insikt
      const since7 = isoDaysAgo(6);
      const since30 = isoDaysAgo(29);
      const sinceTs = new Date(Date.now() - 30 * 86_400_000).toISOString();

      const [checkinsRes, formsRes, sessRes, actsRes, exRes, actsAllRes, sessAllRes] = await Promise.all([
        supabase
          .from("daily_checkins")
          .select("id,date,mood_heaviness,anxiety,guilt_selfcriticism,hopelessness,energy,getting_started,function_score,daytime_bed_sofa_time_minutes,sleep_hours,sleep_quality,movement_today,meaningful_activity,safety_status")
          .eq("user_id", user.id).gte("date", since).order("date", { ascending: true }),
        supabase
          .from("weekly_forms")
          .select("type,total_score,date")
          .eq("user_id", user.id).gte("date", since).order("date", { ascending: false }),
        supabase
          .from("exercise_sessions")
          .select("id,created_at,exercises(title,category,duration_minutes,color)")
          .eq("user_id", user.id).gte("created_at", sinceTs).order("created_at", { ascending: false }),
        supabase
          .from("activity_logs")
          .select("id,date,label,icon,color,duration_minutes,mood_delta,activity_slug")
          .eq("user_id", user.id).gte("date", since7).order("date", { ascending: false }),
        supabase
          .from("exercises")
          .select("id,title,category,duration_minutes,color"),
        supabase
          .from("activity_logs")
          .select("activity_slug,label,icon,color,mood_delta")
          .eq("user_id", user.id).gte("date", since30),
        supabase
          .from("exercise_sessions")
          .select("mood_before,mood_after,anxiety_before,anxiety_after,exercises(title,category,color)")
          .eq("user_id", user.id).gte("created_at", sinceTs),
      ]);

      setCheckins((checkinsRes.data ?? []) as Checkin[]);
      setSessions((sessRes.data ?? []) as unknown as SessionLite[]);
      setActivities((actsRes.data ?? []) as unknown as ActivityLite[]);
      setExercises((exRes.data ?? []) as ExerciseLite[]);
      setActivitiesAll((actsAllRes.data ?? []) as any[]);
      setSessionsAll((sessAllRes.data ?? []) as any[]);

      // Spår D: uppdatera personlig baslinje när vi har ≥14 dagar.
      refreshBaseline((checkinsRes.data ?? []) as Checkin[]);

      const d7 = isoDaysAgo(6);
      const d14 = isoDaysAgo(13);
      const cur: WeeklyFormScore = {};
      const prev: WeeklyFormScore = {};
      for (const f of formsRes.data ?? []) {
        const target = f.date >= d7 ? cur : (f.date >= d14 ? prev : null);
        if (!target) continue;
        const t = f.type as "phq9" | "gad7" | "who5";
        if (target[t] == null) target[t] = Number(f.total_score);
      }
      setWeeklyCurrent(cur);
      setWeeklyPrev(prev);

      if (actsRes.data) {
        const map = new Map<string, { label: string; icon: string; color: string; count: number; sumDelta: number }>();
        for (const r of actsRes.data as any[]) {
          const key = r.activity_slug;
          const cur = map.get(key) ?? { label: r.label, icon: r.icon, color: r.color, count: 0, sumDelta: 0 };
          cur.count += 1;
          cur.sumDelta += Number(r.mood_delta ?? 0);
          map.set(key, cur);
        }
        const arr = Array.from(map.values())
          .map((v) => ({ label: v.label, icon: v.icon, color: v.color, count: v.count, avgDelta: v.sumDelta / v.count }))
          .sort((a, b) => (b.avgDelta - a.avgDelta) || (b.count - a.count))
          .slice(0, 3);
        setTopActivities(arr);
      }

      setFetching(false);
    };
    load();
  }, [user]);

  const total = checkins.length;
  const baselineComplete = total >= 14;
  const { current, previous } = useMemo(() => splitWeeks(checkins), [checkins]);

  // Spår D: läs personliga trösklar (uppdateras i load ovan).
  const thresholds = useMemo(() => thresholdsFromBaseline(loadBaseline()), [checkins.length]);

  const burdenC = useMemo(() => burdenScore(current, weeklyCurrent), [current, weeklyCurrent]);
  const burdenP = useMemo(() => burdenScore(previous, weeklyPrev), [previous, weeklyPrev]);
  const fnC = useMemo(() => functionScore(current), [current]);
  const fnP = useMemo(() => functionScore(previous), [previous]);
  const recC = useMemo(() => recoveryScore(current), [current]);
  const recP = useMemo(() => recoveryScore(previous), [previous]);
  const stabC = useMemo(() => stabilityScore(current), [current]);
  const stabP = useMemo(() => stabilityScore(previous), [previous]);

  const priorities = useMemo(() => buildPriorities(current, thresholds), [current, thresholds]);
  // Spår E: skicka full historik så vi kan upptäcka logg-konsekvens-mönster.
  const insights = useMemo(() => generateInsights(current, checkins), [current, checkins]);

  // Spår B: bästa & tyngsta dag.
  const dayHighlights = useMemo(() => buildDayHighlights(current), [current]);

  // Spår A: bevisbaserad lift-summary (lifters + drainers).
  const liftSummary = useMemo(
    () => buildLiftSummary(activitiesAll, sessionsAll),
    [activitiesAll, sessionsAll],
  );

  /** Per-dag Riktning (0–100, högre = bättre) för senaste 7 dagar.
   *  Riktning = 100 − burden för dagens checkin. Saknas dagen → null. */
  const directionSeries: DirectionPoint[] = useMemo(() => {
    return last7Dates().map((iso) => {
      const c = checkins.find((x) => x.date === iso);
      if (!c) return { date: iso, value: null };
      const { value } = burdenScore([c]);
      return { date: iso, value: value == null ? null : Math.max(0, Math.min(100, 100 - value)) };
    });
  }, [checkins]);

  const timeline = useMemo(() => {
    const days = last7Dates();
    return days.map((iso) => {
      const acts = activities.filter((a) => a.date === iso);
      const sess = sessions.filter((s) => s.created_at.split("T")[0] === iso);
      const checkin = checkins.find((c) => c.date === iso);
      const totalMinutes =
        acts.reduce((s, a) => s + (a.duration_minutes ?? 0), 0) +
        sess.reduce((s, x) => s + (x.exercises?.duration_minutes ?? 0), 0);
      return { iso, acts, sess, checkin, totalMinutes };
    });
  }, [activities, sessions, checkins]);

  const maxMinutes = useMemo(
    () => Math.max(60, ...timeline.map((d) => d.totalMinutes)),
    [timeline],
  );

  const suggestedActions = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const timeBucket = resolvePreferredTime(actionPrefs.time, hour);
    const lenBucket = resolvePreferredLength(actionPrefs.length, hour);
    const [lenMin, lenMax] = lengthRange(lenBucket);
    const lenIdeal = (lenMin + lenMax) / 2;

    // Räkna hur ofta varje kategori dykt upp i loggar/sessions senaste veckan
    // — det fungerar som en mjuk "användaren gillar X"-signal.
    const catCount = new Map<string, number>();
    for (const a of activities) catCount.set(a.color, (catCount.get(a.color) ?? 0) + 1);
    for (const s of sessions) {
      const cat = s.exercises?.category ?? "";
      if (cat) catCount.set(cat, (catCount.get(cat) ?? 0) + 1);
    }

    // Vilka övningar har redan körts senaste 7 dagarna? (avoid-repeat)
    const recentExerciseTitles = new Set(
      sessions.map((s) => s.exercises?.title).filter((t): t is string => !!t),
    );

    // Tid-på-dygn-passform per kategori. Hög = bra match.
    const timeFitForCategory = (category: string): number => {
      if (timeBucket === "morning") {
        if (category === "Kom igång" || category === "Rör dig mjukt") return 1;
        if (category === "Sov bättre") return -0.6;
        return 0.3;
      }
      if (timeBucket === "evening") {
        if (category === "Sov bättre" || category === "Lugna kroppen" || category === "Bryt ältande") return 1;
        if (category === "Kom igång") return -0.8;
        return 0.2;
      }
      // dag
      if (category === "Sociala mikrosteg" || category === "Mat & humör" || category === "Rör dig mjukt") return 0.7;
      return 0.3;
    };

    return priorities
      .filter((p) => p.matchCategory)
      .map((p) => {
        const candidates = exercises.filter((e) => e.category === p.matchCategory);
        if (candidates.length === 0) return null;

        // Personlig poäng per kandidat
        const scored = candidates.map((ex) => {
          let score = 50;

          // Längd-passform: glockenkurva runt ideal-längd inom valt span.
          const inRange = ex.duration_minutes >= lenMin && ex.duration_minutes <= lenMax;
          const delta = Math.abs(ex.duration_minutes - lenIdeal);
          if (inRange) score += 20 - Math.min(15, delta);
          else score -= Math.min(25, delta * 1.5);

          // Tid-på-dygn × kategori
          score += timeFitForCategory(ex.category) * 18;

          // Tidigare beteende: mjuk bonus om kategorin är vanlig hos användaren
          score += Math.min(10, (catCount.get(ex.category) ?? 0) * 2);

          // Undvik upprepning av exakt samma övning
          if (recentExerciseTitles.has(ex.title)) score -= 18;

          return { ex, score };
        }).sort((a, b) => b.score - a.score);

        return { priority: p, exercise: scored[0].ex, fitScore: scored[0].score };
      })
      .filter((x): x is { priority: Priority; exercise: ExerciseLite; fitScore: number } => x !== null);
  }, [priorities, exercises, activities, sessions, actionPrefs]);

  // Data till "Dagens lilla steg" — uppdateras automatiskt när checkins/activities/sessions ändras.
  const todayIso = new Date().toISOString().split("T")[0];
  const todayCheckin = useMemo(() => {
    const c = checkins.find((x) => x.date === todayIso);
    if (!c) return null;
    return {
      mood_heaviness: c.mood_heaviness ?? null,
      anxiety: c.anxiety ?? null,
      energy: c.energy ?? null,
      function_score: c.function_score ?? null,
      sleep_hours: c.sleep_hours == null ? null : Number(c.sleep_hours),
      safety_status: c.safety_status ?? null,
    };
  }, [checkins, todayIso]);

  const recentSessionsForRec = useMemo(
    () => sessions.map((s) => ({
      category: s.exercises?.category ?? "",
      created_at: s.created_at,
    })),
    [sessions],
  );

  const loggedToday = useMemo(
    () => activities.filter((a) => a.date === todayIso).length
      + sessions.filter((s) => s.created_at.split("T")[0] === todayIso).length,
    [activities, sessions, todayIso],
  );

  const exercisesForRec = useMemo(
    () => exercises.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      type: "",
      duration_minutes: e.duration_minutes,
      description: "",
      color: e.color,
    })),
    [exercises],
  );

  if (loading || fetching) {
    return <AppShell><div className="h-40 rounded-3xl bg-surface-alt animate-pulse" /></AppShell>;
  }

  return (
    <AppShell>
      <HeroBanner
        tone="var(--green-recovery)"
        icon="pie"
        iconColor="hsl(var(--surface))"
        iconAccent="hsl(var(--yellow-journal))"
      />

      <h1 className="text-[32px] leading-[38px] mb-1">Insikter</h1>
      <p className="text-sm text-text-secondary mb-5">Riktning, actions, återhämtning — på en skärm.</p>

      <button
        onClick={() => navigate("/rapport/vecka")}
        className="w-full card-soft p-4 mb-6 flex items-center gap-3 text-left press-soft animate-fade-in-up"
      >
        <div className="w-11 h-11 rounded-2xl bg-blue-calm/15 grid place-items-center shrink-0">
          <AbstractIcon name="bookmark-soft" size={20} color="hsl(var(--blue-calm))" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-extrabold">Klinisk veckorapport</div>
          <div className="text-xs text-text-secondary">Senaste 7 dagar som PDF — sömn, rörelse, journal, medicin.</div>
        </div>
        <ChevronRight size={18} className="text-text-secondary shrink-0" />
      </button>

      {!baselineComplete && (
        <div className="card-cream p-4 mb-6 flex items-center gap-3 animate-pop-in">
          <Illustration name="baseline" className="w-24 h-auto rounded-xl shrink-0" />
          <div>
            <p className="text-sm font-extrabold mb-1">Baslinje byggs</p>
            <p className="text-xs text-text-secondary">Dag {total} av 14. Vi visar mönster och jämförelser när baslinjen är klar.</p>
          </div>
        </div>
      )}

      {/* Dagens lilla steg — uppdateras live när nya loggar/check-ins kommer in */}
      <section className="mb-6">
        <TodayStepCard
          exercises={exercisesForRec}
          todayCheckin={todayCheckin}
          recentSessions={recentSessionsForRec}
          loggedToday={loggedToday}
        />
      </section>

      {/* === LAGER 1: RIKTNING === */}
      <section className="mb-7">
        <div className="flex items-baseline gap-2 mb-3">
          <h2 className="text-xl">Riktning</h2>
          <span className="text-xs font-bold text-text-secondary">Vad veckan visar</span>
        </div>

        <div className="mb-3">
          <ChartCard
            title="Veckans riktning"
            subtitle="7 dagar · högre = bättre dag"
            tone="green"
            ariaSummary="Linjediagram över veckans riktning, sju dagar, skala noll till hundra."
          >
            <WeekDirectionChart data={directionSeries} />
            <dl className="mt-3 pt-3 border-t border-border-soft grid grid-cols-1 gap-1.5 text-[11px] leading-snug text-text-secondary">
              <div className="flex items-baseline gap-2">
                <dt className="font-extrabold text-foreground/80 shrink-0">Riktning</dt>
                <dd>= 100 − dagens belastning. Högre = lättare dag.</dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="shrink-0" aria-hidden>
                  <span
                    className="inline-block w-3 h-3 rounded-full bg-surface align-middle"
                    style={{ border: "1.5px dashed hsl(var(--text-secondary))", opacity: 0.7 }}
                  />
                </dt>
                <dd>Streckad ring = check-in saknas för dagen.</dd>
              </div>
            </dl>
          </ChartCard>
        </div>

        {/* Spår B: bästa & tyngsta dag — förklarar varför linjen ser ut som den gör */}
        <DayHighlightCards data={dayHighlights} />

        <div className="space-y-3">
          {priorities.map((p, i) => (
            <PriorityCard key={p.key} p={p} rank={i} />
          ))}
        </div>
      </section>

      {/* === LAGER 2: HEADSPACE-STYLE ACTIONS === */}
      {suggestedActions.length > 0 && (
        <section className="mb-7 -mx-6">
          <div className="px-6 mb-3">
            <h2 className="text-xl">Föreslagna handlingar</h2>
            <p className="text-xs text-text-secondary">Små steg som möter veckans mönster — anpassat efter dig</p>
          </div>

          {/* Preferens-kontroller: tid på dagen + längd. "Auto" är default. */}
          <div className="px-6 mb-3 space-y-2">
            <PrefRow
              label="När"
              value={actionPrefs.time}
              options={[
                { key: "auto", label: "Auto" },
                { key: "morning", label: "Morgon" },
                { key: "day", label: "Dag" },
                { key: "evening", label: "Kväll" },
              ]}
              onChange={(v) => updatePrefs({ time: v as PreferredTime })}
            />
            <PrefRow
              label="Längd"
              value={actionPrefs.length}
              options={[
                { key: "auto", label: "Auto" },
                { key: "short", label: "≤5 min" },
                { key: "medium", label: "6–12 min" },
                { key: "long", label: "13+ min" },
              ]}
              onChange={(v) => updatePrefs({ length: v as PreferredLength })}
            />
          </div>

          <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory flex gap-3 px-6 pb-3 -mb-3">
            {suggestedActions.map(({ priority, exercise }, i) => {
              const tone = asTone(priority.color);
              const onYellow = tone === "yellow";
              return (
                <ColorCard
                  key={priority.key}
                  tone={tone}
                  icon="spark"
                  iconAccent={onYellow ? colorHsl("orange") : "hsl(var(--surface))"}
                  size="lg"
                  index={i}
                  onClick={() => navigate(`/ovningar/${exercise.id}`)}
                  ariaLabel={`${priority.title}: ${exercise.title}`}
                  className="shrink-0 w-[78%] snap-start"
                  eyebrow={{ label: priority.title }}
                  title={exercise.title}
                  reason={priority.nudge}
                  metaLeft={`${exercise.duration_minutes} min · ${exercise.category}`}
                  showChevron
                />
              );
            })}
          </div>
        </section>
      )}

      {/* === LAGER 3: STRAVA-STYLE ÅTERHÄMTNINGSHISTORIK === */}
      <section className="mb-7">
        <div className="mb-3">
          <h2 className="text-xl">Återhämtningshistorik</h2>
          <p className="text-xs text-text-secondary">Senaste 7 dagar — varje dag berättar något</p>
        </div>

        {/* Filter-pills: styr både diagram och per-dag-listan */}
        <div role="tablist" aria-label="Filtrera återhämtningshistorik" className="flex flex-wrap gap-1.5 mb-3">
          {([
            { key: "all", label: "Allt" },
            { key: "checkins", label: "Check-ins" },
            { key: "exercises", label: "Övningar" },
            { key: "activeTime", label: "Aktiv tid" },
          ] as const).map((f) => {
            const active = historyFilter === f.key;
            return (
              <button
                key={f.key}
                role="tab"
                aria-selected={active}
                onClick={() => setHistoryFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-extrabold press-soft transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "bg-surface-alt text-text-secondary hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Beräkna filtrerade serier en gång */}
        {(() => {
          const minutesFor = (d: typeof timeline[number]): number => {
            if (historyFilter === "checkins") return d.checkin?.sleep_hours ? Math.round(Number(d.checkin.sleep_hours) * 60) : 0;
            if (historyFilter === "exercises") return d.sess.reduce((s, x) => s + (x.exercises?.duration_minutes ?? 0), 0);
            if (historyFilter === "activeTime") return d.acts.reduce((s, a) => s + (a.duration_minutes ?? 0), 0)
              + d.sess.reduce((s, x) => s + (x.exercises?.duration_minutes ?? 0), 0);
            return d.totalMinutes;
          };
          const totalMin = timeline.reduce((s, d) => s + minutesFor(d), 0);

          const subtitleByFilter: Record<typeof historyFilter, string> = {
            all: "Senaste 7 dagar",
            checkins: "Sömn-minuter från dina check-ins",
            exercises: "Minuter från genomförda övningar",
            activeTime: "Aktiviteter + övningar tillsammans",
          };

          const totalLabelByFilter: Record<typeof historyFilter, string> = {
            all: `${totalMin} min totalt`,
            checkins: `${Math.round(totalMin / 60)} h sömn totalt`,
            exercises: `${totalMin} min övning`,
            activeTime: `${totalMin} min aktiv tid`,
          };

          const toneByFilter: Record<typeof historyFilter, "green" | "purple" | "blue" | "orange"> = {
            all: "green",
            checkins: "purple",
            exercises: "blue",
            activeTime: "orange",
          };

          const colorByFilter: Record<typeof historyFilter, string> = {
            all: "green",
            checkins: "purple",
            exercises: "blue",
            activeTime: "orange",
          };

          return (
            <>
              <ChartCard
                title="Aktiv tid"
                subtitle={subtitleByFilter[historyFilter]}
                tone={toneByFilter[historyFilter]}
                index={0}
                ariaSummary={`${totalLabelByFilter[historyFilter]} den här veckan.`}
                action={
                  <span className="text-[11px] font-extrabold text-text-secondary tabular-nums">
                    {totalLabelByFilter[historyFilter]}
                  </span>
                }
                className="mb-3"
              >
                <ActivityBars
                  data={timeline.map((d) => ({
                    iso: d.iso,
                    minutes: minutesFor(d),
                    color: historyFilter === "all"
                      ? (d.acts[0]?.color ?? d.sess[0]?.exercises?.color ?? "green")
                      : colorByFilter[historyFilter],
                  }))}
                  height={120}
                />
              </ChartCard>

              {historyFilter === "all" && (
                <ChartCard
                  title="Vad gjorde dagen av?"
                  subtitle="Minuter fördelat på sömn, rörelse, mående, återhämtning"
                  tone="orange"
                  index={1}
                  className="mb-3"
                >
                  <StackedRecovery
                    data={timeline.map<RecoveryDay>((d) => {
                      const sleep = d.checkin?.sleep_hours ? Math.round(Number(d.checkin.sleep_hours) * 60) : 0;
                      const movement = d.acts
                        .filter((a) => a.color === "pink" || a.color === "green")
                        .reduce((s, a) => s + (a.duration_minutes ?? 0), 0);
                      const mood = d.acts
                        .filter((a) => a.color === "orange" || a.color === "yellow")
                        .reduce((s, a) => s + (a.duration_minutes ?? 0), 0);
                      const recovery =
                        d.sess.reduce((s, x) => s + (x.exercises?.duration_minutes ?? 0), 0) +
                        d.acts
                          .filter((a) => a.color === "blue" || a.color === "purple")
                          .reduce((s, a) => s + (a.duration_minutes ?? 0), 0);
                      return { iso: d.iso, sleep, movement, mood, recovery };
                    })}
                    height={150}
                  />
                </ChartCard>
              )}
            </>
          );
        })()}

        {/* Per-dag rader — sorterade så att de mest relevanta dagarna för valt filter
            hamnar högst. "Idag" hålls alltid kvar i topp som ankare. */}
        <div className="space-y-2">
          {(() => {
            const todayIso = new Date().toISOString().split("T")[0];
            // Beräkna ett relevanspoäng per dag givet aktivt filter.
            const relevanceFor = (d: typeof timeline[number]): number => {
              if (historyFilter === "checkins") {
                if (!d.checkin) return 0;
                const sleep = d.checkin.sleep_hours ? Number(d.checkin.sleep_hours) * 60 : 0;
                return 1000 + sleep; // alla check-ins före tomma
              }
              if (historyFilter === "exercises") {
                return d.sess.reduce((s, x) => s + (x.exercises?.duration_minutes ?? 0), 0);
              }
              if (historyFilter === "activeTime") {
                return d.acts.reduce((s, a) => s + (a.duration_minutes ?? 0), 0)
                  + d.sess.reduce((s, x) => s + (x.exercises?.duration_minutes ?? 0), 0);
              }
              // "all" — totalvolym + bonus om check-in finns
              return d.totalMinutes + (d.checkin ? 10 : 0);
            };
            const sorted = timeline
              .map((d) => ({ d, score: relevanceFor(d), iso: d.iso }))
              .sort((a, b) => {
                // Idag alltid först
                if (a.iso === todayIso) return -1;
                if (b.iso === todayIso) return 1;
                // Sedan högst relevans
                if (b.score !== a.score) return b.score - a.score;
                // Sista tie-break: nyaste först
                return b.iso.localeCompare(a.iso);
              })
              .map((x) => x.d);

            return sorted.map((d, i) => {
              const date = new Date(d.iso);
              const isToday = d.iso === todayIso;
              const dayLabel = isToday ? "Idag" : date.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "short" });

              // Filtrera vad som faktiskt visas per dag enligt valt filter
              const showActs = historyFilter === "all" || historyFilter === "activeTime";
              const showSess = historyFilter === "all" || historyFilter === "exercises" || historyFilter === "activeTime";
              const showCheckin = historyFilter === "all" || historyFilter === "checkins";

              const visibleActs = showActs ? d.acts : [];
              const visibleSess = showSess ? d.sess : [];
              const visibleCheckin = showCheckin ? d.checkin : null;
              const isEmpty = visibleActs.length === 0 && visibleSess.length === 0 && !visibleCheckin;

              const dayMinutes =
                visibleActs.reduce((s, a) => s + (a.duration_minutes ?? 0), 0)
                + visibleSess.reduce((s, x) => s + (x.exercises?.duration_minutes ?? 0), 0);

              // Tomläges-CTA: deep-link till rätt flöde för valt filter.
              // Visa bara CTA på "Idag" (annars kan man inte logga retroaktivt utan extra friktion).
              const emptyCta: { label: string; to: string } | null = (() => {
                if (!isEmpty || !isToday) return null;
                if (historyFilter === "checkins") return { label: "Logga check-in", to: "/checkin" };
                if (historyFilter === "exercises") return { label: "Starta en övning", to: "/ovningar" };
                if (historyFilter === "activeTime") return { label: "Logga aktivitet", to: "/snabblogg" };
                return { label: "Logga något smått", to: "/snabblogg" };
              })();

              const emptyText = historyFilter === "checkins" ? "Ingen check-in"
                : historyFilter === "exercises" ? "Ingen övning"
                : historyFilter === "activeTime" ? "Ingen aktiv tid"
                : "Ingen aktivitet loggad";

              return (
                <div
                  key={d.iso}
                  className="card-cream p-3.5 animate-fade-in-up"
                  style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
                >
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <p className={`text-sm font-extrabold capitalize ${isToday ? "text-orange-deep" : ""}`}>{dayLabel}</p>
                    {dayMinutes > 0 && (
                      <p className="text-[11px] font-extrabold text-text-secondary tabular-nums">{dayMinutes} min</p>
                    )}
                  </div>

                  {isEmpty ? (
                    emptyCta ? (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-text-secondary">{emptyText} — börja här:</p>
                        <button
                          onClick={() => navigate(emptyCta.to)}
                          className="shrink-0 inline-flex items-center gap-1 rounded-full bg-foreground text-background px-3 py-1.5 text-[11px] font-extrabold press-soft shadow-card"
                        >
                          {emptyCta.label}
                          <ChevronRight size={12} strokeWidth={3} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-text-secondary italic">{emptyText}</p>
                    )
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {visibleActs.map((a) => (
                        <span
                          key={a.id}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${colorBg(a.color)} shadow-card`}
                        >
                          <AbstractIcon name={iconForActivity(a.icon)} size={12} color="currentColor" />
                          <span className="truncate max-w-[140px]">{a.label}</span>
                          {a.duration_minutes != null && <span className="opacity-80">· {a.duration_minutes}m</span>}
                        </span>
                      ))}
                      {visibleSess.map((s) => s.exercises && (
                        <span
                          key={s.id}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${colorBg(s.exercises.color)} shadow-card`}
                        >
                          <AbstractIcon name="spark" size={12} color="currentColor" />
                          <span className="truncate max-w-[140px]">{s.exercises.title}</span>
                          <span className="opacity-80">· {s.exercises.duration_minutes}m</span>
                        </span>
                      ))}
                      {visibleCheckin && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold bg-surface border border-border-soft text-text-secondary">
                          <AbstractIcon name="pencil-soft" size={12} color="currentColor" />
                          Check-in
                          {visibleCheckin.sleep_hours != null && (
                            <span className="opacity-80">· {Number(visibleCheckin.sleep_hours)}h sömn</span>
                          )}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </section>

      {/* Måttkort */}
      {current.length > 0 && (
        <section className="mb-7">
          <h2 className="text-xl mb-1">Jämfört med förra veckan</h2>
          <p className="text-xs text-text-secondary mb-3">Riktning över tid — inte dagsbetyg</p>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard title="Belastning" current={burdenC.value} prev={burdenP.value} invert tone="orange"
              spark={current.map((c) => (c.mood_heaviness == null ? null : c.mood_heaviness * 10))}
              note={burdenC.withWeekly ? undefined : "utan veckoskattning"} gated={!baselineComplete} />
            <MetricCard title="Funktion" current={fnC} prev={fnP} tone="green"
              spark={current.map((c) => (c.function_score == null ? null : c.function_score * 10))}
              gated={!baselineComplete} />
            <MetricCard title="Återhämtning" current={recC} prev={recP} tone="purple"
              spark={current.map((c) => (c.sleep_hours == null ? null : Number(c.sleep_hours) * 10))}
              gated={!baselineComplete} />
            <MetricCard title="Stabilitet" current={stabC} prev={stabP} hideChange tone="blue"
              spark={current.map((c) => (c.anxiety == null ? null : 100 - c.anxiety * 10))}
              labelOverride={stabilityLabel(stabC, stabP)} gated={!baselineComplete} />
          </div>
        </section>
      )}

      {insights.length > 0 && (
        <section className="mb-7">
          <h2 className="text-xl mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-orange-deep" />
            Mönster vi ser
          </h2>
          <div className="space-y-2">
            {insights.map((s, i) => (
              <div key={i} className="card-cream p-4 flex gap-3 items-start animate-fade-in-up"
                style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}>
                <AbstractIcon name="blob-smile" size={18} color="hsl(var(--orange-start))" />
                <p className="text-sm font-semibold leading-snug">{s}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(liftSummary.lifters.length > 0 || liftSummary.drainers.length > 0 || topActivities.length > 0) && (
        <section className="mb-2">
          <h2 className="text-xl mb-1 flex items-center gap-2">
            <AbstractIcon name="heart-care" size={18} color="hsl(var(--pink-move))" />
            Vad lyfte dig?
          </h2>
          <p className="text-xs text-text-secondary mb-3">
            {liftSummary.lifters.length > 0
              ? "Bevisat lyftande — minst 3 gångers data per aktivitet"
              : "Aktiviteterna som gjorde störst skillnad denna vecka"}
          </p>

          <div className="space-y-2">
            {(liftSummary.lifters.length > 0
              ? liftSummary.lifters
              : topActivities.map((a) => ({
                  ...a,
                  effectLabel:
                    a.avgDelta >= 1.5 ? "Lyfte mycket"
                    : a.avgDelta >= 0.5 ? "Lyfte"
                    : a.avgDelta >= -0.5 ? "Neutralt"
                    : "Drog ner",
                }))
            ).map((a, i) => {
              const deltaSign = a.avgDelta > 0 ? "+" : "";
              return (
                <ColorCard
                  key={i}
                  tone={asTone(a.color)}
                  icon={iconForActivity(a.icon)}
                  iconPosition="bottom-right"
                  size="sm"
                  index={i}
                  ariaLabel={`${a.label}: ${a.count} gånger, ${a.effectLabel}`}
                  className="!min-h-0"
                >
                  <p className="font-extrabold text-[15px] truncate">{a.label}</p>
                  <p className="text-[11px] opacity-90 font-bold">
                    {a.count} ggr · {a.effectLabel}
                    {Math.abs(a.avgDelta) >= 0.1 && (
                      <span className="ml-1 opacity-80">· {deltaSign}{a.avgDelta} humör</span>
                    )}
                  </p>
                </ColorCard>
              );
            })}
          </div>

          {liftSummary.drainers.length > 0 && (
            <div className="mt-3 rounded-2xl bg-surface-alt p-3 flex items-start gap-2 animate-fade-in-up">
              <AbstractIcon name="info-soft" size={16} color="hsl(var(--text-secondary))" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary mb-0.5">Värt att märka</p>
                <p className="text-sm leading-snug">
                  <span className="font-extrabold">{liftSummary.drainers[0].label}</span> verkar ta mer än den ger just nu
                  <span className="text-text-secondary"> · {liftSummary.drainers[0].count} ggr · {liftSummary.drainers[0].avgDelta} humör</span>
                </p>
              </div>
            </div>
          )}
        </section>
      )}
    </AppShell>
  );
};

const PriorityCard = ({ p, rank }: { p: Priority; rank: number }) => {
  const isTop = rank === 0;
  return (
    <div
      className={`rounded-3xl shadow-card animate-pop-in flex items-stretch gap-0 overflow-hidden ${isTop ? "ring-2 ring-foreground/10" : ""}`}
      style={{ animationDelay: `var(--stagger-${Math.min(rank, 4)})` }}
    >
      <div className={`shrink-0 w-2 ${colorBg(p.color)}`} aria-hidden />
      <div className="flex-1 min-w-0 bg-surface p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary tabular-nums">
            #{rank + 1} prioritet
          </span>
          {isTop && (
            <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-foreground text-background">
              Mest angeläget
            </span>
          )}
        </div>
        <h3 className="text-[17px] font-extrabold leading-tight mb-1">{p.title}</h3>
        <p className="text-xs text-text-secondary mb-2">{p.insight}</p>
        <p className="text-sm font-semibold leading-snug">{p.nudge}</p>
      </div>
    </div>
  );
};

const MetricCard = ({
  title, current, prev, invert, note, hideChange, labelOverride, gated, tone, spark,
}: {
  title: string;
  current: number | null;
  prev: number | null;
  invert?: boolean;
  note?: string;
  hideChange?: boolean;
  labelOverride?: string;
  gated?: boolean;
  tone?: "orange" | "blue" | "yellow" | "purple" | "pink" | "green";
  spark?: (number | null)[];
}) => {
  const c = current == null ? null : Math.round(current);
  const change = pctChange(current, prev);
  const positive = change == null ? null : (invert ? change < 0 : change > 0);

  return (
    <div className="card-cream p-4 relative overflow-hidden">
      <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">{title}</p>
      <div className="flex items-end justify-between gap-2 mb-2">
        <p className={`text-3xl font-extrabold leading-none ${gated ? "text-text-secondary" : ""}`}>{c ?? "—"}</p>
        {!gated && spark && spark.some((v) => v != null) && (
          <Sparkline values={spark} tone={tone ?? "orange"} width={56} height={22} />
        )}
      </div>
      {labelOverride ? (
        <div className="text-xs font-bold text-text-secondary">{labelOverride}</div>
      ) : hideChange || gated ? (
        <div className="text-xs font-bold text-text-secondary">{gated ? "Baslinje byggs" : ""}</div>
      ) : (
        <div className="flex items-center gap-1 text-xs font-bold">
          {change == null ? (
            <span className="text-text-secondary"><Minus size={12} className="inline" /> ingen jmf</span>
          ) : positive ? (
            <span className="text-green-recovery flex items-center gap-1"><ArrowUp size={12} /> {Math.abs(Math.round(change))}%</span>
          ) : (
            <span className="text-orange-deep flex items-center gap-1"><ArrowDown size={12} /> {Math.abs(Math.round(change))}%</span>
          )}
        </div>
      )}
      {note && <div className="text-[10px] font-semibold text-text-secondary mt-1">{note}</div>}
    </div>
  );
};

type PrefOption = { key: string; label: string };

/** Liten segmenterad rad för en enskild preferens. Stilen matchar history-filtret. */
const PrefRow = ({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: PrefOption[];
  onChange: (key: string) => void;
}) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary w-12 shrink-0">{label}</span>
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.key)}
            className={`px-2.5 py-1 rounded-full text-[12px] font-extrabold press-soft transition-colors ${
              active ? "bg-foreground text-background" : "bg-surface-alt text-text-secondary hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  </div>
);

export default Week;
