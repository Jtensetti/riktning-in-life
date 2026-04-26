import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { HeroBanner } from "@/components/HeroBanner";
import { AbstractIcon } from "@/components/AbstractIcon";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Sequence = {
  id: string;
  slug: string;
  title: string;
  description: string;
  color: string;
  time_of_day: string | null;
  exercise_ids_json: string[];
};

const colorBg = (color: string): string => {
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

const colorText = (color: string): string =>
  color === "yellow" || color === "" ? "text-foreground" : "text-white";

const timeLabel = (t: string | null): string => {
  switch (t) {
    case "morning": return "Morgon";
    case "midday": return "Mitt på dagen";
    case "afternoon": return "Eftermiddag";
    case "evening": return "Kväll";
    default: return "När som helst";
  }
};

const Sequences = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Sequence[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("exercise_sequences")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setItems(
            (data as Sequence[]).map(s => ({
              ...s,
              exercise_ids_json: (s.exercise_ids_json as unknown as string[]) ?? [],
            }))
          );
        }
      });
  }, [user]);

  const startSequence = (seq: Sequence) => {
    if (seq.exercise_ids_json.length === 0) return;
    const ids = seq.exercise_ids_json;
    sessionStorage.setItem("riktning:sequence", JSON.stringify({ slug: seq.slug, title: seq.title, ids, index: 0 }));
    navigate(`/ovningar/${ids[0]}`);
  };

  return (
    <AppShell>
      <HeroBanner
        tone="var(--orange-start)"
        icon="play-soft"
        iconColor="hsl(var(--surface))"
      />
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm font-bold text-text-secondary mb-4 press-soft"
      >
        <ChevronLeft size={18} /> Tillbaka
      </button>
      <header className="mb-6">
        <h1 className="text-[32px] leading-[38px] mb-1">Rutiner</h1>
        <p className="text-sm text-text-secondary">Tre små steg i en följd. Lättare när det är förberett.</p>
      </header>

      <div className="space-y-3">
        {items.map((s, i) => (
          <button
            key={s.id}
            onClick={() => startSequence(s)}
            className={`w-full text-left rounded-3xl ${colorBg(s.color)} ${colorText(s.color)} p-5 shadow-soft press-soft animate-pop-in flex items-start gap-3 relative overflow-hidden`}
            style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
          >
            <div className="flex-1 min-w-0">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 inline-block ${
                s.color === "yellow" ? "bg-foreground/10" : "bg-white/20"
              }`}>
                {timeLabel(s.time_of_day)} · {s.exercise_ids_json.length} steg
              </span>
              <h3 className="text-[20px] leading-[24px] font-extrabold mb-1">{s.title}</h3>
              <p className="text-sm opacity-90 leading-snug">{s.description}</p>
            </div>
            <div className="shrink-0 grid place-items-center w-11 h-11 rounded-full bg-white/20">
              <AbstractIcon name="play-soft-circle" size={26} color="currentColor" />
            </div>
          </button>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-8">Inga rutiner ännu.</p>
        )}
      </div>
    </AppShell>
  );
};

export default Sequences;
