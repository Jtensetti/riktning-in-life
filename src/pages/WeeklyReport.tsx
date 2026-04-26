import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, FileDown, Plus, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { burdenScore, functionScore, recoveryScore, stabilityScore, splitWeeks, type Checkin, type WeeklyFormScore } from "@/lib/metrics";
import {
  PDF_COLORS,
  drawReportHeader,
  drawSectionHeader,
  drawScoreCards,
  drawSparklineRows,
  drawHBarChart,
  drawWeekDots,
  drawFooter,
  sevenDayLabels,
  sevenDayDates,
  seriesFor,
} from "@/lib/pdfWidgets";

const QUESTIONS_KEY = "riktning_doctor_questions";

const isoDaysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

const fmt = (v: number | null | undefined, suffix = "") =>
  v == null ? "—" : `${Math.round((v as number) * 10) / 10}${suffix}`;

const fmtScore = (v: number | null) => (v == null ? "—" : `${Math.round(v)}/100`);

const meanOf = (arr: Checkin[], key: keyof Checkin): number | null => {
  const xs = arr.map((r) => r[key]).filter((v): v is number => typeof v === "number");
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
};

const WeeklyReport = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<{
    checkins: Checkin[];
    forms: { type: string; total_score: number; date: string }[];
    meds: { name: string; dose: string | null; active: boolean; date_started: string | null }[];
    medLogs: { taken_status: string; side_effects_json: unknown; date: string }[];
    journals: { date: string; template_type: string; title: string | null; free_text: string | null }[];
    activities: { date: string; label: string; category: string; duration_minutes: number | null; mood_delta: number | null }[];
  } | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [questions, setQuestions] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(QUESTIONS_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState("");
  const [includeJournal, setIncludeJournal] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const since = isoDaysAgo(13); // 14 dagar för att kunna jämföra vecka mot vecka
      const sinceWeek = isoDaysAgo(6);
      const [c, f, m, ml, j, a] = await Promise.all([
        supabase.from("daily_checkins").select("*").eq("user_id", user.id).gte("date", since).order("date"),
        supabase.from("weekly_forms").select("type,total_score,date").eq("user_id", user.id).gte("date", since).order("date"),
        supabase.from("medications").select("name,dose,active,date_started").eq("user_id", user.id),
        supabase.from("medication_logs").select("taken_status,side_effects_json,date").eq("user_id", user.id).gte("date", sinceWeek),
        supabase.from("journal_entries").select("date,template_type,title,free_text").eq("user_id", user.id).eq("include_in_report", true).gte("date", sinceWeek).order("date"),
        supabase.from("activity_logs").select("date,label,category,duration_minutes,mood_delta").eq("user_id", user.id).gte("date", sinceWeek).order("date"),
      ]);
      if (cancelled) return;
      setData({
        checkins: (c.data ?? []) as unknown as Checkin[],
        forms: (f.data ?? []) as { type: string; total_score: number; date: string }[],
        meds: (m.data ?? []) as { name: string; dose: string | null; active: boolean; date_started: string | null }[],
        medLogs: (ml.data ?? []) as { taken_status: string; side_effects_json: unknown; date: string }[],
        journals: (j.data ?? []) as { date: string; template_type: string; title: string | null; free_text: string | null }[],
        activities: (a.data ?? []) as { date: string; label: string; category: string; duration_minutes: number | null; mood_delta: number | null }[],
      });
      setLoadingData(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const addQuestion = () => {
    const q = draft.trim();
    if (!q) return;
    const next = [...questions, q];
    setQuestions(next);
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(next));
    setDraft("");
  };

  const removeQuestion = (i: number) => {
    const next = questions.filter((_, idx) => idx !== i);
    setQuestions(next);
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(next));
  };

  const summary = useMemo(() => {
    if (!data) return null;
    const week = data.checkins.filter((c) => c.date >= isoDaysAgo(6));
    const { current, previous } = splitWeeks(data.checkins);
    const latestPhq = [...data.forms].reverse().find((x) => x.type === "phq9");
    const latestGad = [...data.forms].reverse().find((x) => x.type === "gad7");
    const latestWho = [...data.forms].reverse().find((x) => x.type === "who5");
    const weekly: WeeklyFormScore = {
      phq9: latestPhq ? Number(latestPhq.total_score) : undefined,
      gad7: latestGad ? Number(latestGad.total_score) : undefined,
      who5: latestWho ? Number(latestWho.total_score) : undefined,
    };
    const burden = burdenScore(current, weekly);
    const burdenPrev = burdenScore(previous, weekly);
    const fn = functionScore(current);
    const rec = recoveryScore(current);
    const stab = stabilityScore(current);
    const direction = burden.value == null ? null : 100 - burden.value;
    const directionPrev = burdenPrev.value == null ? null : 100 - burdenPrev.value;

    const sleepHours = meanOf(week, "sleep_hours");
    const sleepQuality = meanOf(week, "sleep_quality");
    const movementYes = week.filter((c) => c.movement_today === "yes").length;
    const movementLittle = week.filter((c) => c.movement_today === "little").length;
    const meaningfulYes = week.filter((c) => c.meaningful_activity === "yes").length;

    const adherence = data.medLogs.length
      ? Math.round((data.medLogs.filter((x) => x.taken_status === "taken").length / data.medLogs.length) * 100)
      : null;
    const sideEffects = Array.from(
      new Set(
        data.medLogs.flatMap((x) => (Array.isArray(x.side_effects_json) ? (x.side_effects_json as string[]) : [])),
      ),
    );

    const totalActMinutes = data.activities.reduce((s, a) => s + (a.duration_minutes ?? 0), 0);
    const safety = {
      passive: week.filter((c) => c.safety_status === "passive_thoughts").length,
      active: week.filter((c) => c.safety_status === "active_thoughts").length,
      acute: week.filter((c) => c.safety_status === "acute").length,
    };

    return {
      week,
      direction,
      directionPrev,
      burden,
      fn,
      rec,
      stab,
      sleepHours,
      sleepQuality,
      movementYes,
      movementLittle,
      meaningfulYes,
      adherence,
      sideEffects,
      totalActMinutes,
      safety,
    };
  }, [data]);

  const generatePdf = () => {
    if (!data || !summary) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 48;
    const maxW = pageW - margin * 2;
    let y = margin;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageH - margin - 30) {
        doc.addPage();
        y = margin;
      }
    };
    const writeLine = (text: string, opts: { bold?: boolean; size?: number; gap?: number } = {}) => {
      const size = opts.size ?? 10;
      doc.setFont("helvetica", opts.bold ? "bold" : "normal");
      doc.setFontSize(size);
      const wrapped = doc.splitTextToSize(text, maxW);
      for (const w of wrapped) {
        ensureSpace(size + 4);
        doc.text(w, margin, y);
        y += size + 4;
      }
      if (opts.gap) y += opts.gap;
    };
    const sectionHeader = (title: string) => {
      ensureSpace(28);
      y += 6;
      doc.setDrawColor(220);
      doc.line(margin, y, pageW - margin, y);
      y += 12;
      writeLine(title, { bold: true, size: 13 });
      y += 2;
    };

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Klinisk veckorapport", margin, y);
    y += 22;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(
      `Period: ${isoDaysAgo(6)} till ${new Date().toISOString().split("T")[0]} · Genererad ${new Date().toLocaleDateString("sv-SE")}`,
      margin,
      y,
    );
    doc.setTextColor(0);
    y += 18;

    // Beräknade scores
    sectionHeader("Beräknade scores (0–100)");
    const deltaStr = (cur: number | null, prev: number | null) => {
      if (cur == null || prev == null) return "";
      const d = Math.round(cur - prev);
      if (d === 0) return " (oförändrad)";
      return ` (${d > 0 ? "+" : ""}${d} mot förra veckan)`;
    };
    writeLine(`Riktning (100 − belastning): ${fmtScore(summary.direction)}${deltaStr(summary.direction, summary.directionPrev)}`);
    writeLine(`Belastning${summary.burden.withWeekly ? " (inkl. PHQ-9/GAD-7)" : " (utan veckoskattning)"}: ${fmtScore(summary.burden.value)}`);
    writeLine(`Funktion: ${fmtScore(summary.fn)}`);
    writeLine(`Återhämtning: ${fmtScore(summary.rec)}`);
    writeLine(`Stabilitet: ${fmtScore(summary.stab)}`);

    // Sömn
    sectionHeader("Sömn");
    writeLine(`Snittlängd: ${fmt(summary.sleepHours, " h")}`);
    writeLine(`Snittkvalitet: ${fmt(summary.sleepQuality, "/10")}`);
    const lowSleepDays = summary.week.filter((c) => c.sleep_hours != null && Number(c.sleep_hours) < 6).length;
    writeLine(`Dagar med < 6 h sömn: ${lowSleepDays}/${summary.week.length}`);

    // Rörelse & aktivitet
    sectionHeader("Rörelse & meningsfull aktivitet");
    writeLine(`Rörelse-dagar (självskattat): ${summary.movementYes} fullt + ${summary.movementLittle} lite av ${summary.week.length}`);
    writeLine(`Dagar med meningsfull aktivitet: ${summary.meaningfulYes}/${summary.week.length}`);
    writeLine(`Loggade aktiviteter: ${data.activities.length} st · ${summary.totalActMinutes} min totalt`);
    if (data.activities.length) {
      const byLabel = new Map<string, { count: number; sumDelta: number }>();
      for (const a of data.activities) {
        const cur = byLabel.get(a.label) ?? { count: 0, sumDelta: 0 };
        cur.count += 1;
        cur.sumDelta += Number(a.mood_delta ?? 0);
        byLabel.set(a.label, cur);
      }
      const top = Array.from(byLabel.entries())
        .map(([label, v]) => ({ label, count: v.count, avgDelta: v.sumDelta / v.count }))
        .sort((a, b) => b.avgDelta - a.avgDelta || b.count - a.count)
        .slice(0, 3);
      for (const t of top) {
        writeLine(`  • ${t.label} · ${t.count} ggr · snittlyft ${t.avgDelta >= 0 ? "+" : ""}${t.avgDelta.toFixed(1)}`);
      }
    }

    // Medicin
    sectionHeader("Läkemedel");
    if (data.meds.length === 0) writeLine("Inga registrerade läkemedel.");
    for (const med of data.meds) {
      writeLine(
        `• ${med.name}${med.dose ? ` ${med.dose}` : ""} · ${med.active ? "aktiv" : "avslutad"}${med.date_started ? ` (start ${med.date_started})` : ""}`,
      );
    }
    writeLine(`Följsamhet senaste veckan: ${summary.adherence !== null ? summary.adherence + " %" : "ej loggat"}`);
    writeLine(`Rapporterade biverkningar: ${summary.sideEffects.length ? summary.sideEffects.join(", ") : "inga"}`);

    // Journal
    if (includeJournal) {
      sectionHeader("Journal (utvalda anteckningar)");
      if (data.journals.length === 0) {
        writeLine("Inga markerade anteckningar för perioden.");
      } else {
        for (const e of data.journals.slice(0, 8)) {
          writeLine(`${e.date} · ${e.template_type}${e.title ? ` · ${e.title}` : ""}`, { bold: true });
          if (e.free_text) writeLine(e.free_text.slice(0, 280));
          y += 2;
        }
      }
    }

    // Säkerhet
    sectionHeader("Säkerhetssignaler");
    writeLine(`Passiva dödstankar: ${summary.safety.passive} dagar`);
    writeLine(`Aktiva tankar: ${summary.safety.active} dagar`);
    writeLine(`Akuta signaler: ${summary.safety.acute} dagar`);

    // Patientens frågor
    sectionHeader("Patientens frågor till läkaren");
    if (questions.length === 0) {
      writeLine("Inga frågor angivna.");
    } else {
      questions.forEach((q, i) => writeLine(`${i + 1}. ${q}`));
    }

    // Tomma fält för läkaren
    sectionHeader("Avsnitt för läkaren");
    const blocks: { title: string; lines: number }[] = [
      { title: "Bedömning", lines: 4 },
      { title: "Plan & åtgärder", lines: 4 },
      { title: "Nästa steg / uppföljning", lines: 3 },
      { title: "Övriga noteringar", lines: 3 },
    ];
    for (const b of blocks) {
      writeLine(b.title, { bold: true, size: 11 });
      doc.setDrawColor(200);
      for (let i = 0; i < b.lines; i++) {
        ensureSpace(20);
        y += 16;
        doc.line(margin, y, pageW - margin, y);
      }
      y += 14;
    }

    // Sidnumrering
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Sida ${i} / ${pageCount}`, pageW - margin, pageH - 24, { align: "right" });
      doc.setTextColor(0);
    }

    doc.save(`riktning-veckorapport-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF skapad");
  };

  if (loading || loadingData) {
    return (
      <AppShell>
        <div className="h-40 bg-surface-alt rounded-3xl animate-pulse" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1 text-sm font-bold text-text-secondary mb-4"
      >
        <ChevronLeft size={18} /> Tillbaka
      </button>

      <header className="mb-5">
        <h1 className="text-[28px] leading-[34px] mb-1">Veckorapport till läkaren</h1>
        <p className="text-sm text-text-secondary">
          Sammanställer senaste 7 dagar: sömn, rörelse, journal, medicin — plus tomma anteckningsfält för vården.
        </p>
      </header>

      {summary && (
        <div className="card-cream p-4 mb-5 space-y-1">
          <div className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-2">
            Förhandsvisning av nyckeltal
          </div>
          <Row label="Riktning" value={fmtScore(summary.direction)} />
          <Row label="Funktion" value={fmtScore(summary.fn)} />
          <Row label="Återhämtning" value={fmtScore(summary.rec)} />
          <Row label="Sömn (snitt)" value={fmt(summary.sleepHours, " h")} />
          <Row label="Rörelse-dagar" value={`${summary.movementYes}/${summary.week.length}`} />
          <Row label="Loggade aktiviteter" value={`${data?.activities.length ?? 0} st · ${summary.totalActMinutes} min`} />
          <Row label="Markerade journaler" value={`${data?.journals.length ?? 0}`} />
          <Row
            label="Medicin-följsamhet"
            value={summary.adherence !== null ? `${summary.adherence} %` : "ej loggat"}
          />
        </div>
      )}

      <div className="card-cream p-4 mb-5">
        <label className="text-xs font-extrabold uppercase tracking-wide text-text-secondary mb-2 block">
          Frågor du vill ställa till läkaren
        </label>
        <p className="text-xs text-text-secondary mb-3">
          Sparas lokalt och inkluderas i PDF:en.
        </p>
        {questions.length > 0 && (
          <ul className="space-y-2 mb-3">
            {questions.map((q, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-2xl bg-surface border border-border-soft p-3"
              >
                <span className="text-sm flex-1">{q}</span>
                <button
                  onClick={() => removeQuestion(i)}
                  className="p-1 text-text-secondary hover:text-red-risk shrink-0"
                  aria-label="Ta bort fråga"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="t.ex. Bör vi justera dosen? Kan jag prova KBT?"
          className="rounded-2xl min-h-[64px] mb-2"
        />
        <Button
          onClick={addQuestion}
          disabled={!draft.trim()}
          variant="secondary"
          size="sm"
          className="rounded-full font-extrabold"
        >
          <Plus size={14} /> Lägg till fråga
        </Button>
      </div>

      <label className="card-cream p-4 mb-5 flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={includeJournal}
          onChange={(e) => setIncludeJournal(e.target.checked)}
          className="mt-1 h-4 w-4 accent-blue-calm"
        />
        <span className="text-sm">
          <span className="font-extrabold block mb-0.5">Inkludera markerade journalanteckningar</span>
          <span className="text-xs text-text-secondary">
            Endast anteckningar du markerat som "Inkludera i rapport".
          </span>
        </span>
      </label>

      <Button
        onClick={generatePdf}
        className="w-full h-12 rounded-full bg-blue-calm hover:bg-blue-calm/90 text-white font-extrabold"
      >
        <FileDown size={16} className="mr-1" /> Skapa PDF
      </Button>
    </AppShell>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between py-1 text-sm">
    <span className="text-text-secondary">{label}</span>
    <span className="font-extrabold">{value}</span>
  </div>
);

export default WeeklyReport;
