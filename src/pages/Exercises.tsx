import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";
import { ScreenHeader } from "@/components/ui-kit/ScreenHeader";
import { AbstractIcon } from "@/components/AbstractIcon";
import { iconForExerciseCategory } from "@/lib/icons";
import { getTimeContext } from "@/lib/timeContext";
import { useWeather, isOutdoorFriendly } from "@/lib/weather";

type Exercise = {
  id: string;
  title: string;
  category: string;
  type: string;
  duration_minutes: number;
  description: string;
  color: string;
};

const categories: { name: string; bg: string; text: string }[] = [
  { name: "Kom igång", bg: "bg-orange-start", text: "text-white" },
  { name: "Lugna kroppen", bg: "bg-blue-calm", text: "text-white" },
  { name: "Bryt ältande", bg: "bg-yellow-journal", text: "text-foreground" },
  { name: "Sov bättre", bg: "bg-purple-sleep", text: "text-white" },
  { name: "Rör dig mjukt", bg: "bg-pink-move", text: "text-white" },
  { name: "Skriv av dig", bg: "bg-cream-card", text: "text-foreground" },
  { name: "Förbered vårdkontakt", bg: "bg-green-recovery", text: "text-white" },
];

const colorBg = (color: string) => {
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

const Exercises = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState<Exercise[]>([]);
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const time = useMemo(() => getTimeContext(), []);
  const { weather } = useWeather(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("exercises").select("id,title,category,type,duration_minutes,description,color").order("category").then(({ data }) => {
      if (data) setList(data as Exercise[]);
    });
  }, [user]);

  // Decide whether an exercise category fits the current moment.
  const fitsNow = (category: string): boolean => {
    const outdoor = isOutdoorFriendly(weather);
    if (time.partOfDay === "night") return category === "Sov bättre" || category === "Lugna kroppen";
    if (time.partOfDay === "evening") return category === "Sov bättre" || category === "Lugna kroppen" || category === "Skriv av dig";
    if (time.partOfDay === "morning") return category === "Kom igång" || (outdoor && category === "Rör dig mjukt");
    // midday / afternoon
    if (weather && (weather.kind === "rain" || weather.kind === "snow" || weather.kind === "thunder")) {
      return category === "Lugna kroppen" || category === "Bryt ältande" || category === "Skriv av dig";
    }
    if (outdoor) return category === "Rör dig mjukt" || category === "Kom igång";
    return category === "Lugna kroppen" || category === "Bryt ältande";
  };

  const filtered = useMemo(() => {
    const items = list.filter((e) => {
      if (active && e.category !== active) return false;
      if (q && !`${e.title} ${e.category} ${e.description}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    if (q || active) return items;
    // Sort recommended-now first when browsing all.
    return [...items].sort((a, b) => Number(fitsNow(b.category)) - Number(fitsNow(a.category)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, q, active, weather, time]);

  return (
    <AppShell wide>
      <ScreenHeader
        screen="explore"
        title="Övningar"
        subtitle="Små handlingar. Välj en som passar nu."
        topLeft={
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
            className="inline-flex items-center gap-1 text-sm font-bold text-foreground/80 press-soft"
          >
            <ChevronLeft size={18} /> Tillbaka
          </button>
        }
      />

      {/* Rounder, friendlier search */}
      <div className="relative mb-6">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full bg-surface-alt">
          <Search size={16} className="text-text-secondary" strokeWidth={2.4} />
        </span>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Sök övning, känsla eller situation"
          className="h-14 pl-14 pr-5 rounded-full border border-border-soft bg-surface text-base shadow-card"
        />
      </div>

      {!q && (
        <>
          <h2 className="text-xl mb-3">Kategorier</h2>
          {/* Single-column horizontal cards — Headspace-inspired */}
          <div className="space-y-4 mb-7">
            {categories.map(({ name, bg, text }, i) => (
              <button
                key={name}
                onClick={() => setActive(active === name ? null : name)}
                className={`relative w-full rounded-3xl ${bg} ${text} px-5 py-4 text-left overflow-hidden shadow-card press-soft animate-pop-in flex items-center justify-between gap-3 ${
                  active === name ? "ring-4 ring-foreground/15" : ""
                }`}
                style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})`, minHeight: "92px" }}
              >
                {/* Sticker-rytm: bakgrundsblob */}
                <span aria-hidden className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-foreground/10 pointer-events-none" />
                <span className="relative z-[1] font-extrabold text-[17px] leading-tight max-w-[55%]">{name}</span>
                <span className="relative z-[1] shrink-0">
                  <AbstractIcon name={iconForExerciseCategory(name)} size={64} />
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <h2 className="text-xl mb-3 flex items-center gap-2">
        <AbstractIcon name="spark" size={20} color="hsl(var(--orange-start))" />
        {active ? active : q ? "Sökresultat" : "Alla övningar"}
        {active && (
          <button onClick={() => setActive(null)} className="ml-2 text-sm font-bold text-text-secondary underline">
            visa alla
          </button>
        )}
      </h2>

      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
        {filtered.map((ex, i) => (
          <button
            key={ex.id}
            onClick={() => navigate(`/ovningar/${ex.id}`)}
            className={`relative w-full text-left rounded-3xl ${colorBg(ex.color)} px-4 py-3 overflow-hidden shadow-card press-soft animate-pop-in flex items-center gap-3`}
            style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})`, minHeight: "76px" }}
          >
            {/* Sticker-rytm: subtil bakgrundsblob */}
            <span aria-hidden className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-foreground/10 pointer-events-none" />

            <span className="relative z-[1] shrink-0">
              <AbstractIcon name={iconForExerciseCategory(ex.category)} size={44} />
            </span>

            <div className="relative z-[1] flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-[15px] truncate">{ex.title}</h3>
                {fitsNow(ex.category) && !q && !active && (
                  <span className="shrink-0 text-[9px] font-extrabold uppercase tracking-wide bg-white/90 text-foreground rounded-full px-1.5 py-0.5">
                    Passar nu
                  </span>
                )}
              </div>
              <p className="text-[11px] font-bold opacity-85">
                {ex.category} · {ex.duration_minutes} min
              </p>
            </div>

            <ChevronRight size={20} className="relative z-[1] shrink-0 opacity-80" />
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-8">Inga övningar matchar.</p>
        )}
      </div>
    </AppShell>
  );
};

export default Exercises;
