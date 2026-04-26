import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Illustration, colorIll } from "@/components/Illustrations";
import { AbstractIcon, weatherIcon, weatherIconColor, weatherIconAccent, type IconName } from "@/components/AbstractIcon";
import { HeroBanner } from "@/components/HeroBanner";
import { WeatherChip } from "@/components/WeatherChip";
import { WeatherPermissionCard } from "@/components/WeatherPermissionCard";
import { ChevronRight, Settings as SettingsIcon } from "lucide-react";
import { isOnboarded } from "@/lib/settings";
import { getTimeContext, type TimeContext } from "@/lib/timeContext";
import { useWeather, isOutdoorFriendly, weatherLabel, hasAskedWeatherPermission, isWeatherPermissionGranted, type Weather } from "@/lib/weather";
import { ForYouCarousel } from "@/components/ForYouCarousel";
import { recommendForToday, type Exercise as RecExercise, type Pick } from "@/lib/recommend";
import { Moon } from "lucide-react";
import { StreakRing } from "@/components/StreakRing";
import { QuickLogPills } from "@/components/QuickLogPills";
import { QuickLogFab } from "@/components/QuickLogFab";
import { ActivityPicker, type ActivityDraft } from "@/components/ActivityPicker";
import { countDaysInWindow, type StreakCounts } from "@/lib/streaks";
import { useRecentCheckins, seriesForField } from "@/hooks/useRecentCheckins";
import { toast } from "sonner";
import { refreshBaseline, loadBaseline, thresholdsFromBaseline } from "@/lib/baseline";
import { buildEveningPrediction } from "@/lib/dayInsights";
import { EveningPredictionCard } from "@/components/EveningPredictionCard";
import { buildForecast, FORECAST_VISIBLE_THRESHOLD } from "@/lib/forecast";
import { TomorrowForecastCard } from "@/components/TomorrowForecastCard";
import { heroVisualsFor } from "@/lib/heroVisuals";
import { readAndUpdateLastSeen, greetingFor as greetingForLastSeen, type LastSeen } from "@/lib/lastSeen";
import { getToneFor, phrasebookFor } from "@/lib/tone";

type Checkin = {
  id: string;
  date: string;
  mood_heaviness: number | null;
  anxiety: number | null;
  energy: number | null;
  function_score: number | null;
  sleep_hours: number | null;
  safety_status: string | null;
};

type TrendCheckin = {
  date: string;
  mood_heaviness: number | null;
  function_score: number | null;
  sleep_hours: number | null;
};

type Trend = { dir: "up" | "down" | "flat"; deltaLabel: string; tone: "good" | "warn" | "neutral" };

const isoDaysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

const avg = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
};

// goodWhenLower=true means lower values are better (e.g. mood_heaviness)
const computeTrend = (cs: TrendCheckin[], pick: (c: TrendCheckin) => number | null, goodWhenLower: boolean): { value: number | null; sub: string; trend: Trend } => {
  const d7 = isoDaysAgo(6);
  const d14 = isoDaysAgo(13);
  const cur = cs.filter(c => c.date >= d7).map(pick);
  const prev = cs.filter(c => c.date >= d14 && c.date < d7).map(pick);
  const a = avg(cur);
  const b = avg(prev);
  if (a == null) return { value: null, sub: "Inget loggat ännu", trend: { dir: "flat", deltaLabel: "—", tone: "neutral" } };
  if (b == null) return { value: a, sub: "Bygger baslinje", trend: { dir: "flat", deltaLabel: "Ny", tone: "neutral" } };
  const delta = a - b;
  const pct = b !== 0 ? Math.round((delta / b) * 100) : 0;
  const dir: "up" | "down" | "flat" = Math.abs(pct) < 3 ? "flat" : delta > 0 ? "up" : "down";
  const improved = goodWhenLower ? delta < 0 : delta > 0;
  const tone: Trend["tone"] = dir === "flat" ? "neutral" : improved ? "good" : "warn";
  const deltaLabel = dir === "flat" ? "Stabil" : `${delta > 0 ? "+" : ""}${pct}%`;
  return { value: a, sub: `Snitt 7 dagar`, trend: { dir, deltaLabel, tone } };
};

type RecentSession = {
  id: string;
  created_at: string;
  exercise_id: string | null;
  mood_before: number | null;
  mood_after: number | null;
  anxiety_before: number | null;
  anxiety_after: number | null;
  energy_before: number | null;
  energy_after: number | null;
  exercises: { title: string; category: string; duration_minutes: number; color: string } | null;
};

const todayISO = () => new Date().toISOString().split("T")[0];

const stateLabel = (c: Checkin | null) => {
  if (!c) return { title: "Inget loggat idag", sub: "Idag kräver vi inte mycket. Välj en liten start." };
  const m = c.mood_heaviness ?? 5;
  const a = c.anxiety ?? 5;
  const f = c.function_score ?? 5;
  if (c.safety_status === "active_thoughts" || c.safety_status === "acute") return { title: "Allvarlig signal", sub: "Det här ska inte hanteras som vanlig statistik." };
  if (m >= 7 && f <= 4) return { title: "Tungt men stabilt", sub: "Spara dagen som den var." };
  if (a >= 7) return { title: "Hög oro", sub: "Lugna kroppen först. Inget måste idag." };
  if (f >= 6) return { title: "Funktion rör sig åt rätt håll", sub: "Bra att du loggar." };
  return { title: "Stabilt nog", sub: "Det här räcker idag." };
};

const burdenLabel = (c: Checkin | null) => {
  if (!c) return "—";
  const score = ((c.mood_heaviness ?? 0) + (c.anxiety ?? 0)) / 2;
  if (score >= 8) return "Röd";
  if (score >= 6) return "Hög";
  if (score >= 3) return "Måttlig";
  return "Låg";
};
const fnLabel = (c: Checkin | null) => {
  if (!c || c.function_score == null) return "—";
  if (c.function_score >= 7) return "Hög";
  if (c.function_score >= 4) return "Måttlig";
  return "Låg";
};
const recoveryLabel = (c: Checkin | null) => {
  if (!c || c.sleep_hours == null) return "—";
  if (c.sleep_hours >= 7) return "Hög";
  if (c.sleep_hours >= 5) return "Måttlig";
  return "Låg";
};
const riskLabel = (c: Checkin | null) => {
  if (!c) return "Ingen signal";
  switch (c.safety_status) {
    case "acute": return "Akut";
    case "active_thoughts": return "Följ upp";
    case "passive_thoughts": return "Följ upp";
    default: return "Ingen signal";
  }
};

const formatDate = () => new Date().toLocaleDateString("sv-SE", {
  weekday: "long", day: "numeric", month: "long",
});

type Recommendation = { title: string; reason: string; color: string };

const recommend = (c: Checkin | null, t: TimeContext, w: Weather | null): Recommendation => {
  // Safety net: never recommend morning routines after morning, never outdoor in bad weather/dark.
  const outdoorOk = isOutdoorFriendly(w);
  const weatherNote = w ? `Vädret är ${weatherLabel(w.kind).toLowerCase()}` : null;

  // 1. Late night → wind down, never energizing.
  if (t.partOfDay === "night") {
    return { title: "Andning för insomning", reason: "Det är sent — landa kroppen mjukt", color: "bg-purple-sleep" };
  }

  // 2. Evening → no morning routines.
  if (t.partOfDay === "evening") {
    if ((c?.anxiety ?? 0) >= 6) return { title: "4 min längre utandning", reason: "Hög oro — lugna kroppen inför kvällen", color: "bg-blue-calm" };
    if ((c?.sleep_hours ?? 7) < 5) return { title: "Kvällslandning", reason: "För kort sömn igår — förbered en bättre natt", color: "bg-purple-sleep" };
    return { title: "Skriv tre rader", reason: "Stäng dagen mjukt", color: "bg-yellow-journal" };
  }

  // 3. Acute states first.
  if (c) {
    if ((c.anxiety ?? 0) >= 6) return { title: "4 min längre utandning", reason: "För hög oro", color: "bg-blue-calm" };
    if ((c.sleep_hours ?? 7) < 5) return { title: "Kvällslandning", reason: "För kort sömn", color: "bg-purple-sleep" };
  }

  // 4. Daylight + good weather → outdoor walk.
  if (outdoorOk && (c?.function_score ?? 5) >= 4 && (t.partOfDay === "morning" || t.partOfDay === "midday" || t.partOfDay === "afternoon")) {
    const sunny = w?.kind === "clear" || w?.kind === "partly";
    return {
      title: "15 min dagsljuspromenad",
      reason: sunny ? "Solen är uppe just nu — ta vara på det" : "Dagsljus räknas även när det är molnigt",
      color: "bg-pink-move",
    };
  }

  // 5. Bad weather or dark → indoor alternatives.
  if (w && (!w.isDaylight || w.kind === "rain" || w.kind === "snow" || w.kind === "thunder" || w.windMs > 12 || w.tempC < -5)) {
    if (t.partOfDay === "morning") {
      return { title: "8 min morgonstart", reason: weatherNote ? `${weatherNote} — börja inomhus` : "Mjuk start inomhus", color: "bg-orange-start" };
    }
    return { title: "Mjuk rörelse inomhus", reason: weatherNote ? `${weatherNote} — håll igång ändå` : "Håll kroppen igång", color: "bg-pink-move" };
  }

  // 6. Morning default.
  if (t.partOfDay === "morning") {
    return { title: "8 min morgonstart", reason: "En mjuk start på dagen", color: "bg-orange-start" };
  }

  // 7. Midday/afternoon default — first checkin missing.
  if (!c) return { title: "8 min morgonstart", reason: "En mjuk start på dagen", color: "bg-orange-start" };
  return { title: "15 min dagsljuspromenad", reason: "Stabilt – håll riktningen", color: "bg-pink-move" };
};

const colorOf = (bg: string) => bg.replace("bg-", "").includes("blue") ? "blue"
  : bg.includes("purple") ? "purple"
  : bg.includes("pink") ? "pink"
  : bg.includes("yellow") ? "yellow"
  : "orange";

const colorBg = (color: string) => {
  switch (color) {
    case "orange": return "bg-orange-start";
    case "blue": return "bg-blue-calm";
    case "yellow": return "bg-yellow-journal";
    case "purple": return "bg-purple-sleep";
    case "pink": return "bg-pink-move";
    case "green": return "bg-green-recovery";
    default: return "bg-cream-card";
  }
};

// Hero tone for the time of day.
const heroToneFor = (p: TimeContext["partOfDay"]): string => {
  switch (p) {
    case "morning": return "var(--orange-start)";
    case "midday": return "var(--orange-start)";
    case "afternoon": return "var(--blue-calm)";
    case "evening": return "var(--purple-sleep)";
    case "night": return "var(--purple-sleep)";
  }
};

const Today = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checkin, setCheckin] = useState<Checkin | null>(null);
  const [recent, setRecent] = useState<RecentSession[]>([]);
  const [trendData, setTrendData] = useState<TrendCheckin[]>([]);
  const [library, setLibrary] = useState<RecExercise[]>([]);
  const [featuredArticle, setFeaturedArticle] = useState<{ slug: string; title: string; excerpt: string; color: string; read_minutes: number } | null>(null);
  const [todayRoutine, setTodayRoutine] = useState<{ slug: string; title: string; description: string; color: string; ids: string[] } | null>(null);
  const [fetching, setFetching] = useState(true);
  const [time, setTime] = useState<TimeContext>(() => getTimeContext());
  const { weather, status: weatherStatus, requestLocation } = useWeather(true);
  const [permissionDismissed, setPermissionDismissed] = useState(false);
  const [streakCounts, setStreakCounts] = useState<StreakCounts>({ checkin: 0, activity: 0, session: 0 });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [streakReloadKey, setStreakReloadKey] = useState(0);
  const [activitiesToday, setActivitiesToday] = useState<number>(0);
  const [savingEveningGoal, setSavingEveningGoal] = useState(false);
  // Kontinuitet: kommer ihåg när användaren senast var här. Skrivs vid mount.
  const [lastSeen] = useState<LastSeen>(() => readAndUpdateLastSeen());

  // Refresh time context every minute so partOfDay stays accurate without reload.
  useEffect(() => {
    const id = setInterval(() => setTime(getTimeContext()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!isOnboarded()) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const tNow = getTimeContext();
      const wantTimeOfDay = tNow.partOfDay === "morning" ? "morning"
        : (tNow.partOfDay === "evening" || tNow.partOfDay === "night") ? "evening"
        : "afternoon";
      const [c, r, t, lib, art, seq] = await Promise.all([
        supabase
          .from("daily_checkins")
          .select("id,date,mood_heaviness,anxiety,energy,function_score,sleep_hours,safety_status")
          .eq("user_id", user.id)
          .eq("date", todayISO())
          .maybeSingle(),
        supabase
          .from("exercise_sessions")
          .select("id,created_at,exercise_id,mood_before,mood_after,anxiety_before,anxiety_after,energy_before,energy_after,exercises(title,category,duration_minutes,color)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("daily_checkins")
          .select("date,mood_heaviness,function_score,sleep_hours")
          .eq("user_id", user.id)
          .gte("date", isoDaysAgo(13))
          .order("date", { ascending: true }),
        supabase
          .from("exercises")
          .select("id,title,category,type,duration_minutes,description,color,mechanism"),
        supabase
          .from("learn_articles")
          .select("slug,title,excerpt,color,read_minutes")
          .order("created_at", { ascending: true })
          .limit(8),
        supabase
          .from("exercise_sequences")
          .select("slug,title,description,color,time_of_day,exercise_ids_json")
          .eq("time_of_day", wantTimeOfDay)
          .limit(1)
          .maybeSingle(),
      ]);
      setCheckin(c.data as Checkin | null);
      setRecent((r.data ?? []) as unknown as RecentSession[]);
      setTrendData((t.data ?? []) as TrendCheckin[]);
      setLibrary((lib.data ?? []) as RecExercise[]);
      if (art.data && art.data.length > 0) {
        // Rotera: dagens datum bestämmer vilken som är featured
        const idx = new Date().getDate() % art.data.length;
        setFeaturedArticle(art.data[idx] as typeof featuredArticle);
      }
      if (seq.data) {
        setTodayRoutine({
          slug: seq.data.slug,
          title: seq.data.title,
          description: seq.data.description,
          color: seq.data.color,
          ids: (seq.data.exercise_ids_json as unknown as string[]) ?? [],
        });
      }
      setFetching(false);
    };
    load();
  }, [user]);

  // Ladda kedjor (3 vanor × senaste 7 dagar). Separat så snabbloggning kan trigga reload utan att röra resten.
  useEffect(() => {
    if (!user) return;
    const since = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      return d.toISOString().split("T")[0];
    })();
    const sinceTs = new Date(Date.now() - 7 * 86_400_000).toISOString();
    (async () => {
      const [ci, al, es] = await Promise.all([
        supabase.from("daily_checkins").select("date").eq("user_id", user.id).gte("date", since),
        supabase.from("activity_logs").select("date").eq("user_id", user.id).gte("date", since),
        supabase.from("exercise_sessions").select("created_at").eq("user_id", user.id).gte("created_at", sinceTs),
      ]);
      const todayStr = new Date().toISOString().split("T")[0];
      setStreakCounts({
        checkin: countDaysInWindow((ci.data ?? []) as any[]),
        activity: countDaysInWindow((al.data ?? []) as any[]),
        session: countDaysInWindow((es.data ?? []) as any[]),
      });
      setActivitiesToday(((al.data ?? []) as any[]).filter((r) => r.date === todayStr).length);
    })();
  }, [user, streakReloadKey]);

  const handleQuickAdd = async (a: ActivityDraft) => {
    if (!user) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(10);
    const { error } = await supabase.from("activity_logs").insert({
      user_id: user.id,
      date: new Date().toISOString().split("T")[0],
      activity_slug: a.slug,
      label: a.label,
      category: a.category,
      icon: a.icon,
      color: a.color,
      duration_minutes: a.duration_minutes,
      mood_delta: a.mood_delta,
    });
    if (error) {
      toast.error("Kunde inte logga. Försök igen.");
      return;
    }
    toast.success(`${a.label} loggad`);
    setStreakReloadKey((k) => k + 1);
  };

  const saveEveningGoal = async () => {
    if (!user || savingEveningGoal) return;
    setSavingEveningGoal(true);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(10);
    const { error } = await supabase.from("activity_logs").insert({
      user_id: user.id,
      date: new Date().toISOString().split("T")[0],
      activity_slug: "evening-wind-down",
      label: "Mjuk kvällsstund",
      category: "Sov bättre",
      icon: "moon-soft",
      color: "purple",
      duration_minutes: 10,
      mood_delta: 1,
      note: "Auto-sparat kvällsmål",
    });
    setSavingEveningGoal(false);
    if (error) {
      toast.error("Kunde inte spara kvällsmålet.");
      return;
    }
    toast.success("Kvällsmål sparat 🌙", { description: "En liten sak räknas. Sov gott." });
    setStreakReloadKey((k) => k + 1);
  };

  // Hooks MUST run before any early return — kalla allt här uppe.
  const { data: recent7 } = useRecentCheckins(7);
  useEffect(() => {
    if (trendData.length >= 14) {
      // trendData saknar vissa fält som baseline.ts förväntar sig — vi gör en
      // bredare query nedan istället. Här kör vi bara compute om vi har full data.
    }
  }, [trendData]);

  if (loading || fetching) {
    return (
      <AppShell>
        <div className="h-40 rounded-3xl bg-surface-alt animate-pulse" />
      </AppShell>
    );
  }

  const state = stateLabel(checkin);
  const showSafety = checkin?.safety_status === "active_thoughts" || checkin?.safety_status === "acute";
  const rec = showSafety ? null : recommend(checkin, time, weather);

  // Smart "För dig just nu"-rekommendationer
  const recentForRec = recent
    .filter((s) => s.exercises)
    .map((s) => ({
      category: s.exercises!.category,
      created_at: s.created_at,
      exercise_id: s.exercise_id ?? undefined,
    }));
  const picks: Pick[] = showSafety ? [] : recommendForToday(library, checkin, time, weather, recentForRec);

  // 7-day insights
  const moodTrend = computeTrend(trendData, c => c.mood_heaviness, true);
  const sleepTrend = computeTrend(trendData, c => c.sleep_hours == null ? null : Number(c.sleep_hours), false);
  const funcTrend = computeTrend(trendData, c => c.function_score, false);

  // 7-dagars sparklines från senaste check-ins. Visas när minst 4 dagar har data.
  const moodSpark = seriesForField(recent7, 7, "mood_heaviness").values;
  const sleepSpark = seriesForField(recent7, 7, "sleep_hours").values;
  const funcSpark = seriesForField(recent7, 7, "function_score").values;
  const daysWithAnyData = recent7.filter((r) =>
    r.mood_heaviness != null || r.sleep_hours != null || r.function_score != null,
  ).length;
  const hasInsights = daysWithAnyData >= 4;

  // Personlig baslinje + kvällsprediktion. Trend-datan (14 dagar, full struktur)
  // räcker som källa. Evening prediction kräver minst 7 dagar.

  const baselineRow = loadBaseline();
  const thresholds = thresholdsFromBaseline(baselineRow);

  // Bygg en checkin-array kompatibel med dayInsights (vi har bara mood/sleep/func i trendData,
  // men buildEveningPrediction behöver också anxiety + bed/sofa). Vi använder den fullare
  // `recent7` när möjligt.
  const eveningPrediction = (() => {
    if (showSafety) return null;
    if (time.partOfDay !== "evening" && time.partOfDay !== "night") return null;
    // Kräv ≥7 dagar med någon data.
    if (recent7.filter((r) => r.mood_heaviness != null || r.anxiety != null).length < 7) return null;
    const recentAsCheckin = recent7.map((r) => ({
      id: r.date,
      date: r.date,
      mood_heaviness: r.mood_heaviness,
      anxiety: r.anxiety,
      guilt_selfcriticism: null,
      hopelessness: null,
      energy: r.energy,
      getting_started: null,
      function_score: r.function_score,
      daytime_bed_sofa_time_minutes: null,
      sleep_hours: r.sleep_hours,
      sleep_quality: null,
      movement_today: null,
      meaningful_activity: null,
      safety_status: null,
    }));
    const todayAsCheckin = checkin ? recentAsCheckin.find((r) => r.date === todayISO()) ?? null : null;
    return buildEveningPrediction(recentAsCheckin, todayAsCheckin, thresholds);
  })();
  void baselineRow; // använd-flagga: vi visar inte ett "personlig baslinje aktiv"-ord just nu

  // 2-dagars-prognos: visar ett "Gör detta imorgon"-kort när signalen är tydlig.
  // Bygger på samma 14-dagars-fönster som baseline; göms tyst när confidence är låg.
  const forecast = (() => {
    if (showSafety) return null;
    if (recent7.length < 4) return null;
    const f = buildForecast(
      recent7.map((r) => ({
        date: r.date,
        mood_heaviness: r.mood_heaviness,
        anxiety: r.anxiety,
        energy: r.energy,
        function_score: r.function_score,
        sleep_hours: r.sleep_hours == null ? null : Number(r.sleep_hours),
      })),
      thresholds,
    );
    return f.kind && f.confidence >= FORECAST_VISIBLE_THRESHOLD ? f : null;
  })();

  // Levande hero — tid + väder + säsong + dagens energi avgör ton, ikon och tempo.
  const hero = heroVisualsFor({
    time,
    weather,
    energy: checkin?.energy ?? null,
    safetyFlag: showSafety,
  });

  // Adaptiv ton — vad rubriker och CTA-knappen säger följer hur dagen ser ut.
  const tone = getToneFor(checkin, thresholds);
  const phrases = phrasebookFor(tone);

  // Hälsning anpassad efter när användaren senast var här.
  const greet = greetingForLastSeen(time.greeting, lastSeen);

  // Show permission card only once: not asked, no granted permission, not dismissed this session.
  const showWeatherPermission =
    !weather && !hasAskedWeatherPermission() && !isWeatherPermissionGranted() && !permissionDismissed;

  return (
    <AppShell>
      <HeroBanner
        tone={hero.tone}
        icon={hero.icon}
        iconColor={hero.iconColor}
        iconAccent={hero.iconAccent}
        mood={hero.mood}
        pattern={hero.pattern}
        topLeft={
          <button
            onClick={() => navigate("/installningar")}
            className="w-10 h-10 grid place-items-center rounded-full bg-surface shadow-card press-soft"
            aria-label="Inställningar"
          >
            <SettingsIcon size={18} className="text-foreground" strokeWidth={2.4} />
          </button>
        }
        topRight={weather ? <WeatherChip weather={weather} /> : undefined}
      />

      <header className="mb-6">
        <p className="text-sm font-extrabold text-orange-deep mb-1 animate-fade-in-up">{greet.headline}</p>
        <h1 className="text-[32px] leading-[38px]">Idag</h1>
        <p className="text-sm font-semibold text-text-secondary capitalize mt-1">{formatDate()}</p>
        {greet.sub && (
          <p className="text-sm text-text-secondary mt-2 animate-fade-in-up">{greet.sub}</p>
        )}
      </header>

      {showWeatherPermission && (
        <WeatherPermissionCard
          onAllow={() => requestLocation()}
          onDismiss={() => setPermissionDismissed(true)}
        />
      )}

      {showSafety && (
        <div className="rounded-3xl border-2 border-red-risk bg-red-bg p-5 mb-7 animate-pop-in">
          <div className="mb-3 -mx-1">
            <Illustration name="safety" className="w-full h-auto rounded-2xl" />
          </div>
          <h3 className="text-lg font-extrabold text-red-risk mb-2">Allvarlig signal</h3>
          <p className="text-sm text-foreground/80 mb-3">
            Det här ska inte hanteras som vanlig statistik. Kontakta vården, psykiatrisk akutmottagning, 1177 eller 112 vid akut fara. Kontakta också någon du litar på.
          </p>
          <Button
            onClick={() => navigate("/vard")}
            className="bg-red-risk hover:bg-red-risk/90 text-white rounded-full font-extrabold press-soft mr-2"
          >
            Gå till Vård
          </Button>
          <Button
            onClick={() => navigate("/krisplan")}
            variant="secondary"
            className="rounded-full font-extrabold press-soft mt-2"
          >
            Öppna min krisplan
          </Button>
        </div>
      )}

      {!showSafety && <StreakRing counts={streakCounts} className="mb-5" />}

      {/* Kvällsläge: efter kl 20 lyfter vi fram "Stäng dagen mjukt" istället för full check-in. */}
      {!showSafety && !checkin && (time.partOfDay === "evening" || time.partOfDay === "night") && (
        <section className="rounded-3xl bg-purple-sleep text-white p-5 mb-6 animate-pop-in shadow-soft">
          <div className="flex items-start gap-3 mb-3">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/20 grid place-items-center">
              <Moon size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[20px] leading-tight font-extrabold mb-1">Stäng dagen mjukt</h3>
              <p className="text-sm opacity-90">Tre snabba reglage. Ingen prestation — bara en mjuk avslutning.</p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/checkin")}
            className="w-full h-12 rounded-full bg-white text-foreground hover:bg-white/90 font-extrabold press-soft"
          >
            Logga kvällen
          </Button>
          {activitiesToday === 0 && (
            <button
              onClick={saveEveningGoal}
              disabled={savingEveningGoal}
              className={`mt-2 w-full h-12 rounded-full bg-white/15 hover:bg-white/25 text-white font-extrabold press-soft inline-flex items-center justify-center gap-2 transition-colors ${savingEveningGoal ? "opacity-60" : ""}`}
            >
              <Moon size={16} />
              {savingEveningGoal ? "Sparar…" : "Spara kvällsmål (10 min mjuk stund)"}
            </button>
          )}
          {activitiesToday > 0 && (
            <p className="mt-3 text-xs font-bold opacity-80 text-center">
              ✓ Du har redan loggat {activitiesToday} {activitiesToday === 1 ? "sak" : "saker"} idag.
            </p>
          )}
        </section>
      )}

      {/* State card — compact horizontal layout */}
      <section className="card-cream p-5 mb-7 animate-pop-in">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary mb-1">{phrases.whisper}</p>
            <h2 className="text-2xl mb-1">{state.title}</h2>
            <p className="text-sm text-text-secondary">{state.sub}</p>
          </div>
          <div className="shrink-0 -mr-1 -mt-1">
            <AbstractIcon name="blob-smile" size={68} color="hsl(var(--orange-start))" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-5">
          <Pill label="Belastning" value={burdenLabel(checkin)} />
          <Pill label="Funktion" value={fnLabel(checkin)} />
          <Pill label="Återhämtning" value={recoveryLabel(checkin)} />
          <Pill label="Risk" value={riskLabel(checkin)} accent={!!checkin?.safety_status && checkin.safety_status !== "none"} />
        </div>
        <Button
          onClick={() => navigate("/checkin")}
          className="w-full h-12 rounded-full bg-foreground hover:bg-foreground/90 text-background font-extrabold text-[17px] press-soft"
        >
          {checkin ? phrases.ctaUpdate : phrases.ctaLog}
        </Button>
      </section>

      {!showSafety && (
        <QuickLogPills
          onOpenPicker={() => setPickerOpen(true)}
          onLogged={() => setStreakReloadKey((k) => k + 1)}
        />
      )}

      {!showSafety && picks.length > 0 && (
        <ForYouCarousel picks={picks} />
      )}

      {eveningPrediction && <EveningPredictionCard prediction={eveningPrediction} />}

      {forecast && <TomorrowForecastCard forecast={forecast} exercises={library} />}

      {!showSafety && (
        <button
          onClick={() => navigate("/rapport/vecka")}
          className="w-full card-soft p-4 mb-6 flex items-center gap-3 text-left press-soft animate-fade-in-up"
        >
          <div className="w-11 h-11 rounded-2xl bg-blue-calm/15 grid place-items-center shrink-0">
            <AbstractIcon name="bookmark-soft" size={20} color="hsl(var(--blue-calm))" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-extrabold">Skapa klinisk veckorapport</div>
            <div className="text-xs text-text-secondary">Senaste 7 dagar som PDF — sömn, rörelse, journal, medicin + plats för läkarens anteckningar.</div>
          </div>
          <ChevronRight size={18} className="text-text-secondary shrink-0" />
        </button>
      )}


      {rec && (
        <>
          <h3 className="text-xl mb-3">Rekommenderat just nu</h3>
          <div className={`rounded-3xl ${rec.color} text-white p-1 mb-4 shadow-soft overflow-hidden`}>
            <div className="rounded-[20px] overflow-hidden mb-1">
              <Illustration name={colorIll(colorOf(rec.color))} className="w-full h-auto" />
            </div>
            <div className="px-4 pb-4 pt-1">
              <h4 className="text-2xl mb-1">{rec.title}</h4>
              <p className="text-sm opacity-90 mb-4">{rec.reason}</p>
              <Button
                onClick={() => navigate("/ovningar")}
                className="bg-white/20 hover:bg-white/30 text-white rounded-full font-extrabold backdrop-blur"
              >
                Starta <ChevronRight size={18} />
              </Button>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap mb-7">
            <Chip onClick={() => navigate("/ovningar")}>Andning 4 min</Chip>
            <Chip onClick={() => navigate("/journal")}>Skriv tre rader</Chip>
            <Chip onClick={() => navigate("/ovningar")}>Dagsljus 15 min</Chip>
          </div>
        </>
      )}

      {!showSafety && todayRoutine && todayRoutine.ids.length > 0 && (
        <section className="mb-7 animate-pop-in">
          <h3 className="text-xl mb-1">Dagens rutin</h3>
          <p className="text-sm text-text-secondary mb-3">Tre små steg som hänger ihop</p>
          <button
            onClick={() => navigate(`/ovningar/${todayRoutine.ids[0]}?seq=${todayRoutine.slug}`)}
            className={`w-full ${colorBg(todayRoutine.color)} ${todayRoutine.color === "yellow" ? "text-foreground" : "text-white"} rounded-3xl p-5 text-left shadow-soft press-soft flex items-center gap-3`}
          >
            <div className={`shrink-0 w-12 h-12 grid place-items-center rounded-2xl ${todayRoutine.color === "yellow" ? "bg-foreground/10" : "bg-white/20"}`}>
              <AbstractIcon name="play-soft-circle" size={22} color="currentColor" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[18px] leading-tight font-extrabold mb-0.5">{todayRoutine.title}</h4>
              <p className="text-xs opacity-90">{todayRoutine.description}</p>
            </div>
            <ChevronRight size={20} className="shrink-0" />
          </button>
        </section>
      )}

      {!showSafety && featuredArticle && (
        <section className="mb-7 animate-fade-in-up">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-xl">Lär dig något nytt</h3>
            <button
              onClick={() => navigate("/lar-dig")}
              className="text-xs font-extrabold text-orange-deep press-soft"
            >
              Se alla
            </button>
          </div>
          <button
            onClick={() => navigate(`/lar-dig/${featuredArticle.slug}`)}
            className="w-full card-cream p-4 text-left flex items-start gap-3 press-soft"
          >
            <div className={`shrink-0 w-12 h-12 grid place-items-center rounded-2xl ${colorBg(featuredArticle.color)} ${featuredArticle.color === "yellow" ? "text-foreground" : "text-white"}`}>
              <AbstractIcon name="book-open" size={22} color="currentColor" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary mb-0.5">
                {featuredArticle.read_minutes} min läsning
              </p>
              <h4 className="text-[16px] leading-tight font-extrabold mb-1">{featuredArticle.title}</h4>
              <p className="text-xs text-text-secondary leading-snug line-clamp-2">{featuredArticle.excerpt}</p>
            </div>
          </button>
        </section>
      )}

      {hasInsights && !showSafety && (
        <section className="mb-7">
          <h3 className="text-xl mb-1">Veckans riktning</h3>
          <p className="text-sm text-text-secondary mb-3">Senaste 7 dagarna · {daysWithAnyData} dagar loggade</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="animate-pop-in" style={{ animationDelay: "var(--stagger-0)" }}>
              <InsightCard
                label="Humör"
                value={moodTrend.value}
                suffix="/10"
                invert
                trend={moodTrend.trend}
                colorClass="bg-orange-start"
                spark={moodSpark}
                sparkTone="orange"
              />
            </div>
            <div className="animate-pop-in" style={{ animationDelay: "var(--stagger-1)" }}>
              <InsightCard
                label="Sömn"
                value={sleepTrend.value}
                suffix=" h"
                decimals={1}
                trend={sleepTrend.trend}
                colorClass="bg-purple-sleep"
                spark={sleepSpark}
                sparkTone="purple"
              />
            </div>
            <div className="animate-pop-in" style={{ animationDelay: "var(--stagger-2)" }}>
              <InsightCard
                label="Funktion"
                value={funcTrend.value}
                suffix="/10"
                trend={funcTrend.trend}
                colorClass="bg-green-recovery"
                spark={funcSpark}
                sparkTone="green"
              />
            </div>
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="mb-4">
          <h3 className="text-xl mb-3">Senaste aktivitet</h3>
          <ul className="relative pl-5 space-y-2">
            <span className="absolute left-1.5 top-2 bottom-2 w-px border-l-2 border-dashed border-[#D7D0C9]" aria-hidden />
            {recent.map((s, i) => {
              const ex = s.exercises;
              if (!ex) return null;
              const dot = colorBg(ex.color);
              const blobColor = (() => {
                switch (ex.color) {
                  case "orange": return "hsl(var(--orange-start))";
                  case "blue": return "hsl(var(--blue-calm))";
                  case "yellow": return "hsl(var(--yellow-journal))";
                  case "purple": return "hsl(var(--purple-sleep))";
                  case "pink": return "hsl(var(--pink-move))";
                  case "green": return "hsl(var(--green-recovery))";
                  default: return "hsl(var(--orange-start))";
                }
              })();
              const dateStr = new Date(s.created_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
              const deltas: { letter: string; delta: number; tone: "good" | "warn" }[] = [];
              const pushDelta = (letter: string, before: number | null, after: number | null, goodWhenLower: boolean) => {
                if (before == null || after == null) return;
                const d = after - before;
                if (d === 0) return;
                const improved = goodWhenLower ? d < 0 : d > 0;
                deltas.push({ letter, delta: d, tone: improved ? "good" : "warn" });
              };
              pushDelta("M", s.mood_before, s.mood_after, true);
              pushDelta("Å", s.anxiety_before, s.anxiety_after, true);
              pushDelta("E", s.energy_before, s.energy_after, false);

              return (
                <li key={s.id} className="relative animate-fade-in-up" style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}>
                  <span className="absolute -left-[22px] top-1/2 -translate-y-1/2" aria-hidden>
                    <AbstractIcon name="blob-smile" size={18} color={blobColor} />
                  </span>
                  <button
                    onClick={() => navigate("/ovningar")}
                    className="w-full text-left rounded-2xl bg-surface border border-border-soft py-2.5 px-3 flex items-center gap-2 shadow-card press-soft"
                  >
                    <span className="text-[11px] font-extrabold text-text-secondary tabular-nums shrink-0 w-12">{dateStr}</span>
                    <span className="text-sm font-extrabold truncate flex-1 min-w-0">{ex.title}</span>
                    {deltas.length > 0 && (
                      <span className="flex items-center gap-1 shrink-0">
                        {deltas.map(d => (
                          <span
                            key={d.letter}
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full tabular-nums ${
                              d.tone === "good" ? "bg-green-recovery/15 text-green-recovery" : "bg-red-bg text-red-risk"
                            }`}
                            title={`${d.letter}: ${d.delta > 0 ? "+" : ""}${d.delta}`}
                          >
                            {d.letter}{d.delta > 0 ? "+" : ""}{d.delta}
                          </span>
                        ))}
                      </span>
                    )}
                    <ChevronRight size={16} className="text-text-secondary shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!showSafety && <QuickLogFab onClick={() => setPickerOpen(true)} />}
      <ActivityPicker open={pickerOpen} onOpenChange={setPickerOpen} onAdd={handleQuickAdd} />
    </AppShell>
  );
};

const Pill = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className={`rounded-2xl px-3 py-2 ${accent ? "bg-red-risk text-white" : "bg-surface"}`}>
    <div className={`text-[11px] font-semibold ${accent ? "text-white/80" : "text-text-secondary"}`}>{label}</div>
    <div className="text-sm font-extrabold">{value}</div>
  </div>
);

const Chip = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="pill bg-surface border border-border-soft text-foreground hover:bg-surface-alt"
  >
    {children}
  </button>
);

const InsightCard = ({
  label,
  value,
  suffix,
  decimals = 0,
  invert,
  trend,
  colorClass,
  spark,
  sparkTone,
}: {
  label: string;
  value: number | null;
  suffix: string;
  decimals?: number;
  invert?: boolean;
  trend: Trend;
  colorClass: string;
  spark?: (number | null)[];
  sparkTone?: "orange" | "blue" | "purple" | "pink" | "green" | "yellow";
}) => {
  const display = value == null ? "—" : value.toFixed(decimals);
  const toneClass =
    trend.tone === "good"
      ? "bg-green-recovery/15 text-green-recovery"
      : trend.tone === "warn"
        ? "bg-red-bg text-red-risk"
        : "bg-surface-alt text-text-secondary";
  const arrow = trend.dir === "up" ? "↑" : trend.dir === "down" ? "↓" : "→";
  return (
    <div className={`rounded-3xl ${colorClass} text-white p-4 shadow-soft flex flex-col justify-between min-h-[148px] relative overflow-hidden`}>
      <div className="text-[12px] font-extrabold uppercase tracking-wide opacity-90">{label}</div>
      <div className="mt-2">
        <div className="text-[28px] leading-none font-extrabold">
          {display}
          <span className="text-sm opacity-80 font-bold">{suffix}</span>
        </div>
        {spark && spark.some((v) => v != null) && (
          <div className="-mx-1 mt-2 opacity-95">
            <SparklineWrap values={spark} tone="white" />
          </div>
        )}
        <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold ${toneClass}`}>
          <span aria-hidden>{arrow}</span>
          <span>{trend.deltaLabel}</span>
        </div>
      </div>
    </div>
  );
};

// Liten wrapper som ritar sparkline i vit färg ovanpå färgad bakgrund.
// Återanvänder Sparkline-komponentens layout men byter ut färgen.
const SparklineWrap = ({ values, tone }: { values: (number | null)[]; tone: "white" }) => {
  const points = values.filter((v) => v != null) as number[];
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 100;
  const h = 22;
  const path = values
    .map((v, i) => {
      if (v == null) return null;
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter(Boolean)
    .join(" L ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-[22px]" aria-hidden>
      <path
        d={`M ${path}`}
        fill="none"
        stroke="hsl(var(--surface))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
        style={{
          strokeDasharray: 200,
          strokeDashoffset: 200,
          animation: "spark-draw 700ms ease-out forwards",
        }}
      />
      <style>{`@keyframes spark-draw { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  );
};


export default Today;
