import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Illustration } from "@/components/Illustrations";
import { AbstractIcon } from "@/components/AbstractIcon";
import { HeroBanner } from "@/components/HeroBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Plus, Download, Trash2, FileDown, Mail } from "lucide-react";
import { toast } from "sonner";
import { FORMS, FormType, SIDE_EFFECTS } from "@/lib/forms";
import { burdenScore, functionScore, recoveryScore, stabilityScore, stabilityLabel, pctChange, splitWeeks, type Checkin, type WeeklyFormScore } from "@/lib/metrics";
import jsPDF from "jspdf";
import {
  PDF_COLORS,
  drawReportHeader,
  drawSectionHeader,
  drawScoreCards,
  drawSparklineRows,
  drawHBarChart,
  drawWeekDots,
  drawFooter,
  setPdfText,
  setPdfDraw,
  sevenDayLabels,
  sevenDayDates,
  seriesFor,
} from "@/lib/pdfWidgets";

type View = "home" | "form" | "meds" | "med_log" | "report";

type Med = { id: string; name: string; dose: string | null; date_started: string | null; date_stopped: string | null; active: boolean };
type WeeklyForm = { id: string; type: string; total_score: number; date: string; created_at: string };

const Vard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("home");
  const [activeForm, setActiveForm] = useState<FormType | null>(null);
  const [meds, setMeds] = useState<Med[]>([]);
  const [forms, setForms] = useState<WeeklyForm[]>([]);
  const [selectedMed, setSelectedMed] = useState<Med | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const load = async () => {
    if (!user) return;
    const [m, f] = await Promise.all([
      supabase.from("medications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("weekly_forms").select("id,type,total_score,date,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setMeds((m.data ?? []) as Med[]);
    setForms((f.data ?? []) as WeeklyForm[]);
  };

  useEffect(() => { load(); }, [user]);

  if (loading) return <AppShell><div className="h-40 bg-surface-alt rounded-3xl animate-pulse" /></AppShell>;

  if (view === "form" && activeForm) {
    return <FormRunner type={activeForm} onDone={() => { setView("home"); setActiveForm(null); load(); }} onBack={() => { setView("home"); setActiveForm(null); }} />;
  }
  if (view === "meds") {
    return <MedicationsView meds={meds} onBack={() => setView("home")} onChanged={load} onLogFor={(m) => { setSelectedMed(m); setView("med_log"); }} />;
  }
  if (view === "med_log" && selectedMed) {
    return <MedLogView med={selectedMed} onBack={() => { setView("meds"); setSelectedMed(null); }} />;
  }
  if (view === "report") {
    return <ReportView onBack={() => setView("home")} />;
  }

  const latest = (t: FormType) => forms.find(f => f.type === t);

  return (
    <AppShell>
      <HeroBanner
        tone="var(--blue-calm)"
        icon="stethoscope"
        iconColor="hsl(var(--surface))"
      />

      <header className="mb-6">
        <h1 className="text-[32px] leading-[38px] mb-1">Vård</h1>
        <p className="text-sm text-text-secondary">Skattningar, läkemedel och rapport till vården.</p>
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

      <section className="mb-7">
        <h2 className="text-lg font-extrabold mb-3">Veckoskattningar</h2>
        <div className="space-y-3">
          {(["phq9", "gad7", "who5"] as FormType[]).map((t, i) => {
            const f = FORMS[t];
            const last = latest(t);
            const final = last && f.toFinal ? f.toFinal(last.total_score) : last?.total_score;
            return (
              <button
                key={t}
                onClick={() => { setActiveForm(t); setView("form"); }}
                className="w-full card-soft p-4 flex items-center gap-3 text-left press-soft animate-fade-in-up"
                style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
              >
                <div className="w-11 h-11 rounded-2xl bg-blue-calm/10 grid place-items-center">
                  <AbstractIcon name="bookmark-soft" size={20} color="hsl(var(--blue-calm))" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-extrabold">{f.title}</div>
                  <div className="text-xs text-text-secondary">
                    {last
                      ? `Senast: ${final}${f.toFinal ? "/100" : `/${f.maxRaw}`} · ${f.scoreLabel(last.total_score)}`
                      : "Aldrig genomförd"}
                  </div>
                </div>
                <ChevronRight size={18} className="text-text-secondary" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-7">
        <h2 className="text-lg font-extrabold mb-3">Läkemedel</h2>
        <button
          onClick={() => setView("meds")}
          className="w-full card-soft p-4 flex items-center gap-3 text-left press-soft animate-fade-in-up"
        >
          <div className="w-11 h-11 rounded-2xl bg-pink-move/15 grid place-items-center">
            <AbstractIcon name="pill-bottle" size={22} color="hsl(var(--pink-move))" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-extrabold">Läkemedel & biverkningar</div>
            <div className="text-xs text-text-secondary">{meds.filter(m => m.active).length} aktiva · {meds.length} totalt</div>
          </div>
          <ChevronRight size={18} className="text-text-secondary" />
        </button>
      </section>

      <section className="mb-7">
        <h2 className="text-lg font-extrabold mb-3">Rapport</h2>
        <button
          onClick={() => setView("report")}
          className="w-full rounded-3xl bg-blue-calm text-white p-1 overflow-hidden shadow-soft text-left press-soft animate-pop-in"
        >
          <div className="rounded-[20px] overflow-hidden">
            <Illustration name="care" className="w-full h-auto" />
          </div>
          <div className="px-4 py-4 flex items-center gap-3">
            <AbstractIcon name="bookmark-soft" size={22} color="hsl(var(--surface))" />
            <div className="flex-1">
              <div className="text-[17px] font-extrabold">Exportera till vården</div>
              <div className="text-xs opacity-90">14, 30 eller 90 dagar · text/PDF</div>
            </div>
            <ChevronRight size={18} />
          </div>
        </button>
      </section>
    </AppShell>
  );
};

// ============ FORM RUNNER ============

const FormRunner = ({ type, onBack, onDone }: { type: FormType; onBack: () => void; onDone: () => void }) => {
  const { user } = useAuth();
  const def = FORMS[type];
  const [answers, setAnswers] = useState<number[]>(Array(def.questions.length).fill(-1));
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const current = answers[step];
  const isLast = step === def.questions.length - 1;
  const allAnswered = answers.every(a => a >= 0);
  const raw = answers.reduce((s, a) => s + Math.max(0, a), 0);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("weekly_forms").insert({
      user_id: user.id,
      type,
      answers_json: answers,
      total_score: raw,
    });
    setSaving(false);
    if (error) { toast.error("Kunde inte spara"); return; }
    toast.success(`${def.title} sparad`);
    onDone();
  };

  return (
    <AppShell>
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-text-secondary mb-4">
        <ChevronLeft size={18} /> Tillbaka
      </button>
      <header className="mb-5">
        <h1 className="text-[28px] leading-[34px] mb-1">{def.title}</h1>
        <p className="text-sm text-text-secondary">{def.intro}</p>
      </header>

      <div className="card-cream p-5 mb-5">
        <div className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-2">
          Fråga {step + 1} av {def.questions.length}
        </div>
        <p className="text-lg font-extrabold mb-4 leading-snug">{def.questions[step]}</p>
        <div className="space-y-2">
          {def.options.map(o => (
            <button
              key={o.value}
              onClick={() => setAnswers(a => a.map((v, i) => i === step ? o.value : v))}
              className={`w-full text-left rounded-2xl p-3.5 border-2 transition font-bold ${
                current === o.value
                  ? "border-blue-calm bg-blue-calm/10 text-foreground"
                  : "border-border-soft bg-surface text-foreground hover:border-blue-calm/40"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <Button
          variant="secondary"
          disabled={step === 0}
          onClick={() => setStep(s => Math.max(0, s - 1))}
          className="flex-1 h-12 rounded-full font-extrabold"
        >
          Tillbaka
        </Button>
        {isLast ? (
          <Button
            disabled={!allAnswered || saving}
            onClick={save}
            className="flex-1 h-12 rounded-full bg-foreground hover:bg-foreground/90 text-background font-extrabold"
          >
            {saving ? "Sparar…" : "Klar"}
          </Button>
        ) : (
          <Button
            disabled={current < 0}
            onClick={() => setStep(s => s + 1)}
            className="flex-1 h-12 rounded-full bg-foreground hover:bg-foreground/90 text-background font-extrabold"
          >
            Nästa
          </Button>
        )}
      </div>
      <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden">
        <div className="h-full bg-blue-calm transition-all" style={{ width: `${((step + 1) / def.questions.length) * 100}%` }} />
      </div>
    </AppShell>
  );
};

// ============ MEDICATIONS ============

const MedicationsView = ({ meds, onBack, onChanged, onLogFor }: { meds: Med[]; onBack: () => void; onChanged: () => void; onLogFor: (m: Med) => void }) => {
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [started, setStarted] = useState("");

  const add = async () => {
    if (!user || !name.trim()) return;
    const { error } = await supabase.from("medications").insert({
      user_id: user.id,
      name: name.trim(),
      dose: dose.trim() || null,
      date_started: started || null,
      active: true,
    });
    if (error) { toast.error("Kunde inte spara"); return; }
    toast.success("Tillagd");
    setName(""); setDose(""); setStarted(""); setAdding(false);
    onChanged();
  };

  const toggleActive = async (m: Med) => {
    await supabase.from("medications").update({ active: !m.active, date_stopped: !m.active ? null : new Date().toISOString().split("T")[0] }).eq("id", m.id);
    onChanged();
  };

  const remove = async (m: Med) => {
    await supabase.from("medications").delete().eq("id", m.id);
    onChanged();
  };

  return (
    <AppShell>
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-text-secondary mb-4">
        <ChevronLeft size={18} /> Tillbaka
      </button>
      <header className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-[28px] leading-[34px] mb-1">Läkemedel</h1>
          <p className="text-sm text-text-secondary">Registrera och logga dagligen.</p>
        </div>
        <Button onClick={() => setAdding(a => !a)} size="sm" className="rounded-full bg-foreground hover:bg-foreground/90 text-background font-extrabold">
          <Plus size={16} /> Nytt
        </Button>
      </header>

      {adding && (
        <div className="card-cream p-4 mb-5 space-y-3">
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-1.5 block">Namn</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="t.ex. Sertralin" className="h-11 rounded-2xl bg-surface" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-1.5 block">Dos</label>
              <Input value={dose} onChange={e => setDose(e.target.value)} placeholder="50 mg" className="h-11 rounded-2xl bg-surface" />
            </div>
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-1.5 block">Startat</label>
              <Input type="date" value={started} onChange={e => setStarted(e.target.value)} className="h-11 rounded-2xl bg-surface" />
            </div>
          </div>
          <Button onClick={add} disabled={!name.trim()} className="w-full h-11 rounded-full bg-foreground hover:bg-foreground/90 text-background font-extrabold">Spara</Button>
        </div>
      )}

      {meds.length === 0 ? (
        <div className="card-cream p-6 text-center">
          <div className="grid place-items-center mx-auto mb-2"><AbstractIcon name="pill" size={28} color="hsl(var(--text-secondary))" /></div>
          <p className="text-sm text-text-secondary">Inga läkemedel tillagda.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {meds.map(m => (
            <li key={m.id} className="card-soft p-4">
              <div className="flex items-start gap-3">
                <div className={`w-2 self-stretch rounded-full ${m.active ? "bg-green-recovery" : "bg-border-soft"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-[15px] font-extrabold truncate">{m.name}</span>
                    {m.dose && <span className="text-xs text-text-secondary">{m.dose}</span>}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {m.active ? `Aktiv${m.date_started ? ` sedan ${m.date_started}` : ""}` : `Avslutad${m.date_stopped ? ` ${m.date_stopped}` : ""}`}
                  </div>
                </div>
                <button onClick={() => remove(m)} className="p-2 text-text-secondary hover:text-red-risk" aria-label="Ta bort">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="secondary" size="sm" onClick={() => toggleActive(m)} className="rounded-full font-extrabold">
                  {m.active ? "Avsluta" : "Aktivera"}
                </Button>
                {m.active && (
                  <Button size="sm" onClick={() => onLogFor(m)} className="rounded-full bg-blue-calm hover:bg-blue-calm/90 text-white font-extrabold">
                    Logga idag
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
};

// ============ MED DAILY LOG ============

const MedLogView = ({ med, onBack }: { med: Med; onBack: () => void }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<"taken" | "missed" | "partial">("taken");
  const [effects, setEffects] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const toggle = (k: string) => setEffects(es => es.includes(k) ? es.filter(x => x !== k) : [...es, k]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const sideEffects = [...effects, ...(otherText.trim() ? [`other:${otherText.trim()}`] : [])];
    const { error } = await supabase.from("medication_logs").insert({
      user_id: user.id,
      medication_id: med.id,
      taken_status: status,
      side_effects_json: sideEffects,
      note: note.trim() || null,
    });
    setSaving(false);
    if (error) { toast.error("Kunde inte spara"); return; }
    toast.success("Loggad");
    onBack();
  };

  return (
    <AppShell>
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-text-secondary mb-4">
        <ChevronLeft size={18} /> Tillbaka
      </button>
      <header className="mb-5">
        <h1 className="text-[28px] leading-[34px] mb-1">{med.name}</h1>
        <p className="text-sm text-text-secondary">{med.dose ?? "—"} · Dagslogg</p>
      </header>

      <div className="card-cream p-4 mb-5">
        <label className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-2 block">Status</label>
        <div className="grid grid-cols-3 gap-2">
          {(["taken", "partial", "missed"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-2xl p-3 font-extrabold text-sm border-2 ${status === s ? "border-blue-calm bg-blue-calm/10" : "border-border-soft bg-surface"}`}
            >
              {s === "taken" ? "Tagit" : s === "partial" ? "Delvis" : "Missat"}
            </button>
          ))}
        </div>
      </div>

      <div className="card-cream p-4 mb-5">
        <label className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-2 block">Biverkningar</label>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {SIDE_EFFECTS.map(se => (
            <label key={se.key} className="flex items-center gap-2 rounded-2xl bg-surface p-2.5 cursor-pointer">
              <Checkbox checked={effects.includes(se.key)} onCheckedChange={() => toggle(se.key)} />
              <span className="text-sm font-semibold">{se.label}</span>
            </label>
          ))}
        </div>
        <Input value={otherText} onChange={e => setOtherText(e.target.value)} placeholder="Annat…" className="h-11 rounded-2xl bg-surface" />
      </div>

      <div className="mb-5">
        <label className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-1.5 block">Notering</label>
        <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Valfritt" className="min-h-[80px] rounded-2xl bg-surface" />
      </div>

      <Button disabled={saving} onClick={save} className="w-full h-12 rounded-full bg-foreground hover:bg-foreground/90 text-background font-extrabold">
        {saving ? "Sparar…" : "Spara logg"}
      </Button>
    </AppShell>
  );
};

// ============ REPORT EXPORT ============

const ReportView = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  const [days, setDays] = useState<14 | 30 | 90>(30);
  const [includeJournal, setIncludeJournal] = useState(false);
  const [markedJournalCount, setMarkedJournalCount] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [doctorEmail, setDoctorEmail] = useState<string>(() => localStorage.getItem("riktning_doctor_email") || "");

  useEffect(() => {
    if (!user) return;
    const since = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
    supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("include_in_report", true)
      .gte("date", since)
      .then(({ count }) => setMarkedJournalCount(count ?? 0));
  }, [user, days]);

  // Strukturerad data behövs för visuella PDF-widgets utöver textraderna.
  const [structured, setStructured] = useState<{
    checkins: Checkin[];
    activities: { date: string; label: string; category: string; duration_minutes: number | null; mood_delta: number | null }[];
    journals: { date: string; template_type: string; title: string | null; free_text: string | null }[];
    drivers: string[];
    direction: number | null;
    directionPrev: number | null;
    burden: number | null;
    fn: number | null;
    rec: number | null;
    stab: number | null;
    safetyCounts: { passive: number; active: number; acute: number };
    adherence: number | null;
    sideEffects: string[];
    movementDays: number;
    // Sammanfattningsblock (sömn / rörelse / journal / medicin)
    sleepHours: number | null;
    sleepHoursPrev: number | null;
    sleepQuality: number | null;
    lowSleepNights: number;
    movementYes: number;
    movementLittle: number;
    movementCombinedPrev: number;
    journalCount: number;
    journalDays: number;
    meaningfulYes: number;
    activeMeds: number;
    adherencePrev: number | null;
    totalActMinutes: number;
    periodDays: number;
  } | null>(null);

  const generate = async () => {
    if (!user) return;
    setGenerating(true);
    const since = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

    const [checkins, forms, meds, medLogs, journals, activities] = await Promise.all([
      supabase.from("daily_checkins").select("*").eq("user_id", user.id).gte("date", since).order("date"),
      supabase.from("weekly_forms").select("*").eq("user_id", user.id).gte("date", since).order("date"),
      supabase.from("medications").select("*").eq("user_id", user.id),
      supabase.from("medication_logs").select("*").eq("user_id", user.id).gte("date", since),
      includeJournal ? supabase.from("journal_entries").select("*").eq("user_id", user.id).eq("include_in_report", true).gte("date", since) : Promise.resolve({ data: [] as any[] }),
      supabase.from("activity_logs").select("date,label,category,duration_minutes,mood_delta").eq("user_id", user.id).gte("date", since).order("date"),
    ]);

    const c = checkins.data ?? [];
    const f = (forms.data ?? []) as any[];
    const m = (meds.data ?? []) as any[];
    const ml = (medLogs.data ?? []) as any[];
    const j = (journals.data ?? []) as any[];
    const acts = (activities.data ?? []) as any[];

    // Föregående period (för trender i sammanfattningsblocket).
    const prevSince = new Date(Date.now() - days * 2 * 86400000).toISOString().split("T")[0];
    const prevUntil = since;
    const [prevCheckins, prevMedLogs] = await Promise.all([
      supabase.from("daily_checkins").select("sleep_hours,movement_today").eq("user_id", user.id).gte("date", prevSince).lt("date", prevUntil),
      supabase.from("medication_logs").select("taken_status,date").eq("user_id", user.id).gte("date", prevSince).lt("date", prevUntil),
    ]);
    const cPrev = (prevCheckins.data ?? []) as any[];
    const mlPrev = (prevMedLogs.data ?? []) as any[];

    const avg = (arr: any[], k: string) => {
      const xs = arr.map(r => r[k]).filter((v): v is number => typeof v === "number");
      if (!xs.length) return null;
      return Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10;
    };
    const formStat = (t: string) => {
      const arr = f.filter(x => x.type === t);
      if (!arr.length) return "Ingen data";
      const scores = arr.map(x => Number(x.total_score));
      return `start ${scores[0]}, slut ${scores[scores.length - 1]}, snitt ${(scores.reduce((s, x) => s + x, 0) / scores.length).toFixed(1)}, högst ${Math.max(...scores)}, lägst ${Math.min(...scores)}`;
    };

    const safetyCounts = {
      passive: c.filter((x: any) => x.safety_status === "passive_thoughts").length,
      active: c.filter((x: any) => x.safety_status === "active_thoughts").length,
      acute: c.filter((x: any) => x.safety_status === "acute").length,
    };
    const movementDays = c.filter((x: any) => x.movement_today === "yes").length;
    const adherence = ml.length ? Math.round((ml.filter(x => x.taken_status === "taken").length / ml.length) * 100) : null;
    const sideEffects = Array.from(new Set(ml.flatMap(x => (Array.isArray(x.side_effects_json) ? x.side_effects_json : []))));

    // ---- Beräknade scores (0–100) ----
    const checkinsTyped = c as unknown as Checkin[];
    const { current: curWeek, previous: prevWeek } = splitWeeks(checkinsTyped);
    const latestPhq = [...f].reverse().find((x: any) => x.type === "phq9");
    const latestGad = [...f].reverse().find((x: any) => x.type === "gad7");
    const latestWho = [...f].reverse().find((x: any) => x.type === "who5");
    const weekly: WeeklyFormScore = {
      phq9: latestPhq ? Number(latestPhq.total_score) : undefined,
      gad7: latestGad ? Number(latestGad.total_score) : undefined,
      who5: latestWho ? Number(latestWho.total_score) : undefined,
    };
    const burdenCur = burdenScore(curWeek, weekly);
    const burdenPrev = burdenScore(prevWeek, weekly);
    const fnCur = functionScore(curWeek);
    const fnPrev = functionScore(prevWeek);
    const recCur = recoveryScore(curWeek);
    const recPrev = recoveryScore(prevWeek);
    const stabCur = stabilityScore(curWeek);
    const stabPrev = stabilityScore(prevWeek);
    const directionCur = burdenCur.value == null ? null : 100 - burdenCur.value;
    const directionPrev = burdenPrev.value == null ? null : 100 - burdenPrev.value;
    const fmtScore = (v: number | null) => v == null ? "—" : `${Math.round(v)}/100`;
    const fmtDelta = (cur: number | null, prev: number | null) => {
      if (cur == null || prev == null) return "";
      const d = Math.round(cur - prev);
      if (d === 0) return " (oförändrad)";
      return ` (${d > 0 ? "+" : ""}${d} vs föregående vecka)`;
    };

    // ---- Bidragande faktorer (drivare) ----
    const drivers = computeDrivers(checkinsTyped);

    const lines = [
      `RIKTNING – Klinisk rapport`,
      `Period: ${since} till ${new Date().toISOString().split("T")[0]} (${days} dagar)`,
      ``,
      `BERÄKNADE SCORES (senaste 7 dagar, 0–100)`,
      `Riktning (100 − belastning): ${fmtScore(directionCur)}${fmtDelta(directionCur, directionPrev)}`,
      `Belastning${burdenCur.withWeekly ? " (inkl. PHQ-9/GAD-7)" : " (utan veckoskattning)"}: ${fmtScore(burdenCur.value)}${fmtDelta(burdenCur.value, burdenPrev.value)}`,
      `Funktion: ${fmtScore(fnCur)}${fmtDelta(fnCur, fnPrev)}`,
      `Återhämtning: ${fmtScore(recCur)}${fmtDelta(recCur, recPrev)}`,
      `Stabilitet: ${fmtScore(stabCur)} · ${stabilityLabel(stabCur, stabPrev)}`,
      ``,
      `VIKTIGASTE BIDRAGANDE FAKTORER`,
      ...(drivers.length ? drivers.map(d => `- ${d}`) : ["För lite data för att rangordna drivare."]),
      ``,
      `SKATTNINGAR`,
      `PHQ-9: ${formStat("phq9")}`,
      `GAD-7: ${formStat("gad7")}`,
      `WHO-5: ${formStat("who5")}`,
      ``,
      `DAGLIGA MEDELVÄRDEN`,
      `Tyngd: ${avg(c, "mood_heaviness") ?? "—"}/10`,
      `Oro: ${avg(c, "anxiety") ?? "—"}/10`,
      `Hopplöshet: ${avg(c, "hopelessness") ?? "—"}/10`,
      `Energi: ${avg(c, "energy") ?? "—"}/10`,
      `Funktion: ${avg(c, "function_score") ?? "—"}/10`,
      `Sömn: ${avg(c, "sleep_hours") ?? "—"} h, kvalitet ${avg(c, "sleep_quality") ?? "—"}/10`,
      `Säng/sofftid dagtid: ${avg(c, "daytime_bed_sofa_time_minutes") ?? "—"} min`,
      ``,
      `AKTIVITET`,
      `Rörelse-dagar (självskattat): ${movementDays}/${c.length}`,
      `Loggade aktiviteter: ${acts.length} st över ${new Set(acts.map(a => a.date)).size} dagar`,
      `Total tid: ${acts.reduce((s, a) => s + (a.duration_minutes ?? 0), 0)} min`,
      `Snitt humörförändring efter aktivitet: ${acts.length ? ((acts.reduce((s, a) => s + Number(a.mood_delta ?? 0), 0) / acts.length).toFixed(1)) : "—"} (-2 till +2)`,
      ...activitySummary(acts),
      `Journal-anteckningar: ${j.length}`,
      ``,
      `LÄKEMEDEL`,
      ...(m.length ? m.map((x: any) => `- ${x.name}${x.dose ? ` ${x.dose}` : ""} · ${x.active ? "aktiv" : "avslutad"}${x.date_started ? ` (start ${x.date_started})` : ""}`) : ["Inga registrerade"]),
      `Följsamhet: ${adherence !== null ? adherence + " %" : "ej loggat"}`,
      `Rapporterade biverkningar: ${sideEffects.length ? sideEffects.join(", ") : "inga"}`,
      ``,
      `SÄKERHETSSIGNALER`,
      `Passiva dödstankar: ${safetyCounts.passive} dagar`,
      `Aktiva tankar: ${safetyCounts.active} dagar`,
      `Akuta signaler: ${safetyCounts.acute} dagar`,
      ``,
      `SAMMANFATTNING`,
      summarize(c, f, safetyCounts),
    ];

    if (includeJournal && j.length) {
      lines.push("", "JOURNAL (utvalda)");
      j.slice(0, 10).forEach((e: any) => {
        lines.push(`- ${e.date} · ${e.template_type}${e.title ? ` · ${e.title}` : ""}`);
        if (e.free_text) lines.push(`  ${e.free_text.slice(0, 200)}`);
      });
    }

    // Sammanfattningssiffror för PDF-block.
    const avgNum = (arr: any[], k: string): number | null => {
      const xs = arr.map((r) => r[k]).filter((v): v is number => typeof v === "number");
      return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
    };
    const sleepHours = avgNum(c, "sleep_hours");
    const sleepHoursPrev = avgNum(cPrev, "sleep_hours");
    const sleepQuality = avgNum(c, "sleep_quality");
    const lowSleepNights = c.filter((x: any) => x.sleep_hours != null && Number(x.sleep_hours) < 6).length;
    const movementYes = c.filter((x: any) => x.movement_today === "yes").length;
    const movementLittle = c.filter((x: any) => x.movement_today === "little").length;
    const movementCombinedPrev = cPrev.filter((x: any) => x.movement_today === "yes" || x.movement_today === "little").length;
    const journalCount = j.length;
    const journalDays = new Set(j.map((e: any) => e.date)).size;
    const meaningfulYes = c.filter((x: any) => x.meaningful_activity === "yes").length;
    const activeMeds = m.filter((x: any) => x.active).length;
    const adherencePrev = mlPrev.length
      ? Math.round((mlPrev.filter((x: any) => x.taken_status === "taken").length / mlPrev.length) * 100)
      : null;
    const totalActMinutes = acts.reduce((s, a) => s + (a.duration_minutes ?? 0), 0);

    setReport(lines.join("\n"));
    setStructured({
      checkins: checkinsTyped,
      activities: acts,
      journals: j,
      drivers,
      direction: directionCur,
      directionPrev,
      burden: burdenCur.value,
      fn: fnCur,
      rec: recCur,
      stab: stabCur,
      safetyCounts,
      adherence,
      sideEffects,
      movementDays,
      sleepHours,
      sleepHoursPrev,
      sleepQuality,
      lowSleepNights,
      movementYes,
      movementLittle,
      movementCombinedPrev,
      journalCount,
      journalDays,
      meaningfulYes,
      activeMeds,
      adherencePrev,
      totalActMinutes,
      periodDays: days,
    });
    setGenerating(false);
  };

  const downloadText = () => {
    if (!report) return;
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `riktning-rapport-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    if (!report || !structured) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    const maxW = pageW - margin * 2;
    const today = new Date().toISOString().split("T")[0];
    const periodStart = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

    const fmtScore = (v: number | null) => (v == null ? "—" : `${Math.round(v)}/100`);

    // ----- Header -----
    let y = drawReportHeader(
      doc,
      {
        title: "Riktning – Klinisk rapport",
        subtitle: `Period ${periodStart} – ${today} · ${days} dagar`,
        meta: `Genererad ${new Date().toLocaleDateString("sv-SE")}`,
        metrics: [
          { label: "Riktning", value: fmtScore(structured.direction) },
          { label: "Funktion", value: fmtScore(structured.fn) },
          { label: "Återhämtning", value: fmtScore(structured.rec) },
          { label: "Stabilitet", value: fmtScore(structured.stab) },
        ],
      },
      margin,
    );

    const ensureSpace = (needed: number) => {
      if (y + needed > pageH - margin - 30) {
        doc.addPage();
        y = margin;
      }
    };
    const writeLine = (text: string, opts: { bold?: boolean; size?: number; muted?: boolean } = {}) => {
      const size = opts.size ?? 10;
      doc.setFont("helvetica", opts.bold ? "bold" : "normal");
      doc.setFontSize(size);
      setPdfText(doc, opts.muted ? PDF_COLORS.inkSoft : PDF_COLORS.ink);
      const wrapped = doc.splitTextToSize(text, maxW);
      for (const w of wrapped) {
        ensureSpace(size + 4);
        doc.text(w, margin, y);
        y += size + 4;
      }
      setPdfText(doc, PDF_COLORS.ink);
    };

    // ----- Score-kort -----
    ensureSpace(110);
    y = drawSectionHeader(doc, "Beräknade scores (senaste 7 dagar)", y, margin);
    y = drawScoreCards(
      doc,
      [
        { label: "Riktning", value: structured.direction, prev: structured.directionPrev },
        { label: "Belastning", value: structured.burden, color: PDF_COLORS.slate },
        { label: "Funktion", value: structured.fn },
        { label: "Återhämtning", value: structured.rec },
      ],
      y,
      margin,
    );

    // ----- Trender (sparklines) -----
    ensureSpace(180);
    y = drawSectionHeader(doc, "Trender senaste 7 dagar", y, margin);
    const recent = structured.checkins.filter((c) => {
      const cutoff = new Date(Date.now() - 7 * 86400000);
      return new Date(c.date) >= cutoff;
    });
    y = drawSparklineRows(
      doc,
      [
        { label: "Sömn (h)", values: seriesFor(recent, "sleep_hours"), domain: [0, 12], suffix: " h", color: PDF_COLORS.purple, threshold: { value: 6 } },
        { label: "Oro", values: seriesFor(recent, "anxiety"), domain: [0, 10], suffix: "/10", color: PDF_COLORS.red, threshold: { value: 7 } },
        { label: "Tyngd", values: seriesFor(recent, "mood_heaviness"), domain: [0, 10], suffix: "/10", color: PDF_COLORS.slate },
        { label: "Funktion", values: seriesFor(recent, "function_score"), domain: [0, 10], suffix: "/10", color: PDF_COLORS.green },
        { label: "Energi", values: seriesFor(recent, "energy"), domain: [0, 10], suffix: "/10", color: PDF_COLORS.amber },
      ],
      y,
      margin,
    );
    writeLine("Streckad amber-linje = klinisk tröskel (sömn < 6 h, oro ≥ 7).", { muted: true, size: 8 });

    // ----- Bidragande faktorer -----
    if (structured.drivers.length > 0) {
      ensureSpace(80);
      y = drawSectionHeader(doc, "Viktigaste bidragande faktorer", y, margin);
      structured.drivers.slice(0, 6).forEach((d) => writeLine(`• ${d}`));
    }

    // ----- Veckopuls — rörelse -----
    ensureSpace(80);
    y = drawSectionHeader(doc, "Rörelse senaste 7 dagar", y, margin);
    const dayDates = sevenDayDates();
    const dayLabels = sevenDayLabels();
    const moveByDate = new Map(structured.checkins.map((c) => [c.date, c.movement_today as string | null]));
    y = drawWeekDots(
      doc,
      dayDates.map((d, i) => {
        const m = moveByDate.get(d);
        return { label: dayLabels[i], level: m === "yes" ? 2 : m === "little" ? 1 : 0 };
      }),
      y,
      margin,
      "Rörelse per dag",
    );

    // ----- Mest hjälpsamma aktiviteter -----
    if (structured.activities.length > 0) {
      const byLabel = new Map<string, { count: number; sumDelta: number }>();
      for (const a of structured.activities) {
        const cur = byLabel.get(a.label) ?? { count: 0, sumDelta: 0 };
        cur.count += 1;
        cur.sumDelta += Number(a.mood_delta ?? 0);
        byLabel.set(a.label, cur);
      }
      const top = Array.from(byLabel.entries())
        .map(([label, v]) => ({ label, count: v.count, avgDelta: v.sumDelta / v.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      ensureSpace(top.length * 18 + 40);
      y = drawSectionHeader(doc, "Mest loggade aktiviteter", y, margin);
      y = drawHBarChart(
        doc,
        top.map((t) => ({
          label: `${t.label} (snittlyft ${t.avgDelta >= 0 ? "+" : ""}${t.avgDelta.toFixed(1)})`,
          value: t.count,
          color: t.avgDelta >= 0.5 ? PDF_COLORS.green : t.avgDelta <= -0.5 ? PDF_COLORS.red : PDF_COLORS.blue,
        })),
        y,
        margin,
        { valueSuffix: " ggr" },
      );
    }

    // ----- Säkerhet -----
    const safetyTotal = structured.safetyCounts.passive + structured.safetyCounts.active + structured.safetyCounts.acute;
    if (safetyTotal > 0) {
      ensureSpace(70);
      y = drawSectionHeader(doc, "Säkerhetssignaler", y, margin);
      y = drawHBarChart(
        doc,
        [
          { label: "Passiva dödstankar", value: structured.safetyCounts.passive, color: PDF_COLORS.amber },
          { label: "Aktiva tankar", value: structured.safetyCounts.active, color: PDF_COLORS.red },
          { label: "Akuta signaler", value: structured.safetyCounts.acute, color: PDF_COLORS.red },
        ],
        y,
        margin,
        { valueSuffix: " dgr" },
      );
    }

    // ----- Kompletterande textinnehåll (skattningar, läkemedel, journal) -----
    ensureSpace(40);
    y = drawSectionHeader(doc, "Detaljer", y, margin);
    const SECTION_HEADERS = new Set([
      "BERÄKNADE SCORES (senaste 7 dagar, 0–100)",
      "VIKTIGASTE BIDRAGANDE FAKTORER",
      "SKATTNINGAR",
      "DAGLIGA MEDELVÄRDEN",
      "AKTIVITET",
      "LÄKEMEDEL",
      "SÄKERHETSSIGNALER",
      "SAMMANFATTNING",
      "JOURNAL (utvalda)",
    ]);
    // Visa endast sektioner som inte redan har grafiska widgets ovan.
    const TEXT_ONLY = new Set(["SKATTNINGAR", "DAGLIGA MEDELVÄRDEN", "LÄKEMEDEL", "SAMMANFATTNING", "JOURNAL (utvalda)"]);
    let inIncluded = false;
    for (const raw of report.split("\n").slice(2)) {
      const line = raw.trim();
      if (SECTION_HEADERS.has(line)) {
        inIncluded = TEXT_ONLY.has(line);
        if (inIncluded) {
          ensureSpace(28);
          writeLine(line, { bold: true, size: 11 });
        }
        continue;
      }
      if (!inIncluded) continue;
      writeLine(raw === "" ? " " : raw);
    }

    // ----- Avsnitt för läkaren -----
    ensureSpace(120);
    y = drawSectionHeader(doc, "Avsnitt för läkaren", y, margin);
    const blocks: { title: string; lines: number }[] = [
      { title: "Bedömning", lines: 4 },
      { title: "Plan & åtgärder", lines: 4 },
      { title: "Nästa steg / uppföljning", lines: 3 },
    ];
    for (const b of blocks) {
      ensureSpace(b.lines * 18 + 30);
      writeLine(b.title, { bold: true, size: 11 });
      setPdfDraw(doc, PDF_COLORS.rule);
      doc.setLineWidth(0.5);
      for (let i = 0; i < b.lines; i++) {
        ensureSpace(20);
        y += 16;
        doc.line(margin, y, pageW - margin, y);
      }
      y += 14;
    }

    drawFooter(doc, "Riktning · Klinisk rapport", margin);
    doc.save(`riktning-rapport-${today}.pdf`);
  };

  const copy = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report);
    toast.success("Kopierad");
  };

  const emailToDoctor = () => {
    if (!report) return;
    const trimmed = doctorEmail.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!emailOk) {
      toast.error("Skriv in en giltig mejladress först");
      return;
    }
    localStorage.setItem("riktning_doctor_email", trimmed);
    downloadPdf();
    const dateStr = new Date().toISOString().split("T")[0];
    const subject = `Klinisk rapport – ${days} dagar – ${dateStr}`;
    const body = [
      "Hej,",
      "",
      `Bifogar min rapport från Riktning för perioden ${days} dagar (genererad ${dateStr}).`,
      includeJournal ? "Rapporten inkluderar mina markerade journalanteckningar." : "Journalanteckningar är inte inkluderade i denna rapport.",
      "",
      `PDF-filen "riktning-rapport-${dateStr}.pdf" har just sparats i din nedladdningsmapp – bifoga den innan du skickar.`,
      "",
      "Vänliga hälsningar,",
    ].join("\n");
    window.location.href = `mailto:${encodeURIComponent(trimmed)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.success("Mejl förberett – bifoga PDF:en som just laddades ned");
  };

  return (
    <AppShell>
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-text-secondary mb-4">
        <ChevronLeft size={18} /> Tillbaka
      </button>
      <header className="mb-5">
        <h1 className="text-[28px] leading-[34px] mb-1">Rapport</h1>
        <p className="text-sm text-text-secondary">Sammanställning för läkare eller psykolog.</p>
      </header>

      <div className="card-cream p-4 mb-5">
        <label className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-2 block">Period</label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {([14, 30, 90] as const).map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-2xl p-3 font-extrabold text-sm border-2 ${days === d ? "border-blue-calm bg-blue-calm/10" : "border-border-soft bg-surface"}`}
            >
              {d} dagar
            </button>
          ))}
        </div>
        <label className="flex items-start gap-2 cursor-pointer">
          <Checkbox checked={includeJournal} onCheckedChange={(v) => setIncludeJournal(!!v)} className="mt-0.5" />
          <span className="text-sm font-semibold">
            Inkludera valda journalanteckningar
            <span className="block text-xs text-text-secondary font-normal mt-0.5">
              {markedJournalCount === null ? "…" : `${markedJournalCount} markerade i perioden`}
            </span>
          </span>
        </label>
      </div>

      <Button onClick={generate} disabled={generating} className="w-full h-12 rounded-full bg-foreground hover:bg-foreground/90 text-background font-extrabold mb-5">
        {generating ? "Genererar…" : "Generera rapport"}
      </Button>

      {report && (
        <>
          <div className="card-soft p-4 mb-4 max-h-[420px] overflow-y-auto">
            <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground">{report}</pre>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-5">
            <Button variant="secondary" onClick={copy} className="rounded-full font-extrabold h-11 text-xs">Kopiera</Button>
            <Button variant="secondary" onClick={downloadText} className="rounded-full font-extrabold h-11 text-xs">
              <Download size={14} /> Text
            </Button>
            <Button onClick={downloadPdf} className="rounded-full bg-blue-calm hover:bg-blue-calm/90 text-white font-extrabold h-11 text-xs">
              <FileDown size={14} /> PDF
            </Button>
          </div>

          <div className="card-cream p-4">
            <label className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-2 block">Skicka till läkare</label>
            <p className="text-xs text-text-secondary mb-3">PDF:en laddas ned och din mejlklient öppnas med adress, ämne och meddelande förifyllt – dra in PDF:en som bilaga innan du skickar.</p>
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="lakare@vardcentral.se"
              value={doctorEmail}
              onChange={(e) => setDoctorEmail(e.target.value)}
              className="h-12 rounded-full border-2 border-border-soft bg-surface mb-3"
            />
            <Button onClick={emailToDoctor} className="w-full h-12 rounded-full bg-blue-calm hover:bg-blue-calm/90 text-white font-extrabold">
              <Mail size={16} className="mr-1" /> Förbered mejl till läkare
            </Button>
          </div>
        </>
      )}
    </AppShell>
  );
};

function activitySummary(acts: any[]): string[] {
  if (!acts.length) return ["Inga loggade aktiviteter under perioden."];
  // Per aktivitet: snitt-mooddelta och antal
  const byLabel = new Map<string, { count: number; sumDelta: number; minutes: number }>();
  const byCategory = new Map<string, number>();
  for (const a of acts) {
    const cur = byLabel.get(a.label) ?? { count: 0, sumDelta: 0, minutes: 0 };
    cur.count += 1;
    cur.sumDelta += Number(a.mood_delta ?? 0);
    cur.minutes += Number(a.duration_minutes ?? 0);
    byLabel.set(a.label, cur);
    byCategory.set(a.category, (byCategory.get(a.category) ?? 0) + 1);
  }
  const top = Array.from(byLabel.entries())
    .map(([label, v]) => ({ label, count: v.count, avgDelta: v.sumDelta / v.count, minutes: v.minutes }))
    .sort((a, b) => (b.avgDelta - a.avgDelta) || (b.count - a.count))
    .slice(0, 5);
  const cats = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);
  return [
    `Aktiviteter med störst humörlyft:`,
    ...top.map(t => `  - ${t.label} · ${t.count} ggr · ${t.minutes} min totalt · snittlyft ${t.avgDelta >= 0 ? "+" : ""}${t.avgDelta.toFixed(1)}`),
    `Fördelning per kategori: ${cats.map(([k, v]) => `${k} (${v})`).join(", ")}`,
  ];
}

function summarize(c: any[], f: any[], safety: { passive: number; active: number; acute: number }) {
  if (!c.length) return "För lite data för en sammanfattning.";
  const first = c.slice(0, Math.ceil(c.length / 2));
  const last = c.slice(-Math.ceil(c.length / 2));
  const a = (arr: any[], k: string) => {
    const xs = arr.map(r => r[k]).filter((v): v is number => typeof v === "number");
    return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
  };
  const fnDelta = (a(last, "function_score") ?? 0) - (a(first, "function_score") ?? 0);
  const burdenDelta = (a(last, "mood_heaviness") ?? 0) - (a(first, "mood_heaviness") ?? 0);
  const sleepAvg = a(c, "sleep_hours");

  const parts: string[] = [];
  if (fnDelta > 0.5) parts.push("ökad funktion");
  else if (fnDelta < -0.5) parts.push("minskad funktion");
  if (burdenDelta < -0.5) parts.push("minskad belastning");
  else if (burdenDelta > 0.5) parts.push("ökad belastning");
  if (sleepAvg !== null && sleepAvg < 6) parts.push("sömnkvaliteten är fortsatt låg");

  let out = `Under perioden syns ${parts.length ? parts.join(", ") : "begränsade förändringar"}.`;
  if (safety.active > 0 || safety.acute > 0) {
    out += ` Aktiva dödstankar rapporteras ${safety.active} dagar, akuta signaler ${safety.acute} dagar.`;
  } else if (safety.passive > 0) {
    out += ` Passiva dödstankar förekommer ${safety.passive} dagar. Aktiva planer rapporteras ej.`;
  } else {
    out += ` Inga säkerhetssignaler rapporterade.`;
  }
  return out;
}

function computeDrivers(cs: Checkin[]): string[] {
  if (cs.length < 3) return [];
  const half = Math.ceil(cs.length / 2);
  const first = cs.slice(0, half);
  const last = cs.slice(-half);
  const meanOf = (arr: Checkin[], k: keyof Checkin) => {
    const xs = arr.map(r => r[k]).filter((v): v is number => typeof v === "number");
    return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
  };
  type Driver = { label: string; mean: number; trend: number; impact: number; direction: "neg" | "pos"; unit: string };
  const fields: { key: keyof Checkin; label: string; direction: "neg" | "pos"; unit: string; max: number }[] = [
    { key: "mood_heaviness", label: "Tyngd", direction: "neg", unit: "/10", max: 10 },
    { key: "anxiety", label: "Oro", direction: "neg", unit: "/10", max: 10 },
    { key: "hopelessness", label: "Hopplöshet", direction: "neg", unit: "/10", max: 10 },
    { key: "guilt_selfcriticism", label: "Skuld/självkritik", direction: "neg", unit: "/10", max: 10 },
    { key: "energy", label: "Energi", direction: "pos", unit: "/10", max: 10 },
    { key: "function_score", label: "Funktion", direction: "pos", unit: "/10", max: 10 },
    { key: "getting_started", label: "Komma igång", direction: "pos", unit: "/10", max: 10 },
    { key: "sleep_quality", label: "Sömnkvalitet", direction: "pos", unit: "/10", max: 10 },
    { key: "daytime_bed_sofa_time_minutes", label: "Säng/sofftid dagtid", direction: "neg", unit: " min", max: 240 },
  ];
  const drivers: Driver[] = [];
  for (const f of fields) {
    const m = meanOf(cs, f.key);
    if (m == null) continue;
    const m1 = meanOf(first, f.key);
    const m2 = meanOf(last, f.key);
    const trend = (m1 != null && m2 != null) ? m2 - m1 : 0;
    // Impact: hur långt från "bra" på en 0–100-skala, plus trendmagnitud
    const norm = (m / f.max) * 100;
    const distanceFromGood = f.direction === "neg" ? norm : 100 - norm;
    const impact = distanceFromGood + Math.abs(trend / f.max) * 50;
    drivers.push({ label: f.label, mean: m, trend, impact, direction: f.direction, unit: f.unit });
  }
  drivers.sort((a, b) => b.impact - a.impact);
  return drivers.slice(0, 5).map(d => {
    const meanStr = `${Math.round(d.mean * 10) / 10}${d.unit}`;
    let trendStr = "";
    if (Math.abs(d.trend) >= (d.unit === " min" ? 15 : 0.5)) {
      const sign = d.trend > 0 ? "↑" : "↓";
      const good = (d.direction === "pos" && d.trend > 0) || (d.direction === "neg" && d.trend < 0);
      trendStr = ` · ${sign} ${good ? "förbättring" : "försämring"}`;
    } else {
      trendStr = " · stabil";
    }
    return `${d.label}: snitt ${meanStr}${trendStr}`;
  });
}

export default Vard;
