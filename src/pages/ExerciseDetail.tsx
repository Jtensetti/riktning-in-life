import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowDown, ArrowUp, Check, ChevronRight, Minus } from "lucide-react";
import { Illustration, categoryIll } from "@/components/Illustrations";
import { AbstractIcon } from "@/components/AbstractIcon";
import { iconForExerciseCategory } from "@/lib/icons";
import { MechanismCard, type Evidence } from "@/components/MechanismCard";
import { formatDelta, deltaChipClass } from "@/lib/valence";
import { toast } from "sonner";

type Exercise = {
  id: string;
  title: string;
  category: string;
  type: string;
  duration_minutes: number;
  description: string;
  steps_json: string[];
  color: string;
  mechanism: string | null;
  evidence_json: Evidence[];
};

type Sequence = {
  slug: string;
  title: string;
  exercise_ids: string[];
};

const colorBg = (c: string) => {
  switch (c) {
    case "orange": return "bg-orange-start";
    case "blue": return "bg-blue-calm";
    case "yellow": return "bg-yellow-journal";
    case "purple": return "bg-purple-sleep";
    case "pink": return "bg-pink-move";
    case "green": return "bg-green-recovery";
    default: return "bg-cream-card";
  }
};
const colorText = (c: string) => (c === "yellow" ? "text-foreground" : "text-white");

const ExerciseDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const seqSlug = searchParams.get("seq");
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [ex, setEx] = useState<Exercise | null>(null);
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [nextEx, setNextEx] = useState<{ id: string; title: string } | null>(null);
  const [phase, setPhase] = useState<"intro" | "before" | "doing" | "after" | "done">("intro");
  const [before, setBefore] = useState({ anxiety: 5, energy: 5, mood: 5 });
  const [after, setAfter] = useState({ anxiety: 5, energy: 5, mood: 5 });
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!id) return;
    supabase.from("exercises").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) setEx({
        ...data,
        steps_json: (data.steps_json as string[]) ?? [],
        evidence_json: ((data.evidence_json as unknown) as Evidence[]) ?? [],
      });
    });
  }, [id]);

  useEffect(() => {
    if (!seqSlug) { setSequence(null); setNextEx(null); return; }
    supabase
      .from("exercise_sequences")
      .select("slug,title,exercise_ids_json")
      .eq("slug", seqSlug)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) return;
        const ids = (data.exercise_ids_json as unknown as string[]) ?? [];
        setSequence({ slug: data.slug, title: data.title, exercise_ids: ids });
        const idx = id ? ids.indexOf(id) : -1;
        if (idx >= 0 && idx < ids.length - 1) {
          const nextId = ids[idx + 1];
          const { data: nx } = await supabase.from("exercises").select("id,title").eq("id", nextId).maybeSingle();
          if (nx) setNextEx({ id: nx.id, title: nx.title });
        } else {
          setNextEx(null);
        }
      });
  }, [seqSlug, id]);

  const stepIndex = sequence && id ? sequence.exercise_ids.indexOf(id) : -1;

  const save = async () => {
    if (!user || !ex) return;
    setSaving(true);
    const { error } = await supabase.from("exercise_sessions").insert({
      user_id: user.id,
      exercise_id: ex.id,
      anxiety_before: before.anxiety, anxiety_after: after.anxiety,
      energy_before: before.energy, energy_after: after.energy,
      mood_before: before.mood, mood_after: after.mood,
      note,
    });
    setSaving(false);
    if (error) {
      toast.error("Det gick inte att spara.");
      return;
    }
    toast.success("Bra jobbat. Sparat.");
    if (sequence && nextEx) {
      setPhase("done");
    } else {
      navigate("/ovningar");
    }
  };

  if (!ex) return <div className="min-h-screen bg-background flex items-center justify-center text-text-secondary">Hämtar...</div>;

  const ill = categoryIll(ex.category);
  const back = () => sequence ? navigate(`/rutiner/${sequence.slug}`) : navigate("/ovningar");

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className={`${colorBg(ex.color)} ${colorText(ex.color)} px-6 pt-8 pb-10 rounded-b-[40px]`}>
        <button
          onClick={back}
          className="flex items-center gap-1 text-sm font-bold mb-4 opacity-90"
        >
          <ArrowLeft size={18} /> Tillbaka
        </button>
        {sequence && stepIndex >= 0 && (
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 mb-3 text-[11px] font-extrabold uppercase tracking-wider">
            {sequence.title} · Steg {stepIndex + 1} av {sequence.exercise_ids.length}
          </div>
        )}
        <div className="grid place-items-center mb-4 animate-float">
          <AbstractIcon name={iconForExerciseCategory(ex.category)} size={96} />
        </div>
        <p className="text-xs font-extrabold uppercase tracking-wider opacity-80 mb-1">{ex.category}</p>
        <h1 className="text-[28px] leading-[34px] mb-2">{ex.title}</h1>
        <p className="text-sm opacity-90">{ex.type} · {ex.duration_minutes} min</p>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-6">
        {phase === "intro" && (
          <>
            <div className="card-soft p-5 mb-4">
              <p className="text-base text-foreground/80 leading-relaxed">{ex.description}</p>
            </div>
            <MechanismCard mechanism={ex.mechanism} evidence={ex.evidence_json} />
            <h3 className="text-lg mb-3">Steg</h3>
            <ol className="space-y-3 mb-6">
              {ex.steps_json.map((s, i) => (
                <li key={i} className="card-cream p-4 flex gap-3 items-start">
                  <span className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-extrabold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold leading-snug pt-1">{s}</span>
                </li>
              ))}
            </ol>
            <Button
              onClick={() => setPhase("before")}
              variant="pill-brand"
              size="pill"
              className="w-full"
            >
              Starta
            </Button>
          </>
        )}

        {phase === "before" && (
          <div className="animate-fade-in-up">
            <h3 className="text-xl mb-3 mt-2">Hur är det innan?</h3>
            <SliderRow label="Oro" value={before.anxiety} onChange={(v) => setBefore(b => ({ ...b, anxiety: v }))} />
            <SliderRow label="Energi" value={before.energy} onChange={(v) => setBefore(b => ({ ...b, energy: v }))} />
            <SliderRow label="Mående" value={before.mood} onChange={(v) => setBefore(b => ({ ...b, mood: v }))} />
            <Button
              onClick={() => setPhase("doing")}
              className="w-full h-14 rounded-full bg-orange-start hover:bg-orange-deep text-white font-extrabold text-[17px] press-soft"
            >
              Kör igång
            </Button>
          </div>
        )}

        {phase === "doing" && (
          <div className="animate-fade-in-up">
            <div className="card-cream p-6 text-center mb-6">
              <div className="grid place-items-center mb-4 animate-breathe">
                <AbstractIcon name={iconForExerciseCategory(ex.category)} size={120} />
              </div>
              <h3 className="text-xl mb-2">Ta din tid</h3>
              <p className="text-sm text-text-secondary mb-4">
                Inga krav på perfektion. När du är klar, tryck nedan.
              </p>
            </div>
            <Button
              onClick={() => {
                // Förifyll efter-värdena så att slidern startar där användaren
                // var innan övningen. Det gör det naturligt att medvetet dra ner
                // oron / upp energin efteråt — och vi får ärliga deltan i datan.
                setAfter({ ...before });
                setPhase("after");
              }}
              variant="pill-brand"
              size="pill"
              className="w-full"
            >
              <Check size={20} /> Klart
            </Button>
          </div>
        )}

        {phase === "after" && (
          <div className="animate-fade-in-up">
            <h3 className="text-xl mb-3 mt-2">Hur är det nu?</h3>
            <p className="text-sm text-text-secondary mb-4 -mt-1">
              Slidrarna börjar där du var innan. Dra dit du är nu.
            </p>
            <SliderRow label="Oro" metric="anxiety" value={after.anxiety} before={before.anxiety} onChange={(v) => setAfter(a => ({ ...a, anxiety: v }))} />
            <SliderRow label="Energi" metric="energy" value={after.energy} before={before.energy} onChange={(v) => setAfter(a => ({ ...a, energy: v }))} />
            <SliderRow label="Mående" metric="mood" value={after.mood} before={before.mood} onChange={(v) => setAfter(a => ({ ...a, mood: v }))} />
            <div className="card-cream p-5 mb-4">
              <label className="text-sm font-extrabold mb-2 block">Anteckning (valfri)</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Vad märkte du?"
                className="rounded-2xl border-border-soft bg-surface min-h-[70px]"
              />
            </div>
            <Button
              onClick={save}
              disabled={saving}
              className="w-full h-14 rounded-full bg-orange-start hover:bg-orange-deep text-white font-extrabold text-[17px] press-soft"
            >
              {saving ? "Sparar..." : "Spara"}
            </Button>
          </div>
        )}

        {phase === "done" && sequence && nextEx && (
          <div className="animate-fade-in-up">
            <div className="card-cream p-5 mb-4 text-center">
              <h3 className="text-xl mb-1">Bra jobbat</h3>
              <p className="text-sm text-text-secondary">
                Steg {stepIndex + 1} av {sequence.exercise_ids.length} klart.
              </p>
            </div>
            <Button
              onClick={() => navigate(`/ovningar/${nextEx.id}?seq=${sequence.slug}`)}
              className="w-full h-14 rounded-full bg-foreground hover:bg-foreground/90 text-background font-extrabold text-[17px] press-soft mb-2"
            >
              Nästa: {nextEx.title} <ChevronRight size={18} />
            </Button>
            <Button
              onClick={() => navigate(`/rutiner/${sequence.slug}`)}
              variant="secondary"
              className="w-full h-12 rounded-full font-extrabold press-soft"
            >
              Pausa rutinen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const SliderRow = ({
  label,
  value,
  onChange,
  before,
  metric,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  before?: number;
  metric?: string;
}) => {
  const showDelta = typeof before === "number" && typeof metric === "string";
  const d = showDelta ? formatDelta(metric, before, value) : null;
  const ArrowIcon = d?.arrow === "up" ? ArrowUp : d?.arrow === "down" ? ArrowDown : Minus;
  return (
    <div className="card-cream p-5 mb-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <label className="text-sm font-extrabold">{label}</label>
        <div className="flex items-center gap-2">
          {d && (
            <span
              aria-label={d.ariaLabel}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold tabular-nums ${deltaChipClass(d.tone)}`}
            >
              <ArrowIcon size={12} strokeWidth={2.6} />
              {d.text}
            </span>
          )}
          <span className="text-base font-extrabold text-orange-deep tabular-nums">{value}</span>
        </div>
      </div>
      <Slider value={[value]} min={0} max={10} step={1} onValueChange={([v]) => onChange(v)} />
    </div>
  );
};

export default ExerciseDetail;
