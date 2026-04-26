import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check } from "lucide-react";
import { SunBlob, BreathCircle, MoonBlob, MoveBlob, JournalBlob, CareDoc, FocusBlob } from "@/components/Illustrations";
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

const IllForColor = ({ c, className }: { c: string; className?: string }) => {
  switch (c) {
    case "blue": return <BreathCircle className={className} />;
    case "purple": return <MoonBlob className={className} />;
    case "pink": return <MoveBlob className={className} />;
    case "yellow": return <JournalBlob className={className} />;
    case "green": return <CareDoc className={className} />;
    case "orange": return <SunBlob className={className} />;
    default: return <FocusBlob className={className} />;
  }
};

const ExerciseDetail = () => {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [ex, setEx] = useState<Exercise | null>(null);
  const [phase, setPhase] = useState<"intro" | "before" | "doing" | "after">("intro");
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
      if (data) setEx({ ...data, steps_json: (data.steps_json as string[]) ?? [] });
    });
  }, [id]);

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
    navigate("/ovningar");
  };

  if (!ex) return <div className="min-h-screen bg-background flex items-center justify-center text-text-secondary">Hämtar...</div>;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className={`${colorBg(ex.color)} ${colorText(ex.color)} px-6 pt-8 pb-12 rounded-b-[40px] relative overflow-hidden`}>
        <button
          onClick={() => navigate("/ovningar")}
          className="flex items-center gap-1 text-sm font-bold mb-6 opacity-90"
        >
          <ArrowLeft size={18} /> Tillbaka
        </button>
        <div className="absolute -right-4 -top-2 opacity-90">
          <IllForColor c={ex.color} className="w-40 h-40" />
        </div>
        <p className="text-xs font-extrabold uppercase tracking-wider opacity-80 mb-1">{ex.category}</p>
        <h1 className="text-[28px] leading-[34px] pr-32 mb-2">{ex.title}</h1>
        <p className="text-sm opacity-90">{ex.type} · {ex.duration_minutes} min</p>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-6">
        {phase === "intro" && (
          <>
            <div className="card-soft p-5 mb-4">
              <p className="text-base text-foreground/80 leading-relaxed">{ex.description}</p>
            </div>
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
              className="w-full h-14 rounded-full bg-foreground hover:bg-foreground/90 text-background font-extrabold text-[17px]"
            >
              Starta
            </Button>
          </>
        )}

        {phase === "before" && (
          <>
            <h3 className="text-xl mb-3 mt-2">Hur är det innan?</h3>
            <SliderRow label="Oro" value={before.anxiety} onChange={(v) => setBefore(b => ({ ...b, anxiety: v }))} />
            <SliderRow label="Energi" value={before.energy} onChange={(v) => setBefore(b => ({ ...b, energy: v }))} />
            <SliderRow label="Mående" value={before.mood} onChange={(v) => setBefore(b => ({ ...b, mood: v }))} />
            <Button
              onClick={() => setPhase("doing")}
              className="w-full h-14 rounded-full bg-orange-start hover:bg-orange-deep text-white font-extrabold text-[17px]"
            >
              Kör igång
            </Button>
          </>
        )}

        {phase === "doing" && (
          <>
            <div className="card-cream p-6 text-center mb-6">
              <div className="flex justify-center mb-4">
                <IllForColor c={ex.color} className="w-32 h-32" />
              </div>
              <h3 className="text-xl mb-2">Ta din tid</h3>
              <p className="text-sm text-text-secondary mb-4">
                Inga krav på perfektion. När du är klar, tryck nedan.
              </p>
            </div>
            <Button
              onClick={() => setPhase("after")}
              className="w-full h-14 rounded-full bg-foreground hover:bg-foreground/90 text-background font-extrabold text-[17px]"
            >
              <Check size={20} /> Klart
            </Button>
          </>
        )}

        {phase === "after" && (
          <>
            <h3 className="text-xl mb-3 mt-2">Hur är det nu?</h3>
            <SliderRow label="Oro" value={after.anxiety} onChange={(v) => setAfter(a => ({ ...a, anxiety: v }))} />
            <SliderRow label="Energi" value={after.energy} onChange={(v) => setAfter(a => ({ ...a, energy: v }))} />
            <SliderRow label="Mående" value={after.mood} onChange={(v) => setAfter(a => ({ ...a, mood: v }))} />
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
              className="w-full h-14 rounded-full bg-orange-start hover:bg-orange-deep text-white font-extrabold text-[17px]"
            >
              {saving ? "Sparar..." : "Spara"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

const SliderRow = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div className="card-cream p-5 mb-4">
    <div className="flex items-center justify-between mb-3">
      <label className="text-sm font-extrabold">{label}</label>
      <span className="text-base font-extrabold text-orange-deep">{value}</span>
    </div>
    <Slider value={[value]} min={0} max={10} step={1} onValueChange={([v]) => onChange(v)} />
  </div>
);

export default ExerciseDetail;
