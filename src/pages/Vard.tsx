import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Illustration } from "@/components/Illustrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, FileText, Pill as PillIcon, ClipboardList, Plus, Download, Trash2, FileDown } from "lucide-react";
import { toast } from "sonner";
import { FORMS, FormType, SIDE_EFFECTS } from "@/lib/forms";
import jsPDF from "jspdf";

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
      <header className="mb-6">
        <h1 className="text-[32px] leading-[38px] mb-1">Vård</h1>
        <p className="text-sm text-text-secondary">Skattningar, läkemedel och rapport till vården.</p>
      </header>

      <section className="mb-7">
        <h2 className="text-lg font-extrabold mb-3">Veckoskattningar</h2>
        <div className="space-y-3">
          {(["phq9", "gad7", "who5"] as FormType[]).map(t => {
            const f = FORMS[t];
            const last = latest(t);
            const final = last && f.toFinal ? f.toFinal(last.total_score) : last?.total_score;
            return (
              <button
                key={t}
                onClick={() => { setActiveForm(t); setView("form"); }}
                className="w-full card-soft p-4 flex items-center gap-3 text-left hover:bg-surface-alt transition"
              >
                <div className="w-11 h-11 rounded-2xl bg-blue-calm/10 text-blue-calm grid place-items-center">
                  <ClipboardList size={20} />
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
          className="w-full card-soft p-4 flex items-center gap-3 text-left hover:bg-surface-alt transition"
        >
          <div className="w-11 h-11 rounded-2xl bg-pink-move/15 text-pink-move grid place-items-center">
            <PillIcon size={20} />
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
          className="w-full rounded-3xl bg-blue-calm text-white p-1 overflow-hidden shadow-soft text-left hover:opacity-95 transition"
        >
          <div className="rounded-[20px] overflow-hidden">
            <Illustration name="care" className="w-full h-auto" />
          </div>
          <div className="px-4 py-4 flex items-center gap-3">
            <FileText size={22} />
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
          <PillIcon size={28} className="mx-auto mb-2 text-text-secondary" />
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
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const generate = async () => {
    if (!user) return;
    setGenerating(true);
    const since = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

    const [checkins, forms, meds, medLogs, journals] = await Promise.all([
      supabase.from("daily_checkins").select("*").eq("user_id", user.id).gte("date", since).order("date"),
      supabase.from("weekly_forms").select("*").eq("user_id", user.id).gte("date", since).order("date"),
      supabase.from("medications").select("*").eq("user_id", user.id),
      supabase.from("medication_logs").select("*").eq("user_id", user.id).gte("date", since),
      includeJournal ? supabase.from("journal_entries").select("*").eq("user_id", user.id).eq("include_in_report", true).gte("date", since) : Promise.resolve({ data: [] as any[] }),
    ]);

    const c = checkins.data ?? [];
    const f = (forms.data ?? []) as any[];
    const m = (meds.data ?? []) as any[];
    const ml = (medLogs.data ?? []) as any[];
    const j = (journals.data ?? []) as any[];

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

    const lines = [
      `RIKTNING – Klinisk rapport`,
      `Period: ${since} till ${new Date().toISOString().split("T")[0]} (${days} dagar)`,
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
      `Rörelse-dagar: ${movementDays}/${c.length}`,
      `Journal-anteckningar: ${j.length}`,
      ``,
      `LÄKEMEDEL`,
      ...m.map((x: any) => `- ${x.name}${x.dose ? ` ${x.dose}` : ""} · ${x.active ? "aktiv" : "avslutad"}${x.date_started ? ` (start ${x.date_started})` : ""}`),
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

    setReport(lines.join("\n"));
    setGenerating(false);
  };

  const download = () => {
    if (!report) return;
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `riktning-rapport-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report);
    toast.success("Kopierad");
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
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={includeJournal} onCheckedChange={(v) => setIncludeJournal(!!v)} />
          <span className="text-sm font-semibold">Inkludera valda journalanteckningar</span>
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
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={copy} className="rounded-full font-extrabold h-11">Kopiera</Button>
            <Button onClick={download} className="rounded-full bg-blue-calm hover:bg-blue-calm/90 text-white font-extrabold h-11">
              <Download size={16} /> Ladda ner
            </Button>
          </div>
        </>
      )}
    </AppShell>
  );
};

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

export default Vard;
