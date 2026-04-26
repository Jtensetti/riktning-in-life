import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Illustration } from "@/components/Illustrations";
import { AbstractIcon, type IconName } from "@/components/AbstractIcon";
import { HeroBanner } from "@/components/HeroBanner";
import { ArrowDown, ArrowUp, ChevronRight, Minus, Sparkles } from "lucide-react";
import {
  burdenScore, functionScore, recoveryScore, stabilityScore, stabilityLabel,
  pctChange, splitWeeks, isoDaysAgo, generateInsights, type Checkin, type WeeklyFormScore,
} from "@/lib/metrics";
import { buildPriorities, type Priority } from "@/lib/priorities";

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

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const since = isoDaysAgo(20);
      const since7 = isoDaysAgo(6);
      const sinceTs = new Date(Date.now() - 7 * 86_400_000).toISOString();

      const [checkinsRes, formsRes, sessRes, actsRes, exRes] = await Promise.all([
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
      ]);

      setCheckins((checkinsRes.data ?? []) as Checkin[]);
      setSessions((sessRes.data ?? []) as unknown as SessionLite[]);
      setActivities((actsRes.data ?? []) as unknown as ActivityLite[]);
      setExercises((exRes.data ?? []) as ExerciseLite[]);

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

  const burdenC = useMemo(() => burdenScore(current, weeklyCurrent), [current, weeklyCurrent]);
  const burdenP = useMemo(() => burdenScore(previous, weeklyPrev), [previous, weeklyPrev]);
  const fnC = useMemo(() => functionScore(current), [current]);
  const fnP = useMemo(() => functionScore(previous), [previous]);
  const recC = useMemo(() => recoveryScore(current), [current]);
  const recP = useMemo(() => recoveryScore(previous), [previous]);
  const stabC = useMemo(() => stabilityScore(current), [current]);
  const stabP = useMemo(() => stabilityScore(previous), [previous]);

  const priorities = useMemo(() => buildPriorities(current), [current]);
  const insights = useMemo(() => generateInsights(current), [current]);

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
    return priorities
      .filter((p) => p.matchCategory)
      .map((p) => {
        const candidates = exercises.filter((e) => e.category === p.matchCategory);
        if (candidates.length === 0) return null;
        const ex = [...candidates].sort((a, b) => a.duration_minutes - b.duration_minutes)[0];
        return { priority: p, exercise: ex };
      })
      .filter((x): x is { priority: Priority; exercise: ExerciseLite } => x !== null);
  }, [priorities, exercises]);

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

      <h1 className="text-[32px] leading-[38px] mb-1">Vecka</h1>
      <p className="text-sm text-text-secondary mb-6">Riktning, actions, återhämtning — på en skärm.</p>

      {!baselineComplete && (
        <div className="card-cream p-4 mb-6 flex items-center gap-3 animate-pop-in">
          <Illustration name="baseline" className="w-24 h-auto rounded-xl shrink-0" />
          <div>
            <p className="text-sm font-extrabold mb-1">Baslinje byggs</p>
            <p className="text-xs text-text-secondary">Dag {total} av 14. Vi visar mönster och jämförelser när baslinjen är klar.</p>
          </div>
        </div>
      )}

      {/* === LAGER 1: RIKTNING === */}
      <section className="mb-7">
        <div className="flex items-baseline gap-2 mb-3">
          <h2 className="text-xl">Riktning</h2>
          <span className="text-xs font-bold text-text-secondary">Vad veckan visar</span>
        </div>
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
            <p className="text-xs text-text-secondary">Små steg som möter veckans mönster</p>
          </div>
          <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory flex gap-3 px-6 pb-3 -mb-3">
            {suggestedActions.map(({ priority, exercise }, i) => (
              <button
                key={priority.key}
                onClick={() => navigate(`/ovningar/${exercise.id}`)}
                className={`shrink-0 w-[78%] snap-start rounded-3xl ${colorBg(priority.color)} p-5 text-left shadow-soft press-soft animate-pop-in flex flex-col gap-3 min-h-[200px] relative overflow-hidden`}
                style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full ${priority.color === "yellow" ? "bg-foreground/10" : "bg-white/20"}`}>
                    {priority.title}
                  </span>
                </div>
                <div className="absolute right-3 top-3 opacity-90 pointer-events-none">
                  <AbstractIcon name="spark" size={48} color={priority.color === "yellow" ? colorHsl(priority.color) : "currentColor"} />
                </div>
                <div className="mt-auto">
                  <h4 className="text-[20px] leading-[24px] font-extrabold mb-1 pr-12">{exercise.title}</h4>
                  <p className="text-sm opacity-90 leading-snug mb-3">{priority.nudge}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold opacity-80">{exercise.duration_minutes} min · {exercise.category}</span>
                    <span className={`shrink-0 grid place-items-center w-9 h-9 rounded-full ${priority.color === "yellow" ? "bg-foreground text-background" : "bg-white/25"}`}>
                      <ChevronRight size={18} />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* === LAGER 3: STRAVA-STYLE ÅTERHÄMTNINGSHISTORIK === */}
      <section className="mb-7">
        <div className="mb-3">
          <h2 className="text-xl">Återhämtningshistorik</h2>
          <p className="text-xs text-text-secondary">Senaste 7 dagar — varje dag berättar något</p>
        </div>

        {/* Staplar-rad */}
        <div className="card-cream p-4 mb-3 animate-pop-in">
          <div className="flex items-end justify-between gap-1.5 h-24 mb-2">
            {timeline.map((d, i) => {
              const h = d.totalMinutes === 0 ? 6 : Math.max(8, (d.totalMinutes / maxMinutes) * 88);
              const dominant = d.acts[0]?.color ?? d.sess[0]?.exercises?.color ?? "green";
              const isEmpty = d.totalMinutes === 0;
              return (
                <div key={d.iso} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <div className="w-full flex items-end justify-center" style={{ height: 88 }}>
                    <div
                      className={`w-full rounded-t-lg ${isEmpty ? "bg-border-soft" : ""} animate-pop-in`}
                      style={{
                        height: h,
                        background: isEmpty ? undefined : colorHsl(dominant),
                        animationDelay: `${i * 40}ms`,
                      }}
                      title={`${d.totalMinutes} min`}
                    />
                  </div>
                  <span className="text-[10px] font-extrabold text-text-secondary uppercase tabular-nums">{dayShort(d.iso)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary border-t border-border-soft pt-2">
            <span>Aktiv tid per dag</span>
            <span className="tabular-nums">{timeline.reduce((s, d) => s + d.totalMinutes, 0)} min totalt</span>
          </div>
        </div>

        {/* Per-dag rader */}
        <div className="space-y-2">
          {timeline.slice().reverse().map((d, i) => {
            const date = new Date(d.iso);
            const isToday = d.iso === new Date().toISOString().split("T")[0];
            const dayLabel = isToday ? "Idag" : date.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "short" });
            const isEmpty = d.acts.length === 0 && d.sess.length === 0 && !d.checkin;
            return (
              <div
                key={d.iso}
                className="card-cream p-3.5 animate-fade-in-up"
                style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
              >
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <p className={`text-sm font-extrabold capitalize ${isToday ? "text-orange-deep" : ""}`}>{dayLabel}</p>
                  {d.totalMinutes > 0 && (
                    <p className="text-[11px] font-extrabold text-text-secondary tabular-nums">{d.totalMinutes} min</p>
                  )}
                </div>

                {isEmpty ? (
                  <p className="text-xs text-text-secondary italic">Ingen aktivitet loggad</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {d.acts.map((a) => (
                      <span
                        key={a.id}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${colorBg(a.color)} shadow-card`}
                      >
                        <AbstractIcon name={a.icon as IconName} size={12} color="currentColor" />
                        <span className="truncate max-w-[140px]">{a.label}</span>
                        {a.duration_minutes != null && <span className="opacity-80">· {a.duration_minutes}m</span>}
                      </span>
                    ))}
                    {d.sess.map((s) => s.exercises && (
                      <span
                        key={s.id}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${colorBg(s.exercises.color)} shadow-card`}
                      >
                        <AbstractIcon name="spark" size={12} color="currentColor" />
                        <span className="truncate max-w-[140px]">{s.exercises.title}</span>
                        <span className="opacity-80">· {s.exercises.duration_minutes}m</span>
                      </span>
                    ))}
                    {d.checkin && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold bg-surface border border-border-soft text-text-secondary">
                        <AbstractIcon name="pencil-soft" size={12} color="currentColor" />
                        Check-in
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Måttkort */}
      {current.length > 0 && (
        <section className="mb-7">
          <h2 className="text-xl mb-1">Jämfört med förra veckan</h2>
          <p className="text-xs text-text-secondary mb-3">Riktning över tid — inte dagsbetyg</p>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard title="Belastning" current={burdenC.value} prev={burdenP.value} invert
              note={burdenC.withWeekly ? undefined : "utan veckoskattning"} gated={!baselineComplete} />
            <MetricCard title="Funktion" current={fnC} prev={fnP} gated={!baselineComplete} />
            <MetricCard title="Återhämtning" current={recC} prev={recP} gated={!baselineComplete} />
            <MetricCard title="Stabilitet" current={stabC} prev={stabP} hideChange
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

      {topActivities.length > 0 && (
        <section className="mb-2">
          <h2 className="text-xl mb-1 flex items-center gap-2">
            <AbstractIcon name="heart-pulse" size={18} color="hsl(var(--pink-move))" />
            Vad lyfte dig?
          </h2>
          <p className="text-xs text-text-secondary mb-3">Aktiviteterna som gjorde störst skillnad denna vecka</p>
          <div className="space-y-2">
            {topActivities.map((a, i) => {
              const delta = a.avgDelta;
              const deltaLabel = delta >= 1.5 ? "Lyfte mycket" : delta >= 0.5 ? "Lyfte" : delta >= -0.5 ? "Neutralt" : "Drog ner";
              return (
                <div key={i} className={`rounded-3xl p-4 ${colorBg(a.color)} flex items-center gap-3 shadow-card animate-fade-in-up`}
                  style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}>
                  <div className="shrink-0 w-11 h-11 rounded-full bg-white/25 grid place-items-center">
                    <AbstractIcon name={a.icon as IconName} size={22} color="currentColor" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-[15px] truncate">{a.label}</p>
                    <p className="text-[11px] opacity-90 font-bold">{a.count} ggr · {deltaLabel}</p>
                  </div>
                </div>
              );
            })}
          </div>
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
  title, current, prev, invert, note, hideChange, labelOverride, gated,
}: {
  title: string;
  current: number | null;
  prev: number | null;
  invert?: boolean;
  note?: string;
  hideChange?: boolean;
  labelOverride?: string;
  gated?: boolean;
}) => {
  const c = current == null ? null : Math.round(current);
  const change = pctChange(current, prev);
  const positive = change == null ? null : (invert ? change < 0 : change > 0);

  return (
    <div className="card-cream p-4">
      <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">{title}</p>
      <p className={`text-3xl font-extrabold leading-none mb-2 ${gated ? "text-text-secondary" : ""}`}>{c ?? "—"}</p>
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

export default Week;
