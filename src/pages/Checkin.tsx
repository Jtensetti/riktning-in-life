import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ChevronLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useWeather, weatherLabel, type WeatherKind } from "@/lib/weather";
import { AbstractIcon, weatherIcon, weatherIconColor, weatherIconAccent, type IconName } from "@/components/AbstractIcon";
import { ActivityPicker, type ActivityDraft } from "@/components/ActivityPicker";
import { refreshBaseline, loadBaseline, rankVariance, type VarianceField } from "@/lib/baseline";

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

const TOTAL_STEPS = 3;

const Checkin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(initialForm);
  const [saving, setSaving] = useState(false);
  const [showSafetyDialog, setShowSafetyDialog] = useState(false);
  const { weather } = useWeather(true);
  const [weatherOverride, setWeatherOverride] = useState<WeatherKind | null>(null);
  const [showWeatherPicker, setShowWeatherPicker] = useState(false);
  const [activities, setActivities] = useState<ActivityDraft[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [deepAnswer, setDeepAnswer] = useState<string>("");

  // Välj en adaptiv "djupfråga" baserat på vad som varierar mest för dig.
  // Stabil per session — räknas en gång på mount.
  const [deepField] = useState<VarianceField | null>(() => {
    const ranked = rankVariance(loadBaseline());
    return ranked[0] ?? null;
  });

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
          const prevKind = (data as any).weather_kind as WeatherKind | null | undefined;
          if (prevKind && weather && prevKind !== weather.kind) setWeatherOverride(prevKind);
        }
      });
  }, [user, weather]);

  useEffect(() => {
    if (!user) return;
    supabase.from("activity_logs")
      .select("activity_slug,label,category,icon,color,duration_minutes,mood_delta")
      .eq("user_id", user.id).eq("date", todayISO()).order("created_at")
      .then(({ data }) => {
        if (data) {
          setActivities(data.map((r: any) => ({
            slug: r.activity_slug, label: r.label, category: r.category,
            icon: r.icon, color: r.color,
            duration_minutes: r.duration_minutes ?? 30,
            mood_delta: r.mood_delta ?? 0,
          })));
        }
      });
  }, [user]);

  const addActivity = async (a: ActivityDraft) => {
    setActivities((prev) => [...prev, a]);
    if (!user) return;
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      date: todayISO(),
      activity_slug: a.slug,
      label: a.label,
      category: a.category,
      icon: a.icon,
      color: a.color,
      duration_minutes: a.duration_minutes,
      mood_delta: a.mood_delta,
    });
  };

  const removeActivity = async (idx: number) => {
    const a = activities[idx];
    setActivities((prev) => prev.filter((_, i) => i !== idx));
    if (!user) return;
    const { data } = await supabase
      .from("activity_logs")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", todayISO())
      .eq("activity_slug", a.slug)
      .order("created_at", { ascending: false })
      .limit(1);
    if (data && data[0]) await supabase.from("activity_logs").delete().eq("id", data[0].id);
  };

  const deriveLegacy = () => {
    if (activities.length === 0) {
      return { movement_today: form.movement_today, meaningful_activity: form.meaningful_activity };
    }
    const meaningfulCats = new Set([
      "Mästring & mening", "Familj & nära", "Social kontakt",
      "Utomhus & natur", "Villa & trädgård", "Lugn glädje",
    ]);
    const movementSlugs = new Set([
      "promenad", "jogg", "cykla", "simma", "skogspromenad", "langpromenad-skog",
      "tradgardsarbete", "klippa-gras", "snoskottning", "vedhuggning",
    ]);
    const movementCount = activities.filter(
      (a) => a.category === "Rörelse & kropp" || movementSlugs.has(a.slug),
    ).length;
    const meaningfulCount = activities.filter((a) => meaningfulCats.has(a.category)).length;
    return {
      movement_today: (movementCount === 0 ? "none" : movementCount === 1 ? "little" : "yes") as Form["movement_today"],
      meaningful_activity: (meaningfulCount === 0 ? "none" : meaningfulCount === 1 ? "little" : "yes") as Form["meaningful_activity"],
    };
  };

  const save = async () => {
    if (!user) return;
    if ((form.safety_status === "active_thoughts" || form.safety_status === "acute") && !showSafetyDialog) {
      setShowSafetyDialog(true);
      return;
    }
    setSaving(true);
    const legacy = deriveLegacy();
    const { error } = await supabase.from("daily_checkins").upsert({
      user_id: user.id,
      date: todayISO(),
      ...form,
      medication_taken: form.medication_taken || null,
      movement_today: legacy.movement_today || null,
      meaningful_activity: legacy.meaningful_activity || null,
      weather_kind: effectiveKind,
      weather_temp_c: weather ? weather.tempC : null,
    } as any, { onConflict: "user_id,date" });
    setSaving(false);
    if (error) {
      toast.error("Det gick inte att spara. Försök igen.");
      return;
    }
    toast.success("Tack — det här hjälper dig se mönster.");

    // Auto-refresh baseline med färsk data så att tröskelvärden alltid är aktuella.
    // Body är fire-and-forget — vi blockerar inte navigeringen.
    void (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data } = await supabase
        .from("daily_checkins")
        .select("date,mood_heaviness,anxiety,energy,sleep_hours,function_score,daytime_bed_sofa_time_minutes")
        .eq("user_id", user.id)
        .gte("date", since.toISOString().split("T")[0]);
      if (data) refreshBaseline(data as any);
    })();

    navigate("/");
  };

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const stepHeading = ["Hur är kroppen idag?", "Hur är huvudet idag?", "Hur går dagen?"][step];
  const stepIntro = [
    "Sömn, energi och rörelse. Tre korta frågor.",
    "Inga rätt svar — bara hur det känns just nu.",
    "Vad du orkat, gjort, och hur du har det. Sen sparar vi.",
  ][step];

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="max-w-md mx-auto px-6 pt-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-text-secondary text-sm font-bold mb-4 press-soft"
        >
          <ArrowLeft size={18} /> Tillbaka
        </button>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-orange-start" : "bg-surface-alt"}`} />
          ))}
        </div>

        <h1 className="text-[28px] leading-[34px] mb-2 animate-fade-in-up">{stepHeading}</h1>
        <p className="text-sm text-text-secondary mb-6 animate-fade-in-up" style={{ animationDelay: "var(--stagger-1)" }}>
          {stepIntro}
        </p>

        {/* Steg 1 — Kroppen: sömn (timmar + kvalitet), energi */}
        {step === 0 && (
          <>
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
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-text-secondary">Vädret idag</p>
                  <p className="text-sm font-extrabold truncate">
                    {weatherLabel(effectiveKind)}
                    {weather && !weatherOverride ? ` · ${Math.round(weather.tempC)}°` : ""}
                    {weatherOverride ? " · ändrat" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWeatherPicker(s => !s)}
                  className="text-xs font-extrabold text-orange-deep underline press-soft shrink-0"
                >
                  {showWeatherPicker ? "Stäng" : "Ändra"}
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

            <div className="card-cream p-5 mb-4 press-soft animate-fade-in-up">
              <label className="text-sm font-extrabold mb-3 block">Hur länge sov du i natt?</label>
              <Slider value={[form.sleep_hours]} min={0} max={12} step={0.5} onValueChange={([v]) => setForm(f => ({ ...f, sleep_hours: v }))} />
              <div className="text-right text-sm font-bold mt-2">{form.sleep_hours} h</div>
            </div>

            <SliderField idx={1} label="Hur kändes sömnen?" value={form.sleep_quality} onChange={(v) => setForm(f => ({ ...f, sleep_quality: v }))} low="Dålig" high="Bra" />
            <SliderField idx={2} label="Hur mycket energi har du?" value={form.energy} onChange={(v) => setForm(f => ({ ...f, energy: v }))} low="Tom" high="Pigg" />
          </>
        )}

        {/* Steg 2 — Huvudet: tyngd, oro, självkritik, hopplöshet */}
        {step === 1 && (
          <>
            <SliderField idx={0} label="Hur tungt känns det?" value={form.mood_heaviness} onChange={(v) => setForm(f => ({ ...f, mood_heaviness: v }))} low="Lätt" high="Tungt" />
            <SliderField idx={1} label="Hur orolig är du?" value={form.anxiety} onChange={(v) => setForm(f => ({ ...f, anxiety: v }))} low="Lugn" high="Mycket orolig" />
            <SliderField idx={2} label="Är du hård mot dig själv?" value={form.guilt_selfcriticism} onChange={(v) => setForm(f => ({ ...f, guilt_selfcriticism: v }))} low="Mild" high="Skarp" />
            <SliderField idx={3} label="Känns det hopplöst?" value={form.hopelessness} onChange={(v) => setForm(f => ({ ...f, hopelessness: v }))} low="Det finns hopp" high="Tomt" />
          </>
        )}

        {/* Steg 3 — Dagen: orka, aktiviteter, trygghet, anteckning */}
        {step === 2 && (
          <>
            <SliderField idx={0} label="Hur mycket orkar du?" value={form.function_score} onChange={(v) => setForm(f => ({ ...f, function_score: v }))} low="Lite" high="Mycket" />
            <SliderField idx={1} label="Hur lätt går det att starta?" value={form.getting_started} onChange={(v) => setForm(f => ({ ...f, getting_started: v }))} low="Tungt" high="Lätt" />

            <SegField label="Tagit medicinen idag?" value={form.medication_taken} onChange={(v) => setForm(f => ({ ...f, medication_taken: v as Form["medication_taken"] }))}
              opts={[["yes", "Ja"], ["partial", "Delvis"], ["no", "Nej"]]} />

            <div className="card-cream p-5 mb-4 animate-fade-in-up">
              <div className="flex items-baseline justify-between mb-1">
                <label className="text-sm font-extrabold">Saker du gjort idag</label>
                <span className="text-[11px] font-bold text-text-secondary">{activities.length} loggade</span>
              </div>
              <p className="text-xs text-text-secondary mb-3">Litet räknas. Kaffe i solen lika mycket som en löprunda.</p>

              {activities.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {activities.map((a, i) => (
                    <div
                      key={i}
                      className={`inline-flex items-center gap-2 rounded-full pl-2 pr-1 py-1 ${colorBg(a.color)} animate-pop-in shadow-card`}
                    >
                      <AbstractIcon name={a.icon as IconName} size={16} color="currentColor" />
                      <span className="text-xs font-extrabold">{a.label}</span>
                      <span className="text-[10px] opacity-90 font-bold">· {a.duration_minutes}m {moodEmoji(a.mood_delta)}</span>
                      <button
                        onClick={() => removeActivity(i)}
                        className="ml-1 w-6 h-6 rounded-full bg-white/25 grid place-items-center press-soft"
                        aria-label="Ta bort"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setPickerOpen(true)}
                className="w-full h-12 rounded-full bg-foreground text-background font-extrabold text-sm press-soft inline-flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                {activities.length === 0 ? "Lägg till något" : "Lägg till en till"}
              </button>
            </div>

            <div className="card-cream p-5 mb-4 animate-fade-in-up">
              <label className="text-sm font-extrabold mb-1 block">Är du trygg just nu?</label>
              <p className="text-xs text-text-secondary mb-3">Ärlighet hjälper både dig och vården.</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["none", "Ja, det är okej"],
                  ["passive_thoughts", "Tunga tankar"],
                  ["active_thoughts", "Behöver hjälp"],
                  ["acute", "Akut nu"],
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

            <div className="card-cream p-5 mb-6 animate-fade-in-up">
              <label className="text-sm font-extrabold mb-2 block">Något du vill skriva ner? (valfritt)</label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="En tanke, en händelse, något att minnas..."
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
          </>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-2">
          {step > 0 && (
            <Button
              onClick={prev}
              variant="secondary"
              className="h-14 rounded-full font-extrabold text-[15px] press-soft px-6"
            >
              <ChevronLeft size={18} /> Tillbaka
            </Button>
          )}
          <Button
            onClick={step < TOTAL_STEPS - 1 ? next : save}
            disabled={saving}
            className="flex-1 h-14 rounded-full bg-orange-start hover:bg-orange-deep text-white font-extrabold text-[17px] shadow-soft press-soft"
          >
            {saving ? "Sparar..." : step < TOTAL_STEPS - 1 ? "Fortsätt" : "Spara dagen"}
          </Button>
        </div>
      </div>

      <ActivityPicker open={pickerOpen} onOpenChange={setPickerOpen} onAdd={addActivity} />
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
  <div className="card-cream p-5 mb-4 animate-fade-in-up">
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
