import { useEffect, useRef, useState } from "react";
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

/** Lokal YYYY-MM-DD (inte UTC — undviker att "idag" hoppar runt midnatt). */
const localISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** ms kvar till nästa lokala midnatt + 1s marginal. */
const msUntilMidnight = (now: Date): number => {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1, 0);
  return next.getTime() - now.getTime();
};

export const DesktopTopbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [needsCheckin, setNeedsCheckin] = useState(false);
  const [today, setToday] = useState(() => formatToday(new Date()));
  // Spåra senaste utvärderade datum så vi inte gör DB-anrop när bara fokus återgår
  // inom samma dygn. Sätts när vi (a) hämtat från DB eller (b) sett "done"-event.
  const lastEvaluatedDateRef = useRef<string | null>(null);

  // Datumetikett: schemalägg exakt timer till nästa midnatt (re-armas efter varje tick).
  // Plus visibilitychange/focus/pageshow så att en uppvakning från sleep/bfcache
  // direkt korrigerar etiketten om vi sov förbi midnatt.
  useEffect(() => {
    let timeoutId: number | undefined;
    const tick = () => {
      setToday(formatToday(new Date()));
      // re-arma till nästa midnatt
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(tick, msUntilMidnight(new Date()));
    };
    // initial timer
    timeoutId = window.setTimeout(tick, msUntilMidnight(new Date()));

    const onWake = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("pageshow", onWake);
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("pageshow", onWake);
    };
  }, []);

  // Check-in-status: utvärdera vid mount, vid datumbyte (efter midnatt-väckning),
  // och när en check-in just genomförts (custom event från checkin-flödet).
  //
  // Cross-device: sessionStorage är per-flik och kan inte veta om användaren
  // checkat in från telefonen. Därför är cachen *rådgivande* — den ger ett
  // snabbt initialvärde, men vi bekräftar alltid mot DB i bakgrunden vid mount
  // och vid uppvakning. När vi väl har bekräftat att check-in är gjord (count>0
  // i DB *under denna session*) markerar vi det med en confirmed-flagga och
  // slipper då vidare anrop tills datumet byter.
  useEffect(() => {
    if (!user) {
      setNeedsCheckin(false);
      lastEvaluatedDateRef.current = null;
      return;
    }

    let cancelled = false;
    // Datum då vi senast *bekräftade mot DB* att check-in är gjord. Bara då
    // kan vi tryggt hoppa över DB-anrop vid uppvakning.
    let confirmedDoneFor: string | null = null;

    const evaluate = async () => {
      const todayISO = localISODate(new Date());

      // Vi har redan bekräftat mot DB att dagens check-in är gjord — inget mer att göra.
      if (confirmedDoneFor === todayISO) return;

      // Snabb optimistisk UI-uppdatering från sessionStorage (rådgivande, inte sanning).
      const cached = sessionStorage.getItem("riktning:lastCheckinDate");
      if (cached === todayISO && !cancelled) setNeedsCheckin(false);

      // Sanningsanrop mot DB — fångar check-ins gjorda från en annan enhet.
      const { count, error } = await supabase
        .from("daily_checkins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("date", todayISO);
      if (cancelled || error) return;

      lastEvaluatedDateRef.current = todayISO;
      const missing = (count ?? 0) === 0;
      setNeedsCheckin(missing);

      if (missing) {
        // Cachen var en lögn — städa så vi inte snabbflashar bort pillen nästa gång.
        if (sessionStorage.getItem("riktning:lastCheckinDate") === todayISO) {
          sessionStorage.removeItem("riktning:lastCheckinDate");
        }
      } else {
        sessionStorage.setItem("riktning:lastCheckinDate", todayISO);
        confirmedDoneFor = todayISO;
      }
    };

    evaluate();

    // Re-utvärdera vid uppvaknande. Snabb path: om vi redan DB-bekräftat dagens
    // check-in i denna session är detta en no-op (ingen DB-anrop).
    const onWake = () => {
      if (document.visibilityState === "visible") evaluate();
    };
    // Direkt-signal från checkin-flödet på *samma* enhet — pillen försvinner
    // utan extra DB-anrop, och vi räknar det som DB-bekräftat.
    const onDone = () => {
      const todayISO = localISODate(new Date());
      sessionStorage.setItem("riktning:lastCheckinDate", todayISO);
      lastEvaluatedDateRef.current = todayISO;
      confirmedDoneFor = todayISO;
      setNeedsCheckin(false);
    };

    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("pageshow", onWake);
    window.addEventListener("riktning:checkin-done", onDone);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("pageshow", onWake);
      window.removeEventListener("riktning:checkin-done", onDone);
    };
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
