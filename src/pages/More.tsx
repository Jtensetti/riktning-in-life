import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { HeroBanner } from "@/components/HeroBanner";
import { AbstractIcon } from "@/components/AbstractIcon";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, LogOut, Settings as SettingsIcon, HeartPulse } from "lucide-react";

const More = () => {
  const navigate = useNavigate();

  return (
    <AppShell>
      <HeroBanner tone="var(--cream-card)" icon="blob-smile" iconColor="hsl(var(--orange-start))" />
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-bold text-text-secondary mb-4 press-soft">
        <ChevronLeft size={18} /> Tillbaka
      </button>
      <header className="mb-6">
        <h1 className="text-[32px] leading-[38px] mb-1">Mer</h1>
        <p className="text-sm text-text-secondary">Stöd, kopplingar och konto.</p>
      </header>

      <section className="mb-7">
        <button
          onClick={() => navigate("/krisplan")}
          className="w-full rounded-3xl bg-red-bg border-2 border-red-risk/30 p-4 text-left press-soft animate-pop-in flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-risk/15 grid place-items-center shrink-0">
            <AbstractIcon name="shield-soft" size={22} color="hsl(var(--red-risk))" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-red-risk mb-0.5">När det blir svårt</p>
            <p className="text-[15px] font-extrabold">Min krisplan</p>
            <p className="text-xs text-text-secondary">Förbered i lugnt läge — använd när det behövs.</p>
          </div>
          <ChevronRight size={18} className="text-text-secondary shrink-0" />
        </button>
      </section>

      <section className="mb-7 space-y-3">
        <Row
          icon={<SettingsIcon size={18} />}
          iconBg="bg-blue-calm/15"
          iconColor="text-blue-calm"
          label="Inställningar"
          sub="Konto, påminnelser, plats och data"
          onClick={() => navigate("/installningar")}
        />
      </section>

      <section className="mb-7">
        <h2 className="text-lg font-extrabold mb-3">Om Riktning</h2>
        <div className="card-cream p-4 mb-3">
          <p className="text-sm leading-relaxed text-foreground/80">
            Riktning är inte ett medicintekniskt verktyg och ersätter inte vård eller behandling. Vid akut fara, ring 112 eller besök psykiatrisk akutmottagning.
          </p>
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
    </AppShell>
  );
};

const Row = ({
  icon, iconBg, iconColor, label, sub, onClick,
}: {
  icon: React.ReactNode; iconBg: string; iconColor: string; label: string; sub: string; onClick: () => void;
}) => (
  <button onClick={onClick} className="w-full card-soft p-4 flex items-center gap-3 text-left press-soft">
    <div className={`w-11 h-11 rounded-2xl ${iconBg} ${iconColor} grid place-items-center shrink-0`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-[15px] font-extrabold">{label}</p>
      <p className="text-xs text-text-secondary">{sub}</p>
    </div>
    <ChevronRight size={18} className="text-text-secondary shrink-0" />
  </button>
);

export default More;
