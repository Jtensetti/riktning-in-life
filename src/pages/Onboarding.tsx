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

  const finish = async () => {
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
    saveReminders(reminders);
    markOnboarded();
    setSaving(false);
    toast.success("Välkommen till Riktning");
    navigate("/", { replace: true });
  };

  const next = () => setStep(s => s + 1);
  const skip = () => {
    saveReminders(reminders);
    markOnboarded();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 max-w-md w-full mx-auto px-6 pt-8 pb-32 flex flex-col">
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
          {[0, 1, 2, 3].map(i => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-orange-start" : "bg-surface-alt"}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="animate-fade-in-up">
            <Illustration name="start" className="w-full h-auto mb-6 rounded-3xl animate-pop-in" />
            <h1 className="text-[32px] leading-[38px] mb-3">Det här är Riktning</h1>
            <p className="text-base text-text-secondary mb-6 leading-relaxed">
              En lugn app för dig som lever med psykisk ohälsa. Riktning hjälper dig att se rörelse i mående, funktion och återhämtning – och bygga en rapport till din vård.
            </p>
            <div className="card-cream p-4 mb-6">
              <p className="text-sm font-extrabold mb-1">Inte diagnostisk</p>
              <p className="text-xs text-text-secondary">Riktning ersätter inte vård eller behandling. Den hjälper dig att se mönster över tid.</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in-up">
            <Illustration name="baseline" className="w-full h-auto mb-6 rounded-3xl animate-pop-in" />
            <h1 className="text-[32px] leading-[38px] mb-3">Första 14 dagarna bygger din baslinje</h1>
            <p className="text-base text-text-secondary mb-6 leading-relaxed">
              Under de första två veckorna lär appen ditt normalläge. Vi visar inga upp- eller nedåtgående bedömningar förrän baslinjen finns.
            </p>
            <div className="card-cream p-4 mb-6">
              <p className="text-sm font-extrabold mb-1">Spara dagen som den var</p>
              <p className="text-xs text-text-secondary">En tung dag är inte ett misslyckande. Den är data.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <>
            <Illustration name="medication" className="w-full h-auto mb-6 rounded-3xl" />
            <h1 className="text-[32px] leading-[38px] mb-3">Lägg till läkemedel</h1>
            <p className="text-sm text-text-secondary mb-6">
              Valfritt. Du kan alltid lägga till fler senare i Vård.
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
          </>
        )}

        {step === 3 && (
          <>
            <Illustration name="checkin" className="w-full h-auto mb-6 rounded-3xl" />
            <h1 className="text-[32px] leading-[38px] mb-3">Påminnelser</h1>
            <p className="text-sm text-text-secondary mb-6">
              Valfritt. Du får ingen push i denna version – det här hjälper oss att visa rätt prompt på rätt plats.
            </p>
            <div className="space-y-3 mb-6">
              <ToggleRow label="Morgon-checkin" hint="En liten påminnelse att logga dagen" checked={reminders.morning_checkin} onChange={v => setReminders(r => ({ ...r, morning_checkin: v }))} />
              <ToggleRow label="Kvällsjournal" hint="Spara dagen i tre rader" checked={reminders.evening_journal} onChange={v => setReminders(r => ({ ...r, evening_journal: v }))} />
              <ToggleRow label="Veckoformulär" hint="PHQ-9, GAD-7, WHO-5" checked={reminders.weekly_forms} onChange={v => setReminders(r => ({ ...r, weekly_forms: v }))} />
            </div>
          </>
        )}

        <div className="mt-auto" />

        <Button
          onClick={step < 3 ? next : finish}
          disabled={saving}
          className="w-full h-14 rounded-full bg-orange-start hover:bg-orange-deep text-white font-extrabold text-[17px] shadow-soft press-soft"
        >
          {saving ? "Sparar..." : step < 3 ? "Fortsätt" : "Kom igång"}
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
