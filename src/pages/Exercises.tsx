import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight } from "lucide-react";
import { SunBlob, BreathCircle, MoonBlob, MoveBlob, JournalBlob, CareDoc, FocusBlob } from "@/components/Illustrations";

type Exercise = {
  id: string;
  title: string;
  category: string;
  type: string;
  duration_minutes: number;
  description: string;
  color: string;
};

const categories = [
  { name: "Kom igång", color: "bg-orange-start text-white", Ill: SunBlob },
  { name: "Lugna kroppen", color: "bg-blue-calm text-white", Ill: BreathCircle },
  { name: "Bryt ältande", color: "bg-yellow-journal text-foreground", Ill: JournalBlob },
  { name: "Sov bättre", color: "bg-purple-sleep text-white", Ill: MoonBlob },
  { name: "Rör dig mjukt", color: "bg-pink-move text-white", Ill: MoveBlob },
  { name: "Skriv av dig", color: "bg-cream-card text-foreground", Ill: JournalBlob },
  { name: "Förbered vårdkontakt", color: "bg-green-recovery text-white", Ill: CareDoc },
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

      <div className="relative mb-6">
        <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Sök övning, känsla eller situation"
          className="h-16 pl-14 pr-5 rounded-2xl border-2 border-border-soft bg-surface text-base"
        />
      </div>

      {!q && (
        <>
          <h2 className="text-xl mb-3">Kategorier</h2>
          <div className="grid grid-cols-2 gap-3 mb-7">
            {categories.map(({ name, color, Ill }) => (
              <button
                key={name}
                onClick={() => setActive(active === name ? null : name)}
                className={`relative h-28 rounded-3xl ${color} p-4 text-left overflow-hidden shadow-card transition ${
                  active === name ? "ring-4 ring-foreground/20 scale-[0.98]" : ""
                }`}
              >
                <div className="absolute -right-3 -bottom-3 opacity-90">
                  <Ill className="w-20 h-20" />
                </div>
                <span className="font-extrabold text-base leading-snug pr-12 block">{name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <h2 className="text-xl mb-3">
        {active ? active : q ? "Sökresultat" : "Alla övningar"}
        {active && (
          <button onClick={() => setActive(null)} className="ml-3 text-sm font-bold text-text-secondary underline">
            visa alla
          </button>
        )}
      </h2>

      <div className="space-y-3">
        {filtered.map((ex) => (
          <button
            key={ex.id}
            onClick={() => navigate(`/ovningar/${ex.id}`)}
            className="w-full text-left rounded-3xl bg-surface border border-border-soft p-4 flex items-center gap-4 shadow-card hover:scale-[0.99] transition"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${colorBg(ex.color)}`}>
              <FocusBlob className="w-12 h-12" />
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
