import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type CheckState =
  | { status: "pending"; label: string }
  | { status: "ok"; label: string; detail?: string }
  | { status: "fail"; label: string; detail: string };

const Dot = ({ state }: { state: CheckState["status"] }) => (
  <span
    className={`inline-block h-2.5 w-2.5 rounded-full ${
      state === "ok"
        ? "bg-emerald-500"
        : state === "fail"
          ? "bg-red-500"
          : "bg-muted-foreground/40 animate-pulse"
    }`}
    aria-hidden
  />
);

/**
 * Auth health check — bekräftar att användaren är inloggad och att
 * Today-datakällorna (daily_checkins) går att hämta utan att krascha.
 * Visar varje steg i klartext så vi snabbt kan se var det skär sig.
 */
const Health = () => {
  const { user, session, loading } = useAuth();
  const [checks, setChecks] = useState<{
    sessionCheck: CheckState;
    fetchCheck: CheckState;
  }>({
    sessionCheck: { status: "pending", label: "Kontrollerar session…" },
    fetchCheck: { status: "pending", label: "Testhämtar Today-data…" },
  });
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (loading) return;

    // 1) Sessionscheck
    if (!session || !user) {
      setChecks((c) => ({
        ...c,
        sessionCheck: {
          status: "fail",
          label: "Ingen aktiv session",
          detail: "Du är inte inloggad. Gå till /auth och logga in för att köra hälsokollen.",
        },
        fetchCheck: { status: "pending", label: "Väntar på inloggning…" },
      }));
      return;
    }

    setChecks((c) => ({
      ...c,
      sessionCheck: {
        status: "ok",
        label: "Session aktiv",
        detail: `${user.email ?? user.id} · token giltig till ${
          session.expires_at ? new Date(session.expires_at * 1000).toLocaleTimeString("sv-SE") : "okänt"
        }`,
      },
      fetchCheck: { status: "pending", label: "Testhämtar Today-data…" },
    }));

    // 2) Datakälla — samma fråga Today använder, begränsad till dagens rad
    const today = new Date().toISOString().split("T")[0];
    let cancelled = false;
    (async () => {
      const { data, error, status } = await supabase
        .from("daily_checkins")
        .select("id,date,mood_heaviness,sleep_hours")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setChecks((c) => ({
          ...c,
          fetchCheck: {
            status: "fail",
            label: `Hämtning misslyckades (HTTP ${status})`,
            detail: `${error.code ?? "okänd kod"}: ${error.message}`,
          },
        }));
        return;
      }
      setChecks((c) => ({
        ...c,
        fetchCheck: {
          status: "ok",
          label: data ? "Today-data hämtad" : "Inga rader för idag (men anropet gick igenom)",
          detail: data
            ? `Hittade checkin för ${data.date} (sömn ${data.sleep_hours ?? "—"} h)`
            : "Tomt resultat är okej — RLS svarade utan fel.",
        },
      }));
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, session, user, runId]);

  const allOk =
    checks.sessionCheck.status === "ok" && checks.fetchCheck.status === "ok";
  const anyFail =
    checks.sessionCheck.status === "fail" || checks.fetchCheck.status === "fail";

  return (
    <AppShell>
      <div className="space-y-6 pb-10">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-bold">Diagnostik</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Auth health check</h1>
          <p className="text-sm text-muted-foreground">
            Verifierar att du är inloggad och att appen kan hämta din data utan att krascha.
          </p>
        </header>

        <section
          className={`rounded-2xl border p-4 ${
            anyFail
              ? "border-red-500/30 bg-red-500/5"
              : allOk
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-border bg-card"
          }`}
          aria-live="polite"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-extrabold">
              {loading
                ? "Initierar…"
                : anyFail
                  ? "Något fungerar inte"
                  : allOk
                    ? "Allt funkar"
                    : "Kör kontroller…"}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRunId((n) => n + 1)}
              disabled={loading}
              className="rounded-full text-xs"
            >
              Kör om
            </Button>
          </div>
        </section>

        <ul className="space-y-4">
          {[checks.sessionCheck, checks.fetchCheck].map((c, i) => (
            <li
              key={i}
              className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3"
            >
              <div className="pt-1.5">
                <Dot state={c.status} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold">{c.label}</div>
                {"detail" in c && c.detail ? (
                  <div
                    className={`text-xs mt-1 ${
                      c.status === "fail" ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                    }`}
                  >
                    {c.detail}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        {!session && !loading && (
          <Button asChild className="w-full rounded-full h-11 font-extrabold">
            <Link to="/auth">Gå till inloggning</Link>
          </Button>
        )}

        <details className="rounded-2xl border border-border bg-muted/30 p-4 text-xs">
          <summary className="cursor-pointer font-extrabold text-sm">Teknisk info</summary>
          <pre className="mt-3 whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed">
{JSON.stringify(
  {
    loading,
    hasSession: !!session,
    userId: user?.id ?? null,
    email: user?.email ?? null,
    expiresAt: session?.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : null,
  },
  null,
  2,
)}
          </pre>
        </details>
      </div>
    </AppShell>
  );
};

export default Health;
