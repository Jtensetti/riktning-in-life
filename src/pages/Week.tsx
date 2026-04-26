import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Illustration } from "@/components/Illustrations";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import {
  burdenScore, functionScore, recoveryScore, stabilityScore, stabilityLabel,
  pctChange, splitWeeks, isoDaysAgo, generateInsights, type Checkin, type WeeklyFormScore,
} from "@/lib/metrics";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, Tooltip,
} from "recharts";

const Week = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [weeklyCurrent, setWeeklyCurrent] = useState<WeeklyFormScore>({});
  const [weeklyPrev, setWeeklyPrev] = useState<WeeklyFormScore>({});
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const since = isoDaysAgo(20);
      const [checkinsRes, formsRes] = await Promise.all([
        supabase
          .from("daily_checkins")
          .select("id,date,mood_heaviness,anxiety,guilt_selfcriticism,hopelessness,energy,getting_started,function_score,daytime_bed_sofa_time_minutes,sleep_hours,sleep_quality,movement_today,meaningful_activity,safety_status")
          .eq("user_id", user.id)
          .gte("date", since)
          .order("date", { ascending: true }),
        supabase
          .from("weekly_forms")
          .select("type,total_score,date")
          .eq("user_id", user.id)
          .gte("date", since)
          .order("date", { ascending: false }),
      ]);
      setCheckins((checkinsRes.data ?? []) as Checkin[]);

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
      setFetching(false);
    };
    load();
  }, [user]);

  if (loading || fetching) {
    return <AppShell><div className="h-40 rounded-3xl bg-surface-alt animate-pulse" /></AppShell>;
  }

  const total = checkins.length;
  const baselineComplete = total >= 14;
  const { current, previous } = splitWeeks(checkins);

  const burdenC = burdenScore(current, weeklyCurrent);
  const burdenP = burdenScore(previous, weeklyPrev);
  const fnC = functionScore(current);
  const fnP = functionScore(previous);
  const recC = recoveryScore(current);
  const recP = recoveryScore(previous);
  const stabC = stabilityScore(current);
  const stabP = stabilityScore(previous);

  const chartData = current.map((c) => ({
    day: c.date.slice(8, 10),
    Belastning: Math.round(burdenScore([c]).value ?? 0),
    Funktion: Math.round(functionScore([c]) ?? 0),
  }));

  const avgSleep = (() => {
    const v = current.map(c => c.sleep_hours == null ? null : Number(c.sleep_hours)).filter((x): x is number => x != null);
    return v.length ? (v.reduce((s, x) => s + x, 0) / v.length) : null;
  })();
  const movementDays = current.filter(c => c.movement_today === "yes" || c.movement_today === "little").length;
  const insights = generateInsights(current);

  return (
    <AppShell>
      <h1 className="text-[32px] leading-[38px] mb-1">Vecka</h1>
      <p className="text-sm text-text-secondary mb-6">Riktning över tid – inte dagsbetyg.</p>

      {!baselineComplete && (
        <div className="card-cream p-4 mb-6 flex items-center gap-3">
          <Illustration name="baseline" className="w-24 h-auto rounded-xl shrink-0" />
          <div>
            <p className="text-sm font-extrabold mb-1">Baslinje byggs</p>
            <p className="text-xs text-text-secondary">
              Dag {total} av 14. Vi visar mönster och jämförelser när baslinjen är klar.
            </p>
          </div>
        </div>
      )}

      {current.length === 0 ? (
        <div className="card-cream p-8 text-center">
          <p className="text-base font-extrabold mb-2">Inga loggar än</p>
          <p className="text-sm text-text-secondary">Logga några dagar i Idag, så fylls vecka-vyn.</p>
        </div>
      ) : (
        <>
          <h2 className="text-xl mb-3">Jämfört med förra veckan</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <MetricCard
              title="Belastning"
              current={burdenC.value}
              prev={burdenP.value}
              invert
              note={burdenC.withWeekly ? undefined : "utan veckoskattning"}
              gated={!baselineComplete}
            />
            <MetricCard title="Funktion" current={fnC} prev={fnP} gated={!baselineComplete} />
            <MetricCard title="Återhämtning" current={recC} prev={recP} gated={!baselineComplete} />
            <MetricCard
              title="Stabilitet"
              current={stabC}
              prev={stabP}
              hideChange
              labelOverride={stabilityLabel(stabC, stabP)}
              gated={!baselineComplete}
            />
          </div>

          <div className="card-soft p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-extrabold">Senaste 7 dagar</h3>
              <Illustration name="week" className="w-16 h-auto" />
            </div>
            <div className="h-44 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <defs>
                    <linearGradient id="gFn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--green-recovery))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--green-recovery))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gBr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--orange-start))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--orange-start))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--text-secondary))" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16, border: "1px solid hsl(var(--border-soft))",
                      background: "hsl(var(--surface))", fontSize: 12,
                    }}
                    cursor={{ stroke: "hsl(var(--border-soft))", strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="Funktion" stroke="hsl(var(--green-recovery))" strokeWidth={3} fill="url(#gFn)" />
                  <Area type="monotone" dataKey="Belastning" stroke="hsl(var(--orange-start))" strokeWidth={3} fill="url(#gBr)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 text-xs font-bold mt-2 px-2">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-recovery" />Funktion</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-start" />Belastning</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="card-cream p-4">
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">Sömn / natt</p>
              <p className="text-2xl font-extrabold">{avgSleep != null ? `${avgSleep.toFixed(1)} h` : "—"}</p>
            </div>
            <div className="card-cream p-4">
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">Rörelsedagar</p>
              <p className="text-2xl font-extrabold">{movementDays} / {current.length}</p>
            </div>
          </div>

          {insights.length > 0 && (
            <>
              <h2 className="text-xl mb-3">Mönster vi ser</h2>
              <div className="space-y-3">
                {insights.map((s, i) => (
                  <div key={i} className="card-cream p-4 flex gap-3 items-start">
                    <span className="w-2 h-2 rounded-full bg-orange-start mt-2 shrink-0" />
                    <p className="text-sm font-semibold leading-snug">{s}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </AppShell>
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
        <div className="text-xs font-bold text-text-secondary">
          {gated ? "Baslinje byggs" : ""}
        </div>
      ) : (
        <div className="flex items-center gap-1 text-xs font-bold">
          {change == null ? (
            <span className="text-text-secondary"><Minus size={12} className="inline" /> ingen jmf</span>
          ) : positive ? (
            <span className="text-green-recovery flex items-center gap-1">
              <ArrowUp size={12} /> {Math.abs(Math.round(change))}%
            </span>
          ) : (
            <span className="text-orange-deep flex items-center gap-1">
              <ArrowDown size={12} /> {Math.abs(Math.round(change))}%
            </span>
          )}
        </div>
      )}
      {note && <div className="text-[10px] font-semibold text-text-secondary mt-1">{note}</div>}
    </div>
  );
};

export default Week;
