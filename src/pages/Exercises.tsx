import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight } from "lucide-react";
import { Illustration, categoryIll } from "@/components/Illustrations";
import { AbstractIcon } from "@/components/AbstractIcon";

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

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("exercises").select("id,title,category,type,duration_minutes,description,color").order("category").then(({ data }) => {
      if (data) setList(data as Exercise[]);
    });
  }, [user]);

  const filtered = useMemo(() => {
    return list.filter((e) => {
      if (active && e.category !== active) return false;
      if (q && !`${e.title} ${e.category} ${e.description}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [list, q, active]);

  return (
    <AppShell>
      <h1 className="text-[32px] leading-[38px] mb-1">Övningar</h1>
      <p className="text-sm text-text-secondary mb-6">Små handlingar. Välj en som passar nu.</p>

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
          <div className="space-y-3 mb-7">
            {categories.map(({ name, bg, text }, i) => (
              <button
                key={name}
                onClick={() => setActive(active === name ? null : name)}
                className={`relative w-full rounded-3xl ${bg} ${text} px-5 py-4 text-left overflow-hidden shadow-card press-soft animate-fade-in-up flex items-center justify-between gap-3 ${
                  active === name ? "ring-4 ring-foreground/15" : ""
                }`}
                style={{ animationDelay: `${i * 50}ms`, minHeight: "84px" }}
              >
                <span className="font-extrabold text-[17px] leading-tight relative z-10 max-w-[60%]">{name}</span>
                <div className="shrink-0 w-24 h-16 rounded-2xl overflow-hidden opacity-95">
                  <Illustration name={categoryIll(name)} className="w-full h-full object-cover" />
                </div>
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

      <div className="space-y-3">
        {filtered.map((ex, i) => (
          <button
            key={ex.id}
            onClick={() => navigate(`/ovningar/${ex.id}`)}
            className="w-full text-left rounded-3xl bg-surface border border-border-soft p-3 flex items-center gap-3 shadow-card press-soft animate-fade-in-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className={`w-20 h-16 rounded-2xl shrink-0 overflow-hidden ${colorBg(ex.color)}`}>
              <Illustration name={categoryIll(ex.category)} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-extrabold text-base truncate">{ex.title}</h3>
              <p className="text-xs font-semibold text-text-secondary">
                {ex.category} · {ex.duration_minutes} min
              </p>
            </div>
            <ChevronRight size={20} className="text-text-secondary shrink-0" />
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
