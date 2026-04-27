import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ui-kit/ScreenHeader";
import { ActionCard } from "@/components/ui-kit/ActionCard";

type Sequence = {
  id: string;
  slug: string;
  title: string;
  description: string;
  color: string;
  time_of_day: string | null;
  exercise_ids_json: string[];
};

const toneFor = (color: string) => {
  switch (color) {
    case "orange": return "orange-start";
    case "blue": return "blue-calm";
    case "yellow": return "yellow-journal";
    case "purple": return "purple-sleep";
    case "pink": return "pink-move";
    case "green": return "green-recovery";
    default: return "orange-start";
  }
};

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
            (data as Sequence[]).map((s) => ({
              ...s,
              exercise_ids_json: (s.exercise_ids_json as unknown as string[]) ?? [],
            })),
          );
        }
      });
  }, [user]);

  return (
    <AppShell wide>
      <ScreenHeader
        screen="explore"
        title="Rutiner"
        subtitle="Tre små steg i en följd. Lättare när det är förberett."
        topLeft={
          <button
            onClick={() => navigate("/utforska")}
            className="inline-flex items-center gap-1 text-sm font-bold opacity-90 press-soft"
          >
            <ArrowLeft size={18} /> Utforska
          </button>
        }
      />

      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
        {items.map((s, i) => (
          <div
            key={s.id}
            className="animate-pop-in"
            style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
          >
            <ActionCard
              tone={toneFor(s.color) as never}
              icon="play-soft"
              title={s.title}
              meta={`${timeLabel(s.time_of_day)} · ${s.exercise_ids_json.length} steg`}
              onClick={() => navigate(`/rutiner/${s.slug}`)}
            />
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-8">Inga rutiner ännu.</p>
        )}
      </div>
    </AppShell>
  );
};

export default Sequences;
