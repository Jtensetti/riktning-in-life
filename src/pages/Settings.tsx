import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { AbstractIcon, weatherIcon, weatherIconColor } from "@/components/AbstractIcon";
import { ScreenHeader } from "@/components/ui-kit/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { toast } from "sonner";
import { loadReminders, saveReminders, resetOnboarded, type Reminders } from "@/lib/settings";
import { loadFlags, saveFlags, type UserFlags } from "@/lib/flags";
import { useWeather, weatherLabel, isWeatherPermissionGranted, setWeatherPermissionGranted } from "@/lib/weather";

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminders>(loadReminders());
  const [flags, setFlagsState] = useState<UserFlags>(loadFlags());
  const [confirmText, setConfirmText] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const { weather, status: weatherStatus, requestLocation } = useWeather(false);
  const [locationGranted, setLocationGranted] = useState<boolean>(isWeatherPermissionGranted());

  const updateReminders = (r: Reminders) => {
    setReminders(r);
    saveReminders(r);
  };

  const updateFlags = (next: UserFlags) => {
    setFlagsState(next);
    void saveFlags(next);
  };

  const exportAll = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const [c, es, je, wf, m, ml] = await Promise.all([
        supabase.from("daily_checkins").select("*").eq("user_id", user.id),
        supabase.from("exercise_sessions").select("*").eq("user_id", user.id),
        supabase.from("journal_entries").select("*").eq("user_id", user.id),
        supabase.from("weekly_forms").select("*").eq("user_id", user.id),
        supabase.from("medications").select("*").eq("user_id", user.id),
        supabase.from("medication_logs").select("*").eq("user_id", user.id),
      ]);
      const dump = {
        exported_at: new Date().toISOString(),
        user_email: user.email,
        daily_checkins: c.data ?? [],
        exercise_sessions: es.data ?? [],
        journal_entries: je.data ?? [],
        weekly_forms: wf.data ?? [],
        medications: m.data ?? [],
        medication_logs: ml.data ?? [],
      };
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `riktning-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export nedladdad");
    } catch {
      toast.error("Något gick fel vid export");
    } finally {
      setBusy(false);
    }
  };

  const deleteAll = async () => {
    if (!user || confirmText !== "RADERA") return;
    setBusy(true);
    try {
      // Alla tabeller där användaren äger rader. Kör parallellt — ingen FK
      // mellan dem kräver särskild ordning (allt är peer-data per user_id).
      const tables = [
        "medication_logs",
        "medications",
        "exercise_sessions",
        "journal_entries",
        "weekly_forms",
        "daily_checkins",
        "activity_logs",
        "activity_favorites",
        "crisis_plans",
        "weekly_insights",
        "user_settings",
      ] as const;

      const results = await Promise.all(
        tables.map(async (t) => {
          const { error } = await supabase.from(t).delete().eq("user_id", user.id);
          return { table: t, error };
        }),
      );

      const failed = results.filter((r) => r.error);
      if (failed.length > 0) {
        const names = failed.map((f) => f.table).join(", ");
        console.error("deleteAll failed for:", failed);
        toast.error(`Kunde inte radera: ${names}`);
        setBusy(false);
        return;
      }

      // Rensa lokal cache INNAN signOut så att inget hinner re-hydrera.
      try {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith("riktning")) keys.push(k);
        }
        keys.forEach((k) => localStorage.removeItem(k));
      } catch {
        /* quota / privacy mode — ignorera */
      }

      resetOnboarded();
      await supabase.auth.signOut();
      toast.success("All data raderad");
      navigate("/auth", { replace: true });
    } catch (e) {
      console.error("deleteAll exception:", e);
      toast.error("Något gick fel");
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <ScreenHeader
        screen="more"
        title="Inställningar"
        subtitle="Konto, påminnelser och din data."
        topLeft={
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm font-bold text-foreground/80 press-soft"
          >
            <ChevronLeft size={18} /> Tillbaka
          </button>
        }
      />

      <section className="mb-7">
        <h2 className="text-lg font-extrabold mb-3">Konto</h2>
        <div className="card-soft p-4 mb-3">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-1">E-post</p>
          <p className="text-sm font-extrabold truncate">{user?.email ?? "—"}</p>
        </div>
        <Button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate("/auth", { replace: true });
          }}
          variant="secondary"
          className="w-full h-12 rounded-full font-extrabold press-soft"
        >
          <LogOut size={16} /> Logga ut
        </Button>
      </section>

      <section className="mb-7">
        <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
          <AbstractIcon name="clock-alarm" size={20} color="hsl(var(--orange-deep))" />
          Påminnelser
        </h2>
        <div className="space-y-3">
          <ToggleRow label="Morgon-checkin" checked={reminders.morning_checkin} onChange={v => updateReminders({ ...reminders, morning_checkin: v })} />
          <ToggleRow label="Kvällsjournal" checked={reminders.evening_journal} onChange={v => updateReminders({ ...reminders, evening_journal: v })} />
          <ToggleRow label="Veckoformulär" checked={reminders.weekly_forms} onChange={v => updateReminders({ ...reminders, weekly_forms: v })} />
        </div>
      </section>

      <section className="mb-7">
        <h2 className="text-lg font-extrabold mb-3">Plats & väder</h2>
        <div className="card-cream p-4">
          <div className="flex items-start gap-3 mb-3">
            <AbstractIcon
              name={weather ? weatherIcon(weather.kind, weather.isDaylight) : "weather-partly"}
              size={36}
              color={weather ? weatherIconColor(weather.kind, weather.isDaylight) : "hsl(var(--orange-start))"}
              accent="hsl(var(--cream-card))"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold">
                {locationGranted ? "Plats aktiv" : "Plats avstängd"}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {weather
                  ? `${weatherLabel(weather.kind)} · ${Math.round(weather.tempC)}°`
                  : "Anpassar tips och loggar vädret automatiskt."}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                const w = await requestLocation();
                setLocationGranted(isWeatherPermissionGranted());
                if (w) toast.success("Plats uppdaterad");
              }}
              variant="secondary"
              className="flex-1 h-11 rounded-full font-extrabold press-soft"
              disabled={weatherStatus === "loading" || weatherStatus === "prompting"}
            >
              {locationGranted ? "Hämta igen" : "Tillåt plats"}
            </Button>
            {locationGranted && (
              <Button
                onClick={() => {
                  setWeatherPermissionGranted(false);
                  setLocationGranted(false);
                  toast.success("Platsåtkomst avstängd");
                }}
                variant="secondary"
                className="h-11 rounded-full font-extrabold press-soft"
              >
                Stäng av
              </Button>
            )}
          </div>
        </div>
      </section>


      <section className="mb-7">
        <h2 className="text-lg font-extrabold mb-3">Din data</h2>
        <div className="space-y-3">
          <Button
            onClick={exportAll}
            disabled={busy}
            variant="secondary"
            className="w-full h-12 rounded-full font-extrabold justify-start press-soft"
          >
            <AbstractIcon name="bookmark-soft" size={16} color="currentColor" /> Exportera all data
          </Button>
          <Button
            onClick={() => setShowDelete(s => !s)}
            disabled={busy}
            className="w-full h-12 rounded-full font-extrabold justify-start bg-red-bg text-red-risk hover:bg-red-bg/80 press-soft"
          >
            <AbstractIcon name="eye-closed" size={16} color="currentColor" /> Radera all data
          </Button>
          {showDelete && (
            <div className="rounded-3xl border-2 border-red-risk bg-red-bg p-4">
              <p className="text-sm font-extrabold text-red-risk mb-1">Detta går inte att ångra</p>
              <p className="text-xs text-foreground/80 mb-3">
                All din data raderas permanent. Skriv <strong>RADERA</strong> för att bekräfta.
              </p>
              <Input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="RADERA"
                className="h-11 rounded-2xl bg-surface mb-3"
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => { setShowDelete(false); setConfirmText(""); }}
                  className="flex-1 rounded-full font-extrabold"
                >
                  Avbryt
                </Button>
                <Button
                  onClick={deleteAll}
                  disabled={confirmText !== "RADERA" || busy}
                  className="flex-1 rounded-full bg-red-risk hover:bg-red-risk/90 text-white font-extrabold"
                >
                  Radera
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mb-7">
        <h2 className="text-lg font-extrabold mb-3">Om Riktning</h2>
        <div className="card-cream p-4">
          <p className="text-sm leading-relaxed text-foreground/80">
            Riktning är inte ett medicintekniskt verktyg och ersätter inte vård eller behandling. Vid akut fara, ring 112 eller besök psykiatrisk akutmottagning.
          </p>
        </div>
      </section>
    </AppShell>
  );
};

const ToggleRow = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center justify-between card-cream p-4 cursor-pointer">
    <span className="text-sm font-extrabold">{label}</span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </label>
);

const LinkRow = ({ icon, iconBg, iconColor, label, sub, onClick }: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  sub: string;
  onClick: () => void;
}) => (
  <button onClick={onClick} className="w-full card-soft p-4 flex items-center gap-3 text-left press-soft">
    <div className={`w-11 h-11 rounded-2xl ${iconBg} ${iconColor} grid place-items-center shrink-0`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[15px] font-extrabold">{label}</p>
      <p className="text-xs text-text-secondary">{sub}</p>
    </div>
    <ChevronRight size={18} className="text-text-secondary shrink-0" />
  </button>
);

export default Settings;
