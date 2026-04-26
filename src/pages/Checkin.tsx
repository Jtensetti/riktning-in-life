import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useWeather, weatherLabel, type WeatherKind } from "@/lib/weather";
import { AbstractIcon, weatherIcon, weatherIconColor, weatherIconAccent, type IconName } from "@/components/AbstractIcon";
import { ActivityPicker, type ActivityDraft } from "@/components/ActivityPicker";

const colorBg = (color: string): string => {
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

const moodEmoji = (d: number) => (d >= 2 ? "😊" : d === 1 ? "🙂" : d === 0 ? "😐" : d === -1 ? "🙁" : "😔");

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
  const { weather } = useWeather(true);
  const [weatherOverride, setWeatherOverride] = useState<WeatherKind | null>(null);
  const [showWeatherPicker, setShowWeatherPicker] = useState(false);

  // Effective weather kind = manual override if set, else autodetected.
  const effectiveKind: WeatherKind | null = weatherOverride ?? weather?.kind ?? null;

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
          // Restore prior weather override if user changed it earlier today.
          const prevKind = (data as any).weather_kind as WeatherKind | null | undefined;
          if (prevKind && weather && prevKind !== weather.kind) setWeatherOverride(prevKind);
        }
      });
  }, [user, weather]);

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
      weather_kind: effectiveKind,
      weather_temp_c: weather ? weather.tempC : null,
    } as any, { onConflict: "user_id,date" });
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
          className="flex items-center gap-1 text-text-secondary text-sm font-bold mb-4 press-soft"
        >
          <ArrowLeft size={18} /> Tillbaka
        </button>
        <h1 className="text-[28px] leading-[34px] mb-2 animate-fade-in-up">Logga dagen</h1>
        <p className="text-sm text-text-secondary mb-8 animate-fade-in-up" style={{ animationDelay: "var(--stagger-1)" }}>
          Tar under 60 sekunder. Spara dagen som den var.
        </p>

        {effectiveKind && (
          <div className="card-cream p-4 mb-4 animate-fade-in-up flex items-center gap-3">
            <div className="shrink-0">
              <AbstractIcon
                name={weatherIcon(effectiveKind, weather?.isDaylight ?? true)}
                size={36}
                color={weatherIconColor(effectiveKind, weather?.isDaylight ?? true)}
                accent={weatherIconAccent(effectiveKind)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-text-secondary">Väder just nu</p>
              <p className="text-sm font-extrabold truncate">
                {weatherLabel(effectiveKind)}
                {weather && !weatherOverride ? ` · ${Math.round(weather.tempC)}°` : ""}
                {weatherOverride ? " · justerat" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowWeatherPicker(s => !s)}
              className="text-xs font-extrabold text-orange-deep underline press-soft shrink-0"
            >
              {showWeatherPicker ? "Stäng" : "Byt"}
            </button>
          </div>
        )}
        {showWeatherPicker && (
          <div className="card-cream p-3 mb-4 animate-fade-in-up grid grid-cols-4 gap-2">
            {(["clear", "partly", "cloudy", "rain", "snow", "fog", "thunder", "wind"] as WeatherKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => { setWeatherOverride(k); setShowWeatherPicker(false); }}
                className={`rounded-2xl p-2 flex flex-col items-center gap-1 border-2 press-soft ${
                  effectiveKind === k ? "border-foreground bg-surface-alt" : "border-border-soft bg-surface"
                }`}
              >
                <AbstractIcon
                  name={weatherIcon(k, true)}
                  size={28}
                  color={weatherIconColor(k, true)}
                  accent={weatherIconAccent(k)}
                />
                <span className="text-[10px] font-extrabold leading-tight text-center">{weatherLabel(k)}</span>
              </button>
            ))}
          </div>
        )}

        <SliderField idx={0} label="Tyngd / nedstämdhet" value={form.mood_heaviness} onChange={(v) => setForm(f => ({ ...f, mood_heaviness: v }))} low="Lätt" high="Tungt" />
        <SliderField idx={1} label="Oro / ångest" value={form.anxiety} onChange={(v) => setForm(f => ({ ...f, anxiety: v }))} low="Lugn" high="Hög oro" />
        <SliderField idx={2} label="Skuld / självkritik" value={form.guilt_selfcriticism} onChange={(v) => setForm(f => ({ ...f, guilt_selfcriticism: v }))} low="Mild" high="Skarp" />
        <SliderField idx={3} label="Hopplöshet" value={form.hopelessness} onChange={(v) => setForm(f => ({ ...f, hopelessness: v }))} low="Hopp" high="Tomt" />
        <SliderField idx={4} label="Energi" value={form.energy} onChange={(v) => setForm(f => ({ ...f, energy: v }))} low="Tom" high="Pigg" />
        <SliderField idx={4} label="Komma igång" value={form.getting_started} onChange={(v) => setForm(f => ({ ...f, getting_started: v }))} low="Tungt" high="Lätt" />
        <SliderField idx={4} label="Funktion" value={form.function_score} onChange={(v) => setForm(f => ({ ...f, function_score: v }))} low="Låg" high="Hög" />

        <div className="card-cream p-5 mb-4 press-soft animate-fade-in-up" style={{ animationDelay: "var(--stagger-4)" }}>
          <label className="text-sm font-extrabold mb-3 block">Sömn (timmar)</label>
          <Slider value={[form.sleep_hours]} min={0} max={12} step={0.5} onValueChange={([v]) => setForm(f => ({ ...f, sleep_hours: v }))} />
          <div className="text-right text-sm font-bold mt-2">{form.sleep_hours} h</div>
        </div>

        <SliderField idx={4} label="Sömnkvalitet" value={form.sleep_quality} onChange={(v) => setForm(f => ({ ...f, sleep_quality: v }))} low="Dålig" high="Bra" />

        <div className="card-cream p-5 mb-4 press-soft animate-fade-in-up" style={{ animationDelay: "var(--stagger-4)" }}>
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

        <div className="card-cream p-5 mb-4 animate-fade-in-up" style={{ animationDelay: "var(--stagger-4)" }}>
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
                className={`rounded-2xl px-3 py-3 text-sm font-extrabold border-2 transition press-soft ${
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

        <div className="card-cream p-5 mb-6 animate-fade-in-up" style={{ animationDelay: "var(--stagger-4)" }}>
          <label className="text-sm font-extrabold mb-2 block">Anteckning (valfri)</label>
          <Textarea
            value={form.note}
            onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder="Något du vill minnas om dagen..."
            className="rounded-2xl border-border-soft bg-surface min-h-[80px]"
          />
        </div>

        {showSafetyDialog && (
          <div className="rounded-3xl border-2 border-red-risk bg-red-bg p-5 mb-4 animate-pop-in">
            <h3 className="font-extrabold text-red-risk mb-2">Innan du sparar</h3>
            <p className="text-sm mb-3 text-foreground/80">
              Du har angett en allvarlig signal. Kontakta vården, 1177 eller 112 vid akut fara. Vi sparar din dag oavsett.
            </p>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving} className="flex-1 bg-foreground text-background rounded-full font-extrabold press-soft">
                Spara ändå
              </Button>
              <Button onClick={() => navigate("/vard")} variant="outline" className="flex-1 rounded-full font-extrabold border-2 border-red-risk text-red-risk press-soft">
                Vård
              </Button>
            </div>
          </div>
        )}

        <Button
          onClick={save}
          disabled={saving}
          className="w-full h-14 rounded-full bg-orange-start hover:bg-orange-deep text-white font-extrabold text-[17px] shadow-soft press-soft"
        >
          {saving ? "Sparar..." : "Spara dagen"}
        </Button>
      </div>
    </div>
  );
};

const SliderField = ({ idx = 0, label, value, onChange, low, high }: { idx?: number; label: string; value: number; onChange: (v: number) => void; low: string; high: string }) => (
  <div
    className="card-cream p-5 mb-4 press-soft animate-fade-in-up"
    style={{ animationDelay: `var(--stagger-${Math.min(idx, 4)})` }}
  >
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
  <div className="card-cream p-5 mb-4 animate-fade-in-up" style={{ animationDelay: "var(--stagger-4)" }}>
    <label className="text-sm font-extrabold mb-3 block">{label}</label>
    <div className="grid grid-cols-3 gap-2">
      {opts.map(([k, l]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`rounded-2xl px-2 py-3 text-sm font-extrabold border-2 transition press-soft ${
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
