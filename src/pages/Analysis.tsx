import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ui-kit/ScreenHeader";
import { InsightCard } from "@/components/ui-kit/InsightCard";
import { ListCard } from "@/components/ui-kit/ListCard";
import { MetricTrendCard } from "@/components/MetricTrendCard";
import { buildMetricTrends, overallVerdict, loggedDaysLastWeek } from "@/lib/analysis";
import { buildLiftSummary } from "@/lib/dayInsights";
import { isoDaysAgo, type Checkin } from "@/lib/metrics";
import type { IconName } from "@/components/AbstractIcon";

type ActivityLite = {
  activity_slug: string;
  label: string;
  icon: string;
  color: string;
  mood_delta: number | null;
  date: string;
};

type SessionLite = {
  created_at: string;
  mood_before: number | null;
  mood_after: number | null;
  anxiety_before: number | null;
  anxiety_after: number | null;
  exercises: { title: string; category: string; color: string } | null;
};

const tonForColor = (c: string): IconName => "spark";
void tonForColor;

const Analysis = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [activities, setActivities] = useState<ActivityLite[]>([]);
  const [sessions, setSessions] = useState<SessionLite[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const since14 = isoDaysAgo(13);
      const since30 = isoDaysAgo(29);
      const sinceTs = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const [cRes, aRes, sRes] = await Promise.all([
        supabase
          .from("daily_checkins")
          .select("id,date,mood_heaviness,anxiety,guilt_selfcriticism,hopelessness,energy,getting_started,function_score,daytime_bed_sofa_time_minutes,sleep_hours,sleep_quality,movement_today,meaningful_activity,safety_status")
          .eq("user_id", user.id).gte("date", since14).order("date", { ascending: true }),
        supabase
          .from("activity_logs")
          .select("activity_slug,label,icon,color,mood_delta,date")
          .eq("user_id", user.id).gte("date", since30),
        supabase
          .from("exercise_sessions")
          .select("created_at,mood_before,mood_after,anxiety_before,anxiety_after,exercises(title,category,color)")
          .eq("user_id", user.id).gte("created_at", sinceTs),
      ]);
      if (cancelled) return;
      setCheckins((cRes.data ?? []) as Checkin[]);
      setActivities((aRes.data ?? []) as ActivityLite[]);
      setSessions((sRes.data ?? []) as unknown as SessionLite[]);
      setFetching(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const trends = useMemo(() => buildMetricTrends(checkins), [checkins]);
  const loggedDays = useMemo(() => loggedDaysLastWeek(checkins), [checkins]);
  const verdict = useMemo(() => overallVerdict(trends, loggedDays), [trends, loggedDays]);
  const lifts = useMemo(() => buildLiftSummary(activities, sessions), [activities, sessions]);
  const sparse = loggedDays < 4;

  return (
    <AppShell wide>
      <ScreenHeader
        screen="explore"
        title="Analys"
        subtitle="Vad rör sig åt rätt håll just nu?"
        topLeft={
          <button
            onClick={() => navigate("/insikter")}
            className="inline-flex items-center gap-1 text-sm font-bold opacity-90 press-soft"
          >
            <ArrowLeft size={18} /> Insikter
          </button>
        }
      />

      <InsightCard
        meta={`Den senaste veckan`}
        conclusion={verdict.headline}
        detail={verdict.detail}
        className="mb-8"
      >
        {!sparse && (
          <div className="flex items-center gap-3 mt-4 text-meta">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-recovery" aria-hidden />
              {verdict.better} bättre
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-surface-alt border border-border-soft" aria-hidden />
              {verdict.stable} stabila
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-risk/70" aria-hidden />
              {verdict.worse} sämre
            </span>
          </div>
        )}
      </InsightCard>

      <div className="lg:grid lg:grid-cols-[1.5fr_1fr] lg:gap-10">
        <section className="mb-8 lg:mb-0">
          <h2 className="text-h2 mb-4">Vad förändras</h2>
          {sparse && (
            <p className="text-body text-text-secondary mb-4">
              Logga några dagar till så kan vi börja jämföra vecka mot vecka.
            </p>
          )}
          <div className="space-y-4">
            {trends.map((t, i) => (
              <MetricTrendCard
                key={t.meta.metric}
                trend={t}
                index={i}
                hideDelta={sparse}
              />
            ))}
          </div>
        </section>

        <div className="space-y-6 lg:space-y-6">

      {(lifts.lifters.length > 0 || lifts.drainers.length > 0) && (
        <section className="mb-8">
          <h2 className="text-h2 mb-4">Det här verkar hjälpa</h2>
          <div className="space-y-4">
            {lifts.lifters.map((l, i) => (
              <ListCard
                key={`lift-${l.label}-${i}`}
                icon="spark"
                iconTone="green-recovery"
                title={l.label}
                meta={`${l.count} ggr · snittlyft ${l.avgDelta >= 0 ? "+" : ""}${l.avgDelta}`}
                trailing={
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-recovery/15 text-green-recovery px-2 py-1 text-meta normal-case tracking-normal">
                    {l.effectLabel}
                  </span>
                }
              />
            ))}
            {lifts.drainers.map((d, i) => (
              <ListCard
                key={`drain-${d.label}-${i}`}
                icon="spark"
                iconTone="purple-sleep"
                title={d.label}
                meta={`${d.count} ggr · snittlyft ${d.avgDelta >= 0 ? "+" : ""}${d.avgDelta}`}
                trailing={
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-bg text-red-risk/90 px-2 py-1 text-meta normal-case tracking-normal">
                    Drar
                  </span>
                }
              />
            ))}
          </div>
        </section>
      )}

      <button
        onClick={() => navigate("/insikter")}
        className="w-full ui-card-list flex items-center gap-3 press-soft text-left"
      >
        <div className="flex-1">
          <p className="text-meta text-text-secondary mb-0.5">Mer detaljer</p>
          <p className="text-card-title leading-tight">Öppna hela veckodashboarden</p>
        </div>
        <ChevronRight size={20} className="text-text-secondary" />
      </button>

      {fetching && checkins.length === 0 && (
        <div className="mt-6 h-32 rounded-3xl bg-surface-alt animate-pulse" aria-hidden />
      )}
    </AppShell>
  );
};

export default Analysis;
