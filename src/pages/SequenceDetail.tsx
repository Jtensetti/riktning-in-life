import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { HeroCard } from "@/components/ui-kit/HeroCard";
import { ListCard } from "@/components/ui-kit/ListCard";
import { iconForExerciseCategory } from "@/lib/icons";

type Sequence = {
  slug: string;
  title: string;
  description: string;
  color: string;
  time_of_day: string | null;
  exercise_ids_json: string[];
};

type Step = {
  id: string;
  title: string;
  category: string;
  duration_minutes: number;
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

/**
 * SequenceDetail — visar en rutin som ett paket: rubrik + alla steg
 * tillsammans. Detta löser navigationsproblemet där tillbaka från första
 * övningen ledde till listan istället för till rutinen.
 */
const SequenceDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [seq, setSeq] = useState<Sequence | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("exercise_sequences")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) return;
        const ids = (data.exercise_ids_json as unknown as string[]) ?? [];
        setSeq({ ...(data as Sequence), exercise_ids_json: ids });
        if (ids.length > 0) {
          const { data: exs } = await supabase
            .from("exercises")
            .select("id,title,category,duration_minutes")
            .in("id", ids);
          if (exs) {
            // preserve sequence order
            const map = new Map(exs.map((e) => [e.id, e as Step]));
            setSteps(ids.map((id) => map.get(id)).filter(Boolean) as Step[]);
          }
        }
      });
  }, [slug]);

  if (!seq) {
    return (
      <AppShell>
        <p className="text-text-secondary text-sm py-12 text-center">Hämtar rutin…</p>
      </AppShell>
    );
  }

  const tone = toneFor(seq.color);
  const totalMinutes = steps.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const startSequence = () => {
    if (steps.length === 0) return;
    navigate(`/ovningar/${steps[0].id}?seq=${seq.slug}`);
  };

  return (
    <AppShell>
      <button
        onClick={() => navigate("/rutiner")}
        className="flex items-center gap-1 text-sm font-bold text-text-secondary mb-4 press-soft"
      >
        <ArrowLeft size={18} /> Tillbaka till rutiner
      </button>

      <HeroCard
        tone={tone as never}
        meta={`${timeLabel(seq.time_of_day)} · ${steps.length} steg · ${totalMinutes} min`}
        title={seq.title}
        description={seq.description}
        cta="Starta första steget"
        onClick={startSequence}
      />

      <h2 className="text-h2 mt-8 mb-4">Stegen i rutinen</h2>
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={s.id}>
            <ListCard
              icon={iconForExerciseCategory(s.category)}
              iconTone={tone as never}
              title={`${i + 1}. ${s.title}`}
              meta={`${s.category.toUpperCase()} · ${s.duration_minutes} MIN`}
              onClick={() => navigate(`/ovningar/${s.id}?seq=${seq.slug}`)}
              trailing={<ChevronRight size={22} className="shrink-0 text-text-secondary" />}
            />
          </li>
        ))}
        {steps.length === 0 && (
          <p className="text-text-secondary text-sm">Den här rutinen har inga steg ännu.</p>
        )}
      </ol>
    </AppShell>
  );
};

export default SequenceDetail;
