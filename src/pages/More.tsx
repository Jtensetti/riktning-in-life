import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ui-kit/ScreenHeader";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

const More = () => {
  const navigate = useNavigate();

  return (
    <AppShell wide>
      <ScreenHeader
        screen="more"
        title="Mer"
        subtitle="Stöd och konto."
        topLeft={
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
            className="inline-flex items-center gap-1 text-sm font-bold text-foreground/80 press-soft"
          >
            <ChevronLeft size={18} /> Tillbaka
          </button>
        }
      />


      {/* Krisplan — stort, lugnt rött hjältekort. Enda ikon-bilden på sidan. */}
      <section className="mb-8">
        <button
          onClick={() => navigate("/krisplan")}
          className="relative overflow-hidden w-full bg-red-bg border-2 border-red-risk/30 card-hero press-soft animate-pop-in"
        >
          <span aria-hidden className="pointer-events-none absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-red-risk/10" />
          <div className="relative z-[1] flex items-end justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-red-risk mb-2">När det blir svårt</p>
              <h2 className="text-2xl leading-[28px] font-extrabold mb-2">Min krisplan</h2>
              <p className="text-sm text-foreground/70">Förbered i lugnt läge — använd när det behövs.</p>
            </div>
            <ChevronRight size={22} className="shrink-0 text-red-risk" />
          </div>
        </button>
      </section>

      <section className="mb-8 space-y-4">
        <Row
          label="Inställningar"
          sub="Konto, påminnelser, plats och data"
          onClick={() => navigate("/installningar")}
        />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-extrabold mb-3">Om Riktning</h2>
        <div className="card-quiet mb-3">
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
  label, sub, onClick,
}: {
  label: string; sub: string; onClick: () => void;
}) => (
  <button onClick={onClick} className="w-full card-soft px-5 py-5 flex items-center gap-3 text-left press-soft">
    <div className="flex-1 min-w-0">
      <p className="text-[16px] font-extrabold leading-tight">{label}</p>
      <p className="text-xs text-text-secondary mt-0.5">{sub}</p>
    </div>
    <ChevronRight size={18} className="text-text-secondary shrink-0" />
  </button>
);

export default More;
