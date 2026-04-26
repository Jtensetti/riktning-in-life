import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Illustration, colorIll } from "@/components/Illustrations";
import { ChevronRight, Settings as SettingsIcon } from "lucide-react";
import { isOnboarded } from "@/lib/settings";

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

const recommend = (c: Checkin | null) => {
  if (!c) return { title: "8 min morgonstart", reason: "En mjuk start på dagen", color: "bg-orange-start" };
  if ((c.anxiety ?? 0) >= 6) return { title: "4 min längre utandning", reason: "För hög oro", color: "bg-blue-calm" };
  if ((c.energy ?? 5) <= 3) return { title: "8 min morgonstart", reason: "För låg energi", color: "bg-orange-start" };
  if ((c.sleep_hours ?? 7) < 5) return { title: "Kvällslandning", reason: "För kort sömn", color: "bg-purple-sleep" };
  return { title: "15 min dagsljuspromenad", reason: "Stabilt – håll riktningen", color: "bg-pink-move" };
};

const colorOf = (bg: string) => bg.replace("bg-", "").includes("blue") ? "blue"
  : bg.includes("purple") ? "purple"
  : bg.includes("pink") ? "pink"
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

const Today = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checkin, setCheckin] = useState<Checkin | null>(null);
  const [recent, setRecent] = useState<RecentSession[]>([]);
  const [trendData, setTrendData] = useState<TrendCheckin[]>([]);
  const [fetching, setFetching] = useState(true);

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
      const [c, r, t] = await Promise.all([
        supabase
          .from("daily_checkins")
          .select("id,date,mood_heaviness,anxiety,energy,function_score,sleep_hours,safety_status")
          .eq("user_id", user.id)
          .eq("date", todayISO())
          .maybeSingle(),
        supabase
          .from("exercise_sessions")
          .select("id,created_at,exercises(title,category,duration_minutes,color)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("daily_checkins")
          .select("date,mood_heaviness,function_score,sleep_hours")
          .eq("user_id", user.id)
          .gte("date", isoDaysAgo(13))
          .order("date", { ascending: true }),
      ]);
      setCheckin(c.data as Checkin | null);
      setRecent((r.data ?? []) as unknown as RecentSession[]);
      setTrendData((t.data ?? []) as TrendCheckin[]);
      setFetching(false);
    };
    load();
  }, [user]);

  if (loading || fetching) {
    return (
      <AppShell>
        <div className="h-40 rounded-3xl bg-surface-alt animate-pulse" />
      </AppShell>
    );
  }

  const state = stateLabel(checkin);
  const showSafety = checkin?.safety_status === "active_thoughts" || checkin?.safety_status === "acute";
  const rec = showSafety ? null : recommend(checkin);

  // 7-day insights
  const moodTrend = computeTrend(trendData, c => c.mood_heaviness, true);
  const sleepTrend = computeTrend(trendData, c => c.sleep_hours == null ? null : Number(c.sleep_hours), false);
  const funcTrend = computeTrend(trendData, c => c.function_score, false);
  const hasInsights = trendData.length >= 2;

  return (
    <AppShell>
      <header className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[32px] leading-[38px]">Idag</h1>
          <p className="text-sm font-semibold text-text-secondary capitalize mt-1">{formatDate()}</p>
        </div>
        <button
          onClick={() => navigate("/installningar")}
          className="p-2 rounded-full hover:bg-surface-alt"
          aria-label="Inställningar"
        >
          <SettingsIcon size={20} className="text-text-secondary" strokeWidth={2.2} />
        </button>
      </header>

      {showSafety && (
        <div className="rounded-3xl border-2 border-red-risk bg-red-bg p-5 mb-7">
          <div className="mb-3 -mx-1">
            <Illustration name="safety" className="w-full h-auto rounded-2xl" />
          </div>
          <h3 className="text-lg font-extrabold text-red-risk mb-2">Allvarlig signal</h3>
          <p className="text-sm text-foreground/80 mb-3">
            Det här ska inte hanteras som vanlig statistik. Kontakta vården, psykiatrisk akutmottagning, 1177 eller 112 vid akut fara. Kontakta också någon du litar på.
          </p>
          <Button
            onClick={() => navigate("/vard")}
            className="bg-red-risk hover:bg-red-risk/90 text-white rounded-full font-extrabold"
          >
            Gå till Vård
          </Button>
        </div>
      )}

      {/* State card with illustration */}
      <section className="card-cream p-5 mb-7">
        <div className="-mx-1 mb-4">
          <Illustration name="checkin" className="w-full h-auto rounded-2xl" />
        </div>
        <h2 className="text-2xl mb-1">{state.title}</h2>
        <p className="text-sm text-text-secondary mb-5">{state.sub}</p>
        <div className="grid grid-cols-2 gap-2 mb-5">
          <Pill label="Belastning" value={burdenLabel(checkin)} />
          <Pill label="Funktion" value={fnLabel(checkin)} />
          <Pill label="Återhämtning" value={recoveryLabel(checkin)} />
          <Pill label="Risk" value={riskLabel(checkin)} accent={!!checkin?.safety_status && checkin.safety_status !== "none"} />
        </div>
        <Button
          onClick={() => navigate("/checkin")}
          className="w-full h-12 rounded-full bg-foreground hover:bg-foreground/90 text-background font-extrabold text-[17px]"
        >
          {checkin ? "Uppdatera dagen" : "Logga dagen"}
        </Button>
      </section>

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

      {hasInsights && !showSafety && (
        <section className="mb-7">
          <h3 className="text-xl mb-1">Nya insikter</h3>
          <p className="text-sm text-text-secondary mb-3">Riktning senaste 7 dagarna</p>
          <div className="grid grid-cols-3 gap-3">
            <InsightCard
              label="Humör"
              value={moodTrend.value}
              suffix="/10"
              invert
              trend={moodTrend.trend}
              colorClass="bg-orange-start"
            />
            <InsightCard
              label="Sömn"
              value={sleepTrend.value}
              suffix=" h"
              decimals={1}
              trend={sleepTrend.trend}
              colorClass="bg-purple-sleep"
            />
            <InsightCard
              label="Funktion"
              value={funcTrend.value}
              suffix="/10"
              trend={funcTrend.trend}
              colorClass="bg-green-recovery"
            />
          </div>
        </section>
      )}

        <section className="mb-4">
          <h3 className="text-xl mb-3">Senaste aktivitet</h3>
          <ul className="relative pl-5 space-y-3">
            <span className="absolute left-1.5 top-2 bottom-2 w-px border-l-2 border-dashed border-[#D7D0C9]" aria-hidden />
            {recent.map(s => {
              const ex = s.exercises;
              if (!ex) return null;
              return (
                <li key={s.id} className="relative">
                  <span className="absolute -left-[18px] top-3 w-2.5 h-2.5 rounded-full bg-orange-start" aria-hidden />
                  <button
                    onClick={() => navigate("/ovningar")}
                    className="w-full text-left rounded-2xl bg-surface border border-border-soft p-3 flex items-center gap-3 shadow-card"
                  >
                    <div className={`w-[72px] h-[56px] rounded-xl shrink-0 overflow-hidden ${colorBg(ex.color)}`}>
                      <Illustration name={colorIll(ex.color)} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-extrabold truncate">{ex.title}</h4>
                      <p className="text-[11px] font-semibold text-text-secondary">
                        {new Date(s.created_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })} · {ex.category} · {ex.duration_minutes} min
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-text-secondary shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
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

export default Today;
