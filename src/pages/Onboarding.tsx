import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Illustration } from "@/components/Illustrations";
import { markOnboarded, saveReminders, type Reminders, defaultReminders } from "@/lib/settings";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

const TOTAL_STEPS = 3;

const Onboarding = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [started, setStarted] = useState("");
  const [reminders, setReminders] = useState<Reminders>(defaultReminders);
  const [saving, setSaving] = useState(false);

  if (!loading && !user) {
    navigate("/auth");
    return null;
  }

  const finish = async (withReminders: boolean) => {
    if (!user) return;
    setSaving(true);
    if (name.trim()) {
      await supabase.from("medications").insert({
        user_id: user.id,
        name: name.trim(),
        dose: dose.trim() || null,
        date_started: started || null,
        active: true,
      });
    }
    saveReminders(
      withReminders
        ? { ...reminders, morning_checkin: true, evening_journal: true, weekly_forms: true }
        : reminders,
    );
    markOnboarded();
    setSaving(false);
    toast.success("Välkommen");
    navigate("/", { replace: true });
  };

  const next = () => setStep(s => s + 1);
  const skip = () => {
    saveReminders(reminders);
    markOnboarded();
    navigate("/", { replace: true });
  };

  const stepIllustration: "start" | "medication" | "checkin" =
    step === 0 ? "start" : step === 1 ? "medication" : "checkin";

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Desktop-only sidopanel — illustrationen flyttas ut till halva skärmen
       *  istället för att klämmas in över 448 px-kolonnen. Inget extra innehåll
       *  bara för att fylla bredden. */}
      <aside
        aria-hidden
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-12"
        style={{ background: "linear-gradient(135deg, hsl(var(--orange-start) / 0.12), hsl(var(--cream-card)))" }}
      >
        <div className="max-w-[480px] w-full">
          <Illustration name={stepIllustration} className="w-full h-auto rounded-3xl" />
        </div>
      </aside>

      <main className="flex-1 max-w-md w-full mx-auto px-6 pt-8 pb-32 flex flex-col lg:max-w-[520px] lg:justify-center lg:pt-12">
        <div className="flex items-center justify-between mb-6">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 text-sm font-bold text-text-secondary">
              <ChevronLeft size={18} /> Tillbaka
            </button>
          ) : <span />}
          <button onClick={skip} className="text-sm font-bold text-text-secondary underline">
            Hoppa över
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-orange-start" : "bg-surface-alt"}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="animate-fade-in-up">
            <Illustration name="start" className="w-full h-auto mb-6 rounded-3xl animate-pop-in" />
            <h1 className="text-[32px] leading-[38px] mb-3">Välkommen till Riktning</h1>
            <p className="text-base text-text-secondary mb-6 leading-relaxed">
              En lugn plats för att se hur du har det över tid. Du loggar lite varje dag — appen hjälper dig att se mönstren.
            </p>
            <div className="card-cream p-4 mb-4">
              <p className="text-sm font-extrabold mb-1">Första två veckorna lär jag känna dig</p>
              <p className="text-xs text-text-secondary">Innan dess visar jag inga upp- eller nedåt-bedömningar. Bara dina dagar.</p>
            </div>
            <div className="card-cream p-4 mb-6">
              <p className="text-sm font-extrabold mb-1">Inte vård</p>
              <p className="text-xs text-text-secondary">Riktning ersätter inte vård eller behandling. Vid akut fara: ring 112.</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in-up">
            <Illustration name="medication" className="w-full h-auto mb-6 rounded-3xl" />
            <h1 className="text-[32px] leading-[38px] mb-3">Tar du någon medicin?</h1>
            <p className="text-base text-text-secondary mb-6 leading-relaxed">
              Helt valfritt. Du kan lägga till — eller hoppa över — och göra det senare när du vill.
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-1.5 block">Namn</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="t.ex. Sertralin" className="h-12 rounded-2xl bg-surface" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-1.5 block">Dos</label>
                  <Input value={dose} onChange={e => setDose(e.target.value)} placeholder="50 mg" className="h-12 rounded-2xl bg-surface" />
                </div>
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-1.5 block">Startat</label>
                  <Input type="date" value={started} onChange={e => setStarted(e.target.value)} className="h-12 rounded-2xl bg-surface" />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in-up">
            <Illustration name="checkin" className="w-full h-auto mb-6 rounded-3xl" />
            <h1 className="text-[32px] leading-[38px] mb-3">Vill du ha små påminnelser?</h1>
            <p className="text-base text-text-secondary mb-6 leading-relaxed">
              En enkel pingning om dagen — och en kort fråga i veckan. Du kan ändra detta när som helst.
            </p>
            <div className="space-y-3 mb-6">
              <ToggleRow
                label="Påminn mig en gång om dagen"
                hint="Mjukt — bara så du inte glömmer"
                checked={reminders.morning_checkin}
                onChange={v => setReminders(r => ({ ...r, morning_checkin: v, evening_journal: v }))}
              />
              <ToggleRow
                label="En kort fråga i veckan"
                hint="Korta veckoformulär från vården"
                checked={reminders.weekly_forms}
                onChange={v => setReminders(r => ({ ...r, weekly_forms: v }))}
              />
            </div>
          </div>
        )}

        <div className="mt-auto" />

        <Button
          onClick={step < TOTAL_STEPS - 1 ? next : () => finish(false)}
          disabled={saving}
          className="w-full h-14 rounded-full bg-orange-start hover:bg-orange-deep text-white font-extrabold text-[17px] shadow-soft press-soft"
        >
          {saving ? "Sparar..." : step < TOTAL_STEPS - 1 ? "Fortsätt" : "Kom igång"}
        </Button>
      </main>
    </div>
  );
};

const ToggleRow = ({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center justify-between card-cream p-4 cursor-pointer">
    <div className="min-w-0 pr-3">
      <div className="text-sm font-extrabold">{label}</div>
      <div className="text-xs text-text-secondary">{hint}</div>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </label>
);

export default Onboarding;
