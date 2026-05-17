import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { HeroBanner } from "@/components/HeroBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AbstractIcon } from "@/components/AbstractIcon";
import { WideLayout } from "@/components/desktop/WideLayout";
import { ContextPanel } from "@/components/desktop/ContextPanel";
import { ChevronLeft, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { detectRisks, type RiskSignal } from "@/lib/riskSignals";
import { RiskSignalsCard } from "@/components/RiskSignalsCard";
import type { Checkin as MetricsCheckin } from "@/lib/metrics";

type Contact = { name: string; phone: string; role?: string };

type Plan = {
  id?: string;
  warning_signs_json: string[];
  helps_json: string[];
  avoid_json: string[];
  contacts_json: Contact[];
  professional_contacts_json: Contact[];
  safe_places_json: string[];
  reasons_json: string[];
};

const empty: Plan = {
  warning_signs_json: ["", "", ""],
  helps_json: ["", "", ""],
  avoid_json: ["", "", ""],
  contacts_json: [
    { name: "", phone: "", role: "" },
    { name: "", phone: "", role: "" },
    { name: "", phone: "", role: "" },
  ],
  professional_contacts_json: [
    { name: "", phone: "", role: "" },
    { name: "", phone: "", role: "" },
  ],
  safe_places_json: ["", "", ""],
  reasons_json: ["", "", ""],
};

const placeholders = {
  warning: ["t.ex. Sömnen försämras flera nätter i rad", "t.ex. Jag drar mig undan vänner", "t.ex. Tankarna går i loop"],
  helps: ["t.ex. Ringa min syster", "t.ex. Långsam promenad i dagsljus", "t.ex. Skriva tre rader"],
  avoid: ["t.ex. Alkohol när jag mår dåligt", "t.ex. Doomscrolling sent på kvällen", "t.ex. Gå hela dagen utan mat"],
  places: ["t.ex. Mammas kök", "t.ex. Skogen vid huset", "t.ex. Lokala caféet"],
  reasons: ["t.ex. Min hund Nova", "t.ex. Resan till Italien i höst", "t.ex. Att se min systers bröllop"],
};

const SOS = [
  { name: "112", phone: "112", role: "Vid akut fara" },
  { name: "1177 Vårdguiden", phone: "1177", role: "Sjukvårdsrådgivning, dygnet runt" },
  { name: "Mind Självmordslinjen", phone: "90101", role: "Anonymt, kostnadsfritt" },
  { name: "Jourhavande medmänniska", phone: "08-702 16 80", role: "Kvällar och nätter" },
];

type LiveStatus = {
  /** Antal dagar sedan senaste check-in (null = aldrig). */
  daysSinceCheckin: number | null;
  /** Aktuell tyngd 0–10 från dagens checkin, om gjord. */
  moodHeaviness: number | null;
  /** Antal aktivitetsloggar de senaste 24h. */
  recentActivities: number;
  /** safety_status från senaste checkinen. */
  safety: string | null;
};

const CrisisPlan = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan>(empty);
  const [exists, setExists] = useState(false);
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [saving, setSaving] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [live, setLive] = useState<LiveStatus | null>(null);
  const [riskSignals, setRiskSignals] = useState<RiskSignal[]>([]);

  // Risksignaler — visas högst upp på krisplanen så de mest akuta varningarna
  // är direkt synliga när användaren öppnar planen.
  useEffect(() => {
    if (!user) return;
    const since14 = new Date(Date.now() - 14 * 86_400_000).toISOString().split("T")[0];
    (async () => {
      const [ci, ml] = await Promise.all([
        supabase.from("daily_checkins").select("*").eq("user_id", user.id).gte("date", since14).order("date"),
        supabase.from("medication_logs").select("date,taken_status,severity,side_effects_json").eq("user_id", user.id).gte("date", since14).order("date"),
      ]);
      const checks = (ci.data ?? []) as unknown as MetricsCheckin[];
      const logs = (ml.data ?? []) as Array<{ date: string; taken_status: string; severity: number | null; side_effects_json: unknown }>;
      setRiskSignals(detectRisks({ checkins: checks, medLogs: logs }));
    })();
  }, [user]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("crisis_plans")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPlan({
            id: data.id,
            warning_signs_json: ((data.warning_signs_json as string[]) ?? []).concat(["", "", ""]).slice(0, 3),
            helps_json: ((data.helps_json as string[]) ?? []).concat(["", "", ""]).slice(0, 3),
            avoid_json: ((data.avoid_json as string[]) ?? []).concat(["", "", ""]).slice(0, 3),
            contacts_json: ((data.contacts_json as Contact[]) ?? []).concat([{ name: "", phone: "" }, { name: "", phone: "" }, { name: "", phone: "" }]).slice(0, 3),
            professional_contacts_json: ((data.professional_contacts_json as Contact[]) ?? []).concat([{ name: "", phone: "" }, { name: "", phone: "" }]).slice(0, 2),
            safe_places_json: ((data.safe_places_json as string[]) ?? []).concat(["", "", ""]).slice(0, 3),
            reasons_json: ((data.reasons_json as string[]) ?? []).concat(["", "", ""]).slice(0, 3),
          });
          setExists(true);
          setMode("read");
        } else {
          setMode("edit");
        }
        setFetched(true);
      });
  }, [user]);

  // Live-status till desktop-kontextpanelen: hämtas separat så krisplan-fetch
  // stannar snabb. Allt är read-only och under RLS — användarens egna rader.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const since24h = new Date(Date.now() - 86_400_000).toISOString();
      const [checkinRes, actsRes] = await Promise.all([
        supabase
          .from("daily_checkins")
          .select("date,mood_heaviness,safety_status")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(1),
        supabase
          .from("activity_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", since24h),
      ]);
      if (cancelled) return;
      const last = checkinRes.data?.[0];
      const days = last
        ? Math.floor((Date.now() - new Date(last.date).getTime()) / 86_400_000)
        : null;
      setLive({
        daysSinceCheckin: days,
        moodHeaviness: last?.mood_heaviness ?? null,
        recentActivities: actsRes.count ?? 0,
        safety: last?.safety_status ?? null,
      });
    })();
    return () => { cancelled = true; };
  }, [user]);


  const save = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      warning_signs_json: plan.warning_signs_json.filter(s => s.trim()),
      helps_json: plan.helps_json.filter(s => s.trim()),
      avoid_json: plan.avoid_json.filter(s => s.trim()),
      contacts_json: plan.contacts_json.filter(c => c.name.trim() || c.phone.trim()),
      professional_contacts_json: plan.professional_contacts_json.filter(c => c.name.trim() || c.phone.trim()),
      safe_places_json: plan.safe_places_json.filter(s => s.trim()),
      reasons_json: plan.reasons_json.filter(s => s.trim()),
    };
    const { error } = await supabase
      .from("crisis_plans")
      .upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast.error("Kunde inte spara");
      return;
    }
    toast.success("Krisplan sparad");
    setExists(true);
    setMode("read");
  };

  if (loading || !fetched) {
    return (
      <AppShell>
        <div className="h-40 rounded-3xl bg-surface-alt animate-pulse" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <HeroBanner
        tone="var(--orange-start)"
        icon="shield-soft"
        iconColor="hsl(var(--surface))"
      />
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm font-bold text-text-secondary mb-4 press-soft"
      >
        <ChevronLeft size={18} /> Tillbaka
      </button>
      <header className="mb-5 flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-[32px] leading-[38px] mb-1">Min krisplan</h1>
          <p className="text-sm text-text-secondary">
            {mode === "read"
              ? "När det blir tungt — så här navigerar du."
              : "Skriv det du vill ha till hands. Du kan ändra när du vill."}
          </p>
        </div>
        {exists && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMode(m => (m === "read" ? "edit" : "read"))}
            className="rounded-full font-extrabold shrink-0"
          >
            {mode === "read" ? <><Pencil size={14} /> Ändra</> : <><Check size={14} /> Klar</>}
          </Button>
        )}
      </header>

      <WideLayout
        split="aside"
        left={
          <>
            <RiskSignalsCard signals={riskSignals} showCrisisLink={false} title="Signaler vi sett senaste 14 dagarna" />

            {/* Akutknappar — på mobil överst i flödet, på desktop i höger kontextpanel. */}
            <section className="mb-7 lg:hidden">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-text-secondary mb-3">
                Akut
              </h2>
              <div className="space-y-2">
                {SOS.map((s, i) => (
                  <SosRow key={s.phone} sos={s} stagger={i} />
                ))}
              </div>
              <p className="text-[11px] text-text-secondary mt-2 px-1">
                Kontrollera då och då att telefonnummer och kontakter stämmer.
              </p>
            </section>

            {mode === "read" ? (
              <ReadView plan={plan} />
            ) : (
              <EditView plan={plan} setPlan={setPlan} />
            )}

            {mode === "edit" && (
              <div className="sticky bottom-24 -mx-2 mt-6">
                <Button
                  onClick={save}
                  disabled={saving}
                  className="w-full h-14 rounded-full bg-foreground hover:bg-foreground/90 text-background font-extrabold text-[17px] shadow-soft press-soft"
                >
                  {saving ? "Sparar..." : exists ? "Spara ändringar" : "Spara min krisplan"}
                </Button>
              </div>
            )}
          </>
        }
        right={
          <ContextPanel
            title="Akut — alltid en knapptryckning bort"
            footnote="Stannar uppe längs hela sidan — håll fokus på planen."
          >
            <div className="space-y-2">
              {SOS.map((s) => (
                <SosRow key={s.phone} sos={s} />
              ))}
            </div>

            {live && <LiveStatusPanel live={live} />}
          </ContextPanel>
        }
      />
    </AppShell>
  );
};

const SosRow = ({ sos, stagger }: { sos: typeof SOS[number]; stagger?: number }) => (
  <a
    href={`tel:${sos.phone.replace(/\s/g, "")}`}
    className={`flex items-center gap-3 rounded-3xl bg-red-bg border-2 border-red-risk/20 p-4 press-soft ${stagger !== undefined ? "animate-fade-in-up" : ""}`}
    style={stagger !== undefined ? { animationDelay: `var(--stagger-${Math.min(stagger, 4)})` } : undefined}
  >
    <div className="w-11 h-11 rounded-2xl bg-red-risk text-white grid place-items-center shrink-0">
      <AbstractIcon name="phone-soft" size={18} color="hsl(var(--surface))" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-extrabold truncate">{sos.name}</p>
      <p className="text-xs text-text-secondary truncate">{sos.role}</p>
    </div>
    <span className="text-sm font-extrabold text-red-risk shrink-0">{sos.phone}</span>
  </a>
);

const ReadView = ({ plan }: { plan: Plan }) => {
  const sections: { title: string; items: string[]; color: string; icon: "warning-soft" | "heart-care" | "moon-soft" | "house-soft" | "blob-smile" }[] = [
    { title: "Tidiga varningstecken", items: plan.warning_signs_json.filter(Boolean), color: "yellow", icon: "warning-soft" },
    { title: "Det här hjälper mig", items: plan.helps_json.filter(Boolean), color: "green", icon: "heart-care" },
    { title: "Det här ska jag undvika", items: plan.avoid_json.filter(Boolean), color: "blue", icon: "moon-soft" },
    { title: "Trygga platser", items: plan.safe_places_json.filter(Boolean), color: "pink", icon: "house-soft" },
    { title: "Skäl att hålla ut", items: plan.reasons_json.filter(Boolean), color: "orange", icon: "blob-smile" },
  ];
  const colorAccent = (c: string): string => {
    switch (c) {
      case "orange": return "hsl(var(--orange-start))";
      case "blue": return "hsl(var(--blue-calm))";
      case "yellow": return "hsl(var(--yellow-journal))";
      case "purple": return "hsl(var(--purple-sleep))";
      case "pink": return "hsl(var(--pink-move))";
      case "green": return "hsl(var(--green-recovery))";
      default: return "hsl(var(--orange-start))";
    }
  };
  const allContacts = [...plan.contacts_json, ...plan.professional_contacts_json].filter(c => c.name.trim() || c.phone.trim());

  return (
    <>
      {allContacts.length > 0 && (
        <section className="mb-7">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-text-secondary mb-3">
            Mina personer
          </h2>
          <div className="space-y-2">
            {allContacts.map((c, i) => (
              <a
                key={i}
                href={c.phone.trim() ? `tel:${c.phone.replace(/\s/g, "")}` : undefined}
                className="flex items-center gap-3 card-cream p-4 press-soft animate-fade-in-up"
                style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
              >
                <div className="w-10 h-10 rounded-2xl bg-orange-start/15 grid place-items-center shrink-0">
                  <AbstractIcon name="phone-soft" size={16} color="hsl(var(--orange-deep))" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold truncate">{c.name || "—"}</p>
                  {c.role && <p className="text-xs text-text-secondary truncate">{c.role}</p>}
                </div>
                {c.phone && <span className="text-xs font-extrabold text-text-secondary shrink-0">{c.phone}</span>}
              </a>
            ))}
          </div>
        </section>
      )}

      {sections.map(s =>
        s.items.length > 0 ? (
          <section key={s.title} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AbstractIcon name={s.icon} size={20} color={colorAccent(s.color)} />
              <h2 className="text-base font-extrabold">{s.title}</h2>
            </div>
            <ul className="space-y-2">
              {s.items.map((it, i) => (
                <li key={i} className="card-cream p-4 text-sm font-semibold leading-snug animate-fade-in-up"
                    style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}>
                  {it}
                </li>
              ))}
            </ul>
          </section>
        ) : null
      )}
    </>
  );
};

const EditView = ({ plan, setPlan }: { plan: Plan; setPlan: (p: Plan) => void }) => {
  const updArr = (key: keyof Plan, idx: number, value: string) => {
    const arr = [...(plan[key] as string[])];
    arr[idx] = value;
    setPlan({ ...plan, [key]: arr });
  };
  const updContact = (key: "contacts_json" | "professional_contacts_json", idx: number, field: keyof Contact, value: string) => {
    const arr = [...(plan[key] as Contact[])];
    arr[idx] = { ...arr[idx], [field]: value };
    setPlan({ ...plan, [key]: arr });
  };

  return (
    <>
      <FieldGroup
        title="Tidiga varningstecken"
        hint="Vad märker du tidigt när det börjar bli tungt?"
        values={plan.warning_signs_json}
        placeholders={placeholders.warning}
        onChange={(i, v) => updArr("warning_signs_json", i, v)}
      />
      <FieldGroup
        title="Det här hjälper mig"
        hint="Vad har faktiskt hjälpt förut?"
        values={plan.helps_json}
        placeholders={placeholders.helps}
        onChange={(i, v) => updArr("helps_json", i, v)}
      />
      <FieldGroup
        title="Det här ska jag undvika"
        hint="Saker som gör det värre."
        values={plan.avoid_json}
        placeholders={placeholders.avoid}
        onChange={(i, v) => updArr("avoid_json", i, v)}
      />

      <ContactGroup
        title="Personer jag kan ringa"
        hint="Tre människor som vet och bryr sig."
        contacts={plan.contacts_json}
        onChange={(i, f, v) => updContact("contacts_json", i, f, v)}
      />
      <ContactGroup
        title="Professionella kontakter"
        hint="Vårdcentral, mottagning, terapeut."
        contacts={plan.professional_contacts_json}
        onChange={(i, f, v) => updContact("professional_contacts_json", i, f, v)}
      />

      <FieldGroup
        title="Trygga platser"
        hint="Var känns det bra att vara?"
        values={plan.safe_places_json}
        placeholders={placeholders.places}
        onChange={(i, v) => updArr("safe_places_json", i, v)}
      />
      <FieldGroup
        title="Skäl att hålla ut"
        hint="Det varma. Människor, planer, små glädjeämnen."
        values={plan.reasons_json}
        placeholders={placeholders.reasons}
        onChange={(i, v) => updArr("reasons_json", i, v)}
      />
    </>
  );
};

const FieldGroup = ({ title, hint, values, placeholders, onChange }: {
  title: string;
  hint: string;
  values: string[];
  placeholders: string[];
  onChange: (i: number, v: string) => void;
}) => (
  <section className="mb-6">
    <h2 className="text-base font-extrabold mb-1">{title}</h2>
    <p className="text-xs text-text-secondary mb-3">{hint}</p>
    <div className="space-y-2">
      {values.map((v, i) => (
        <Textarea
          key={i}
          value={v}
          onChange={e => onChange(i, e.target.value)}
          placeholder={placeholders[i] ?? ""}
          className="rounded-2xl border-border-soft bg-surface min-h-[52px] text-sm"
        />
      ))}
    </div>
  </section>
);

const ContactGroup = ({ title, hint, contacts, onChange }: {
  title: string;
  hint: string;
  contacts: Contact[];
  onChange: (i: number, field: keyof Contact, value: string) => void;
}) => (
  <section className="mb-6">
    <h2 className="text-base font-extrabold mb-1">{title}</h2>
    <p className="text-xs text-text-secondary mb-3">{hint}</p>
    <div className="space-y-3">
      {contacts.map((c, i) => (
        <div key={i} className="card-cream p-3 space-y-2">
          <Input
            value={c.name}
            onChange={e => onChange(i, "name", e.target.value)}
            placeholder="Namn"
            className="h-10 rounded-2xl bg-surface text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={c.phone}
              onChange={e => onChange(i, "phone", e.target.value)}
              placeholder="Telefon"
              type="tel"
              className="h-10 rounded-2xl bg-surface text-sm"
            />
            <Input
              value={c.role ?? ""}
              onChange={e => onChange(i, "role", e.target.value)}
              placeholder="Relation (valfritt)"
              className="h-10 rounded-2xl bg-surface text-sm"
            />
          </div>
        </div>
      ))}
    </div>
  </section>
);

/**
 * LiveStatusPanel — desktop-only sammanfattning under SOS-knapparna.
 * Visar "läget just nu" så användaren ser sig själv i siffror utan att
 * lämna planen. Plockar bara från redan-hämtad `LiveStatus`-state.
 */
const LiveStatusPanel = ({ live }: { live: LiveStatus }) => {
  const moodTone =
    live.moodHeaviness == null ? "neutral"
    : live.moodHeaviness >= 7 ? "high"
    : live.moodHeaviness >= 4 ? "mid"
    : "low";
  const moodClass =
    moodTone === "high" ? "text-red-risk"
    : moodTone === "mid" ? "text-orange-deep"
    : moodTone === "low" ? "text-green-recovery"
    : "text-text-secondary";
  const checkinLabel =
    live.daysSinceCheckin == null ? "Aldrig"
    : live.daysSinceCheckin === 0 ? "Idag"
    : live.daysSinceCheckin === 1 ? "Igår"
    : `${live.daysSinceCheckin}d sedan`;
  const safetyClass =
    live.safety === "in_danger" ? "text-red-risk"
    : live.safety === "worried" ? "text-orange-deep"
    : "text-green-recovery";
  const safetyLabel =
    live.safety === "in_danger" ? "I fara"
    : live.safety === "worried" ? "Orolig"
    : live.safety === "ok" ? "Trygg"
    : null;

  return (
    <section className="card-cream p-4">
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary mb-3">
        Läget just nu
      </h3>
      <dl className="space-y-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-xs font-bold text-text-secondary">Senaste check-in</dt>
          <dd className="text-sm font-extrabold tabular-nums">{checkinLabel}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-xs font-bold text-text-secondary">Tyngd idag</dt>
          <dd className={`text-sm font-extrabold tabular-nums ${moodClass}`}>
            {live.moodHeaviness == null ? "—" : `${live.moodHeaviness}/10`}
          </dd>
        </div>
        {safetyLabel && (
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-xs font-bold text-text-secondary">Säkerhet</dt>
            <dd className={`text-sm font-extrabold ${safetyClass}`}>{safetyLabel}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-xs font-bold text-text-secondary">Loggar 24h</dt>
          <dd className="text-sm font-extrabold tabular-nums">{live.recentActivities}</dd>
        </div>
      </dl>
      <p className="mt-3 text-[11px] text-text-secondary leading-snug">
        Levande data från dina egna loggar — hjälper dig se varningstecknen tidigt.
      </p>
    </section>
  );
};

export default CrisisPlan;

