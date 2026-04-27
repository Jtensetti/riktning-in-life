import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AbstractIcon } from "@/components/AbstractIcon";

/**
 * DesktopTopbar — slim 64px header used only on ≥lg.
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ Riktning   │   Måndag 27 april · v.18   │  [Gör check-in]   │
 *   │            │                             │  email · Logga ut │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * Datum/veckonr ger desktopanvändaren en lugn "var i veckan jag är"-känsla
 * utan att skrika om streaks. Check-in-pillen visas bara om dagens check-in
 * saknas — samma signal som mobilens FAB använder för att kontextualisera.
 *
 * Sticky, transparent backdrop, dyker aldrig upp på mobil.
 */

const WEEKDAYS = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];
const MONTHS = ["januari", "februari", "mars", "april", "maj", "juni",
                "juli", "augusti", "september", "oktober", "november", "december"];

/** ISO 8601 veckonr. */
const isoWeek = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const formatToday = (now: Date): string => {
  const wd = WEEKDAYS[now.getDay()];
  const day = now.getDate();
  const month = MONTHS[now.getMonth()];
  return `${wd} ${day} ${month} · v.${isoWeek(now)}`;
};

export const DesktopTopbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [needsCheckin, setNeedsCheckin] = useState(false);
  const [today, setToday] = useState(() => formatToday(new Date()));

  // Uppdatera datumetikett vid midnatt utan att gissa på timer-precision —
  // re-evaluera på 'visibilitychange' (vanligaste återbesöket) + var 5:e minut.
  useEffect(() => {
    const tick = () => setToday(formatToday(new Date()));
    document.addEventListener("visibilitychange", tick);
    const id = window.setInterval(tick, 5 * 60_000);
    return () => {
      document.removeEventListener("visibilitychange", tick);
      window.clearInterval(id);
    };
  }, []);

  // Kolla om dagens check-in saknas. Cachas i sessionStorage av Today-flödet
  // när den genomförts, så vi slipper en DB-roundtrip i 99 % av fallen.
  useEffect(() => {
    if (!user) {
      setNeedsCheckin(false);
      return;
    }
    const todayISO = new Date().toISOString().split("T")[0];
    const cached = sessionStorage.getItem("riktning:lastCheckinDate");
    if (cached === todayISO) {
      setNeedsCheckin(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from("daily_checkins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("date", todayISO);
      if (!cancelled) setNeedsCheckin((count ?? 0) === 0);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <header
      className="hidden lg:flex items-center justify-between px-8 sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border-soft"
      style={{ height: 64 }}
    >
      <div
        className="text-[20px] font-extrabold tracking-tight"
        style={{ color: "hsl(var(--foreground))" }}
      >
        Riktning
      </div>

      {/* Mitten: datum/vecka. Diskret men närvarande. */}
      <div className="flex-1 text-center">
        <span className="text-[14px] font-bold text-text-secondary">{today}</span>
      </div>

      <div className="flex items-center gap-3">
        {needsCheckin && (
          <button
            onClick={() => navigate("/checkin")}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-[14px] font-extrabold press-soft transition-transform active:scale-[0.98]"
            style={{
              background: "hsl(var(--orange-start))",
              color: "white",
              boxShadow: "0 4px 12px hsl(var(--orange-start) / 0.35)",
            }}
            aria-label="Gör dagens check-in"
          >
            <AbstractIcon name="blob-smile" size={18} color="white" inline />
            Gör check-in
          </button>
        )}
        {user?.email && (
          <span className="text-[14px] font-bold text-text-secondary truncate max-w-[220px]">
            {user.email}
          </span>
        )}
        <button
          onClick={signOut}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[14px] font-extrabold text-foreground/80 hover:bg-surface-alt press-soft"
          aria-label="Logga ut"
        >
          <LogOut size={15} strokeWidth={2.4} />
          Logga ut
        </button>
      </div>
    </header>
  );
};
