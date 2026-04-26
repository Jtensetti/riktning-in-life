import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Illustration, colorIll } from "@/components/Illustrations";
import { ChevronRight, LogOut } from "lucide-react";
import { toast } from "sonner";

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

const Today = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checkin, setCheckin] = useState<Checkin | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("daily_checkins")
      .select("id,date,mood_heaviness,anxiety,energy,function_score,sleep_hours,safety_status")
      .eq("user_id", user.id)
      .eq("date", todayISO())
      .maybeSingle()
      .then(({ data }) => {
        setCheckin(data as Checkin | null);
        setFetching(false);
      });
  }, [user]);

  if (loading || fetching) {
    return (
      <AppShell>
        <div className="h-40 rounded-3xl bg-surface-alt animate-pulse" />
      </AppShell>
    );
  }

  const state = stateLabel(checkin);
  const rec = recommend(checkin);
  const showSafety = checkin?.safety_status === "active_thoughts" || checkin?.safety_status === "acute";

  return (
    <AppShell>
      <header className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[32px] leading-[38px]">Idag</h1>
          <p className="text-sm font-semibold text-text-secondary capitalize mt-1">{formatDate()}</p>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            toast.success("Utloggad");
          }}
          className="p-2 rounded-full hover:bg-surface-alt"
          aria-label="Logga ut"
        >
          <LogOut size={18} className="text-text-secondary" />
        </button>
      </header>

      {showSafety && (
        <div className="rounded-3xl border-2 border-red-risk bg-red-bg p-5 mb-7">
          <div className="mb-3 -mx-1">
            <Illustration name="safety" className="w-full h-auto rounded-2xl" />
          </div>
          <h3 className="text-lg font-extrabold text-red-risk mb-2">Allvarlig signal</h3>
          <p className="text-sm text-foreground/80 mb-3">
            Det här ska inte hanteras som vanlig statistik. Kontakta vården, psykiatrisk akutmottagning, 1177 eller 112 vid akut fara.
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

      <div className="flex gap-2 flex-wrap mb-4">
        <Chip onClick={() => navigate("/ovningar")}>Andning 4 min</Chip>
        <Chip onClick={() => navigate("/journal")}>Skriv tre rader</Chip>
        <Chip onClick={() => navigate("/ovningar")}>Dagsljus 15 min</Chip>
      </div>
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
