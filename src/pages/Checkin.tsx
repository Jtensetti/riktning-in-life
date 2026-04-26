import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const todayISO = () => new Date().toISOString().split("T")[0];

type Form = {
  mood_heaviness: number;
  anxiety: number;
  guilt_selfcriticism: number;
  hopelessness: number;
  energy: number;
  getting_started: number;
  function_score: number;
  sleep_hours: number;
  sleep_quality: number;
  daytime_bed_sofa_time_minutes: number;
  medication_taken: "yes" | "no" | "partial" | "";
  movement_today: "none" | "little" | "yes" | "";
  meaningful_activity: "none" | "little" | "yes" | "";
  safety_status: "none" | "passive_thoughts" | "active_thoughts" | "acute";
  note: string;
};

const initialForm: Form = {
  mood_heaviness: 5, anxiety: 5, guilt_selfcriticism: 5, hopelessness: 5,
  energy: 5, getting_started: 5, function_score: 5,
  sleep_hours: 7, sleep_quality: 5, daytime_bed_sofa_time_minutes: 0,
  medication_taken: "", movement_today: "", meaningful_activity: "",
  safety_status: "none", note: "",
};

const Checkin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(initialForm);
  const [saving, setSaving] = useState(false);
  const [showSafetyDialog, setShowSafetyDialog] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("daily_checkins").select("*").eq("user_id", user.id).eq("date", todayISO()).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            mood_heaviness: data.mood_heaviness ?? 5,
            anxiety: data.anxiety ?? 5,
            guilt_selfcriticism: data.guilt_selfcriticism ?? 5,
            hopelessness: data.hopelessness ?? 5,
            energy: data.energy ?? 5,
            getting_started: data.getting_started ?? 5,
            function_score: data.function_score ?? 5,
            sleep_hours: Number(data.sleep_hours ?? 7),
            sleep_quality: data.sleep_quality ?? 5,
            daytime_bed_sofa_time_minutes: data.daytime_bed_sofa_time_minutes ?? 0,
            medication_taken: (data.medication_taken as Form["medication_taken"]) ?? "",
            movement_today: (data.movement_today as Form["movement_today"]) ?? "",
            meaningful_activity: (data.meaningful_activity as Form["meaningful_activity"]) ?? "",
            safety_status: (data.safety_status as Form["safety_status"]) ?? "none",
            note: data.note ?? "",
          });
        }
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    if ((form.safety_status === "active_thoughts" || form.safety_status === "acute") && !showSafetyDialog) {
      setShowSafetyDialog(true);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("daily_checkins").upsert({
      user_id: user.id,
      date: todayISO(),
      ...form,
      medication_taken: form.medication_taken || null,
      movement_today: form.movement_today || null,
      meaningful_activity: form.meaningful_activity || null,
    }, { onConflict: "user_id,date" });
    setSaving(false);
    if (error) {
      toast.error("Det gick inte att spara. Försök igen.");
      return;
    }
    toast.success("Dagen sparad");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="max-w-md mx-auto px-6 pt-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-text-secondary text-sm font-bold mb-4"
        >
          <ArrowLeft size={18} /> Tillbaka
        </button>
        <h1 className="text-[28px] leading-[34px] mb-2">Logga dagen</h1>
        <p className="text-sm text-text-secondary mb-8">Tar under 60 sekunder. Spara dagen som den var.</p>

        <SliderField label="Tyngd / nedstämdhet" value={form.mood_heaviness} onChange={(v) => setForm(f => ({ ...f, mood_heaviness: v }))} low="Lätt" high="Tungt" />
        <SliderField label="Oro / ångest" value={form.anxiety} onChange={(v) => setForm(f => ({ ...f, anxiety: v }))} low="Lugn" high="Hög oro" />
        <SliderField label="Skuld / självkritik" value={form.guilt_selfcriticism} onChange={(v) => setForm(f => ({ ...f, guilt_selfcriticism: v }))} low="Mild" high="Skarp" />
        <SliderField label="Hopplöshet" value={form.hopelessness} onChange={(v) => setForm(f => ({ ...f, hopelessness: v }))} low="Hopp" high="Tomt" />
        <SliderField label="Energi" value={form.energy} onChange={(v) => setForm(f => ({ ...f, energy: v }))} low="Tom" high="Pigg" />
        <SliderField label="Komma igång" value={form.getting_started} onChange={(v) => setForm(f => ({ ...f, getting_started: v }))} low="Tungt" high="Lätt" />
        <SliderField label="Funktion" value={form.function_score} onChange={(v) => setForm(f => ({ ...f, function_score: v }))} low="Låg" high="Hög" />

        <div className="card-cream p-5 mb-4">
          <label className="text-sm font-extrabold mb-3 block">Sömn (timmar)</label>
          <Slider value={[form.sleep_hours]} min={0} max={12} step={0.5} onValueChange={([v]) => setForm(f => ({ ...f, sleep_hours: v }))} />
          <div className="text-right text-sm font-bold mt-2">{form.sleep_hours} h</div>
        </div>

        <SliderField label="Sömnkvalitet" value={form.sleep_quality} onChange={(v) => setForm(f => ({ ...f, sleep_quality: v }))} low="Dålig" high="Bra" />

        <div className="card-cream p-5 mb-4">
          <label className="text-sm font-extrabold mb-3 block">Säng / soffa dagtid (minuter)</label>
          <Slider value={[form.daytime_bed_sofa_time_minutes]} min={0} max={480} step={15} onValueChange={([v]) => setForm(f => ({ ...f, daytime_bed_sofa_time_minutes: v }))} />
          <div className="text-right text-sm font-bold mt-2">{form.daytime_bed_sofa_time_minutes} min</div>
        </div>

        <SegField label="Medicin" value={form.medication_taken} onChange={(v) => setForm(f => ({ ...f, medication_taken: v as Form["medication_taken"] }))}
          opts={[["yes", "Tagit"], ["partial", "Delvis"], ["no", "Inte tagit"]]} />
        <SegField label="Rört på dig" value={form.movement_today} onChange={(v) => setForm(f => ({ ...f, movement_today: v as Form["movement_today"] }))}
          opts={[["none", "Inte alls"], ["little", "Lite"], ["yes", "Ja"]]} />
        <SegField label="Meningsfull aktivitet" value={form.meaningful_activity} onChange={(v) => setForm(f => ({ ...f, meaningful_activity: v as Form["meaningful_activity"] }))}
          opts={[["none", "Ingen"], ["little", "Lite"], ["yes", "Ja"]]} />

        <div className="card-cream p-5 mb-4">
          <label className="text-sm font-extrabold mb-3 block">Säkerhet</label>
          <p className="text-xs text-text-secondary mb-3">Ärlighet hjälper både dig och vården.</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["none", "Ingen signal"],
              ["passive_thoughts", "Passiva tankar"],
              ["active_thoughts", "Aktiva tankar"],
              ["acute", "Akut"],
            ] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setForm(f => ({ ...f, safety_status: k }))}
                className={`rounded-2xl px-3 py-3 text-sm font-extrabold border-2 transition ${
                  form.safety_status === k
                    ? (k === "active_thoughts" || k === "acute" ? "bg-red-risk border-red-risk text-white" : "bg-foreground border-foreground text-background")
                    : "bg-surface border-border-soft text-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="card-cream p-5 mb-6">
          <label className="text-sm font-extrabold mb-2 block">Anteckning (valfri)</label>
          <Textarea
            value={form.note}
            onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder="Något du vill minnas om dagen..."
            className="rounded-2xl border-border-soft bg-surface min-h-[80px]"
          />
        </div>

        {showSafetyDialog && (
          <div className="rounded-3xl border-2 border-red-risk bg-red-bg p-5 mb-4">
            <h3 className="font-extrabold text-red-risk mb-2">Innan du sparar</h3>
            <p className="text-sm mb-3 text-foreground/80">
              Du har angett en allvarlig signal. Kontakta vården, 1177 eller 112 vid akut fara. Vi sparar din dag oavsett.
            </p>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving} className="flex-1 bg-foreground text-background rounded-full font-extrabold">
                Spara ändå
              </Button>
              <Button onClick={() => navigate("/vard")} variant="outline" className="flex-1 rounded-full font-extrabold border-2 border-red-risk text-red-risk">
                Vård
              </Button>
            </div>
          </div>
        )}

        <Button
          onClick={save}
          disabled={saving}
          className="w-full h-14 rounded-full bg-orange-start hover:bg-orange-deep text-white font-extrabold text-[17px] shadow-soft"
        >
          {saving ? "Sparar..." : "Spara dagen"}
        </Button>
      </div>
    </div>
  );
};

const SliderField = ({ label, value, onChange, low, high }: { label: string; value: number; onChange: (v: number) => void; low: string; high: string }) => (
  <div className="card-cream p-5 mb-4">
    <div className="flex items-center justify-between mb-3">
      <label className="text-sm font-extrabold">{label}</label>
      <span className="text-base font-extrabold text-orange-deep">{value}</span>
    </div>
    <Slider value={[value]} min={0} max={10} step={1} onValueChange={([v]) => onChange(v)} />
    <div className="flex justify-between mt-2 text-[11px] font-semibold text-text-secondary">
      <span>{low}</span><span>{high}</span>
    </div>
  </div>
);

const SegField = ({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: [string, string][] }) => (
  <div className="card-cream p-5 mb-4">
    <label className="text-sm font-extrabold mb-3 block">{label}</label>
    <div className="grid grid-cols-3 gap-2">
      {opts.map(([k, l]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`rounded-2xl px-2 py-3 text-sm font-extrabold border-2 transition ${
            value === k ? "bg-foreground border-foreground text-background" : "bg-surface border-border-soft text-foreground"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  </div>
);

export default Checkin;
