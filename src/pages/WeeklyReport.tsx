import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, FileDown, Mail, Plus, Sparkles, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { SparseDataNotice } from "@/components/SparseDataNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WeeklyAIInsight } from "@/components/WeeklyAIInsight";
import { RiskSignalsCard } from "@/components/RiskSignalsCard";
import { detectRisks, type RiskSignal } from "@/lib/riskSignals";
import { burdenScore, functionScore, recoveryScore, stabilityScore, splitWeeks, type Checkin, type WeeklyFormScore } from "@/lib/metrics";
import { formatDelta, improvementSign } from "@/lib/valence";
import { htmlToPreviewText } from "@/lib/htmlText";
import {
  PDF_COLORS,
  drawReportHeader,
  drawSectionHeader,
  drawScoreCards,
  drawSparklineRows,
  drawHBarChart,
  drawWeekDots,
  drawSummaryBlock,
  drawFooter,
  setPdfText,
  setPdfDraw,
  sevenDayLabels,
  sevenDayDates,
  seriesFor,
  PDF_PAGE,
} from "@/lib/pdfWidgets";
import { patchUserSettings, SETTINGS_HYDRATED_EVENT } from "@/lib/userSettingsSync";

// ───────────────────────────────────────────────────────────────
// Fas D — tidsspann för vårdrapport ("sedan senaste besök" m.fl.)
// ───────────────────────────────────────────────────────────────
type ReportRange = "7d" | "14d" | "30d" | "since_visit";

const LAST_VISIT_KEY = "riktning_last_visit_date";

const readLastVisit = (): string => {
  try {
    return localStorage.getItem(LAST_VISIT_KEY) || "";
  } catch {
    return "";
  }
};

type DoctorSummary = {
  headline: string;
  whats_changed: string;
  whats_working: string;
  whats_worrying: string;
  recommended_focus: string;
  flags: string[];
};

// Frågor till läkaren synkas via user_settings.weekly_questions så att
// listan följer användaren mellan mobil och desktop. Lokal cache läses
// synkront för snabb första render.
const QUESTIONS_KEY = "riktning_weekly_questions";
const LEGACY_QUESTIONS_KEY = "riktning_doctor_questions";

const readCachedQuestions = (): string[] => {
  try {
    const raw = localStorage.getItem(QUESTIONS_KEY);
    if (raw) return JSON.parse(raw) as string[];
    // Engångsmigrering från det gamla nyckelnamnet (lokal-bara) så att
    // användare som hann skapa frågor innan synken inte tappar dem.
    const legacy = localStorage.getItem(LEGACY_QUESTIONS_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as string[];
      localStorage.setItem(QUESTIONS_KEY, JSON.stringify(parsed));
      localStorage.removeItem(LEGACY_QUESTIONS_KEY);
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
};

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
    medLogs: { taken_status: string; side_effects_json: unknown; severity: number | null; date: string }[];
    journals: { date: string; template_type: string; title: string | null; free_text: string | null }[];
    activities: { date: string; label: string; category: string; duration_minutes: number | null; mood_delta: number | null }[];
  } | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [questions, setQuestions] = useState<string[]>(readCachedQuestions);
  const [draft, setDraft] = useState("");
  const [includeJournal, setIncludeJournal] = useState(true);

  // Fas D — tidsspann + AI-sammanfattning till läkaren
  const [range, setRange] = useState<ReportRange>("7d");
  const [lastVisit, setLastVisit] = useState<string>(readLastVisit);
  const [aiSummary, setAiSummary] = useState<DoctorSummary | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [doctorEmail, setDoctorEmail] = useState<string>(
    () => localStorage.getItem("riktning_doctor_email") || "",
  );

  // Lyssna på serverhydrering — på en ny enhet vill vi att frågorna dyker upp
  // så fort hydrateUserSettings har skrivit ner cachen.
  useEffect(() => {
    const onHydrated = () => setQuestions(readCachedQuestions());
    window.addEventListener(SETTINGS_HYDRATED_EVENT, onHydrated);
    return () => window.removeEventListener(SETTINGS_HYDRATED_EVENT, onHydrated);
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      // Allt veckorapports-data hämtas i ett enda RPC-anrop. Funktionen
      // get_weekly_report körs som SECURITY DEFINER och låser sig till
      // auth.uid() — så vi kan aldrig av misstag läsa någon annans data.
      const { data: payload, error } = await supabase.rpc("get_weekly_report" as never, {
        target_date: new Date().toISOString().split("T")[0],
      } as never);
      if (cancelled) return;
      if (error || !payload) {
        setData({ checkins: [], forms: [], meds: [], medLogs: [], journals: [], activities: [] });
        setLoadingData(false);
        return;
      }
      const p = payload as unknown as {
        checkins: Checkin[];
        forms: { type: string; total_score: number; date: string }[];
        medications: { name: string; dose: string | null; active: boolean; date_started: string | null }[];
        medication_logs: { taken_status: string; side_effects_json: unknown; date: string }[];
        journals: { date: string; template_type: string; title: string | null; free_text: string | null }[];
        activities: { date: string; label: string; category: string; duration_minutes: number | null; mood_delta: number | null }[];
      };
      setData({
        checkins: p.checkins ?? [],
        forms: p.forms ?? [],
        meds: p.medications ?? [],
        medLogs: p.medication_logs ?? [],
        journals: p.journals ?? [],
        activities: p.activities ?? [],
      });
      setLoadingData(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const persistQuestions = (next: string[]) => {
    setQuestions(next);
    try { localStorage.setItem(QUESTIONS_KEY, JSON.stringify(next)); } catch { /* quota */ }
    void patchUserSettings({ weekly_questions: next });
  };

  const addQuestion = () => {
    const q = draft.trim();
    if (!q) return;
    persistQuestions([...questions, q]);
    setDraft("");
  };

  const removeQuestion = (i: number) => {
    persistQuestions(questions.filter((_, idx) => idx !== i));
  };

  const summary = useMemo(() => {
    if (!data) return null;
    const week = data.checkins.filter((c) => c.date >= isoDaysAgo(6));
    const prevWeek = data.checkins.filter((c) => c.date < isoDaysAgo(6) && c.date >= isoDaysAgo(13));
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
    const sleepHoursPrev = meanOf(prevWeek, "sleep_hours");
    const sleepQuality = meanOf(week, "sleep_quality");
    const lowSleepNights = week.filter((c) => c.sleep_hours != null && Number(c.sleep_hours) < 6).length;
    const movementYes = week.filter((c) => c.movement_today === "yes").length;
    const movementLittle = week.filter((c) => c.movement_today === "little").length;
    const movementYesPrev = prevWeek.filter((c) => c.movement_today === "yes").length;
    const movementLittlePrev = prevWeek.filter((c) => c.movement_today === "little").length;
    const meaningfulYes = week.filter((c) => c.meaningful_activity === "yes").length;

    // Medicin: 7 vs 7 dagar
    const medLogsWeek = data.medLogs.filter((x) => x.date >= isoDaysAgo(6));
    const medLogsPrev = data.medLogs.filter((x) => x.date < isoDaysAgo(6) && x.date >= isoDaysAgo(13));
    const adherence = medLogsWeek.length
      ? Math.round((medLogsWeek.filter((x) => x.taken_status === "taken").length / medLogsWeek.length) * 100)
      : null;
    const adherencePrev = medLogsPrev.length
      ? Math.round((medLogsPrev.filter((x) => x.taken_status === "taken").length / medLogsPrev.length) * 100)
      : null;
    const sideEffects = Array.from(
      new Set(
        medLogsWeek.flatMap((x) => (Array.isArray(x.side_effects_json) ? (x.side_effects_json as string[]) : [])),
      ),
    );

    const totalActMinutes = data.activities.reduce((s, a) => s + (a.duration_minutes ?? 0), 0);
    const safety = {
      passive: week.filter((c) => c.safety_status === "passive_thoughts").length,
      active: week.filter((c) => c.safety_status === "active_thoughts").length,
      acute: week.filter((c) => c.safety_status === "acute").length,
    };

    // Journal-räkning (data.journals är redan filtrerat på senaste 7 dagar via include_in_report)
    const journalCount = data.journals.length;
    const journalDays = new Set(data.journals.map((j) => j.date)).size;

    return {
      week,
      direction,
      directionPrev,
      burden,
      fn,
      rec,
      stab,
      sleepHours,
      sleepHoursPrev,
      sleepQuality,
      lowSleepNights,
      movementYes,
      movementLittle,
      movementYesPrev,
      movementLittlePrev,
      meaningfulYes,
      adherence,
      adherencePrev,
      sideEffects,
      totalActMinutes,
      safety,
      journalCount,
      journalDays,
    };
  }, [data]);

  const generatePdf = () => {
    if (!data || !summary) return;
    const doc = new jsPDF({ unit: PDF_PAGE.unit, format: PDF_PAGE.format });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = PDF_PAGE.margin;
    const maxW = pageW - margin * 2;
    const today = new Date().toISOString().split("T")[0];

    // ----- Header med nyckeltal -----
    let y = drawReportHeader(
      doc,
      {
        title: "Klinisk veckorapport",
        subtitle: `Period ${isoDaysAgo(6)} – ${today} · 7 dagar`,
        meta: `Genererad ${new Date().toLocaleDateString("sv-SE")}`,
        metrics: [
          { label: "Riktning", value: fmtScore(summary.direction) },
          { label: "Funktion", value: fmtScore(summary.fn) },
          { label: "Återhämtning", value: fmtScore(summary.rec) },
          { label: "Stabilitet", value: fmtScore(summary.stab) },
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
    const writeLine = (text: string, opts: { bold?: boolean; size?: number; gap?: number; muted?: boolean } = {}) => {
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
      if (opts.gap) y += opts.gap;
    };

    // ----- Score-kort i rad -----
    ensureSpace(110);
    y = drawSectionHeader(doc, "Beräknade scores (0–100)", y, margin);
    y = drawScoreCards(
      doc,
      [
        { label: "Riktning", value: summary.direction, prev: summary.directionPrev },
        { label: "Belastning", value: summary.burden.value, color: PDF_COLORS.slate },
        { label: "Funktion", value: summary.fn },
        { label: "Återhämtning", value: summary.rec },
      ],
      y,
      margin,
    );
    if (!summary.burden.withWeekly) {
      writeLine("Belastningen beräknad utan PHQ-9/GAD-7 (ingen aktuell veckoskattning).", { muted: true, size: 9 });
    }

    // ----- Sammanfattningsblock: sömn / rörelse / journal / medicin -----
    // Trender via valens-modulen så pilriktning + tecken är konsekvent
    // med övriga appen (grön = förbättring oavsett om värdet stiger eller sjunker).
    const fmtTrend = (cur: number | null, prev: number | null, unit: string, metric: string) => {
      if (cur == null || prev == null) return undefined;
      const d = formatDelta(metric, prev, cur);
      const dir: "up" | "down" | "flat" = d.delta === 0 ? "flat" : d.tone === "good" ? "up" : "down";
      // OBS: dir följer förbättring (good=up) — inte råa siffran. Det matchar
      // hur PDF-läsaren vill tolka pilen ("åt rätt håll").
      return { dir, text: `${d.text}${unit} vs forra veckan` };
    };
    const fmtTrendInt = (cur: number, prev: number, unit: string, metric: string) => {
      const d = formatDelta(metric, prev, cur);
      const dir: "up" | "down" | "flat" = d.delta === 0 ? "flat" : d.tone === "good" ? "up" : "down";
      return { dir, text: `${d.text}${unit} vs forra veckan` };
    };
    const movementDays = summary.movementYes + summary.movementLittle;
    const movementDaysPrev = summary.movementYesPrev + summary.movementLittlePrev;
    const medsTotal = data.meds.filter((m) => m.active).length;

    ensureSpace(110);
    y = drawSectionHeader(doc, "Sammanfattning veckan", y, margin);
    y = drawSummaryBlock(
      doc,
      [
        {
          label: "Sömn",
          value: summary.sleepHours == null ? "—" : `${summary.sleepHours.toFixed(1)} h`,
          sub: `${summary.lowSleepNights} natt${summary.lowSleepNights === 1 ? "" : "er"} under 6 h · kvalitet ${summary.sleepQuality == null ? "—" : summary.sleepQuality.toFixed(1) + "/10"}`,
          trend: fmtTrend(summary.sleepHours, summary.sleepHoursPrev, " h", "sleep_hours"),
          color: PDF_COLORS.purple,
        },
        {
          label: "Rörelse",
          value: `${movementDays} / 7 dgr`,
          sub: `${summary.movementYes} full · ${summary.movementLittle} lite · ${summary.totalActMinutes} min loggat`,
          trend: fmtTrendInt(movementDays, movementDaysPrev, " dgr", "energy"),
          color: PDF_COLORS.green,
        },
        {
          label: "Journal",
          value: `${summary.journalCount} st`,
          sub: `${summary.journalDays} dag${summary.journalDays === 1 ? "" : "ar"} med anteckning · ${summary.meaningfulYes} meningsfull aktivitet`,
          color: PDF_COLORS.blue,
        },
        {
          label: "Medicin",
          value: summary.adherence == null ? "—" : `${summary.adherence}%`,
          sub: `${medsTotal} aktiv${medsTotal === 1 ? "" : "a"} · ${summary.sideEffects.length === 0 ? "inga biverkningar" : `${summary.sideEffects.length} biverkning${summary.sideEffects.length === 1 ? "" : "ar"}`}`,
          trend:
            summary.adherence != null && summary.adherencePrev != null
              ? fmtTrendInt(summary.adherence, summary.adherencePrev, " %", "medications_taken")
              : undefined,
          color: PDF_COLORS.amber,
        },
      ],
      y,
      margin,
    );

    // ----- Trender (7-dagars sparklines) -----
    ensureSpace(180);
    y = drawSectionHeader(doc, "Trender senaste 7 dagar", y, margin);
    const sleepRow = seriesFor(data.checkins, "sleep_hours");
    const anxRow = seriesFor(data.checkins, "anxiety");
    const moodRow = seriesFor(data.checkins, "mood_heaviness");
    const funcRow = seriesFor(data.checkins, "function_score");
    const energyRow = seriesFor(data.checkins, "energy");
    y = drawSparklineRows(
      doc,
      [
        { label: "Sömn (h)", values: sleepRow, domain: [0, 12], suffix: " h", color: PDF_COLORS.purple, threshold: { value: 6 } },
        { label: "Oro", values: anxRow, domain: [0, 10], suffix: "/10", color: PDF_COLORS.red, threshold: { value: 7 } },
        { label: "Tyngd", values: moodRow, domain: [0, 10], suffix: "/10", color: PDF_COLORS.slate },
        { label: "Funktion", values: funcRow, domain: [0, 10], suffix: "/10", color: PDF_COLORS.green },
        { label: "Energi", values: energyRow, domain: [0, 10], suffix: "/10", color: PDF_COLORS.amber },
      ],
      y,
      margin,
    );
    writeLine("Streckad amber-linje = klinisk tröskel (sömn < 6 h, oro ≥ 7).", { muted: true, size: 8 });

    // ----- Sömn-detaljer -----
    ensureSpace(80);
    y = drawSectionHeader(doc, "Sömn", y, margin);
    const lowSleepDays = summary.week.filter((c) => c.sleep_hours != null && Number(c.sleep_hours) < 6).length;
    writeLine(`Snittlängd: ${fmt(summary.sleepHours, " h")} · snittkvalitet: ${fmt(summary.sleepQuality, "/10")}`);
    writeLine(`Dagar med < 6 h sömn: ${lowSleepDays} av ${summary.week.length}`);

    // ----- Rörelse — veckopuls -----
    ensureSpace(80);
    y = drawSectionHeader(doc, "Rörelse & meningsfull aktivitet", y, margin);
    const dayDates = sevenDayDates();
    const dayLabels = sevenDayLabels();
    const moveByDate = new Map(summary.week.map((c) => [c.date, c.movement_today]));
    const meaningfulByDate = new Map(summary.week.map((c) => [c.date, c.meaningful_activity]));
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
    y = drawWeekDots(
      doc,
      dayDates.map((d, i) => {
        const m = meaningfulByDate.get(d);
        return { label: dayLabels[i], level: m === "yes" ? 2 : m === "some" ? 1 : 0 };
      }),
      y,
      margin,
      "Meningsfull aktivitet per dag",
    );
    writeLine(`Loggade aktiviteter: ${data.activities.length} st · ${summary.totalActMinutes} min totalt`);

    // ----- Mest hjälpsamma aktiviteter (h-bar) -----
    if (data.activities.length > 0) {
      const byLabel = new Map<string, { count: number; sumDelta: number }>();
      for (const a of data.activities) {
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

    // ----- Medicin -----
    ensureSpace(80);
    y = drawSectionHeader(doc, "Läkemedel", y, margin);
    if (data.meds.length === 0) writeLine("Inga registrerade läkemedel.");
    for (const med of data.meds) {
      writeLine(
        `• ${med.name}${med.dose ? ` ${med.dose}` : ""} · ${med.active ? "aktiv" : "avslutad"}${med.date_started ? ` (start ${med.date_started})` : ""}`,
      );
    }
    writeLine(`Följsamhet senaste veckan: ${summary.adherence !== null ? summary.adherence + " %" : "ej loggat"}`);
    writeLine(`Rapporterade biverkningar: ${summary.sideEffects.length ? summary.sideEffects.join(", ") : "inga"}`);

    // ----- Journal -----
    if (includeJournal) {
      ensureSpace(60);
      y = drawSectionHeader(doc, "Journal (utvalda anteckningar)", y, margin);
      if (data.journals.length === 0) {
        writeLine("Inga markerade anteckningar för perioden.");
      } else {
        for (const e of data.journals.slice(0, 8)) {
          writeLine(`${e.date} · ${e.template_type}${e.title ? ` · ${e.title}` : ""}`, { bold: true });
          if (e.free_text) writeLine(htmlToPreviewText(e.free_text, 280), { muted: true });
          y += 2;
        }
      }
    }

    // ----- Säkerhet -----
    ensureSpace(80);
    y = drawSectionHeader(doc, "Säkerhetssignaler", y, margin);
    const safetyTotal = summary.safety.passive + summary.safety.active + summary.safety.acute;
    if (safetyTotal === 0) {
      writeLine("Inga rapporterade säkerhetssignaler under perioden.", { muted: true });
    } else {
      y = drawHBarChart(
        doc,
        [
          { label: "Passiva dödstankar", value: summary.safety.passive, color: PDF_COLORS.amber },
          { label: "Aktiva tankar", value: summary.safety.active, color: PDF_COLORS.red },
          { label: "Akuta signaler", value: summary.safety.acute, color: PDF_COLORS.red },
        ],
        y,
        margin,
        { valueSuffix: " dgr" },
      );
    }

    // ----- Patientens frågor -----
    ensureSpace(80);
    y = drawSectionHeader(doc, "Patientens frågor till läkaren", y, margin);
    if (questions.length === 0) {
      writeLine("Inga frågor angivna.", { muted: true });
    } else {
      questions.forEach((q, i) => writeLine(`${i + 1}. ${q}`));
    }

    // ----- Tomma fält för läkaren -----
    ensureSpace(120);
    y = drawSectionHeader(doc, "Avsnitt för läkaren", y, margin);
    const blocks: { title: string; lines: number }[] = [
      { title: "Bedömning", lines: 4 },
      { title: "Plan & åtgärder", lines: 4 },
      { title: "Nästa steg / uppföljning", lines: 3 },
      { title: "Övriga noteringar", lines: 3 },
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

    // ----- Footer -----
    drawFooter(doc, "Riktning · Klinisk veckorapport", margin);

    doc.save(`riktning-veckorapport-${today}.pdf`);
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
    <AppShell wide>
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

      {data && (
        <SparseDataNotice
          daysWithCheckin={new Set(data.checkins.map((c) => c.date)).size}
          windowDays={14}
          threshold={7}
        />
      )}

      <div className="lg:grid lg:grid-cols-[1.5fr_1fr] lg:gap-10">
        <div className="space-y-0">
          {/* AI-veckosammanfattning visas också här som mjuk preamble — göms tyst utan AI. */}
          <WeeklyAIInsight minDays={3} />

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

        </div>

        <div className="space-y-0">
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

      {summary && summary.week.length < 3 && (
        <div className="card-cream p-4 mb-3 border-2 border-yellow-journal/40">
          <p className="text-sm font-extrabold mb-1">För lite data ännu</p>
          <p className="text-xs text-text-secondary leading-snug">
            Rapporten blir mer användbar efter några dagars loggning och minst en veckoskattning.
            Du kan ändå generera den om du vill.
          </p>
        </div>
      )}

      <Button
        onClick={generatePdf}
        className="w-full h-12 rounded-full bg-blue-calm hover:bg-blue-calm/90 text-white font-extrabold"
      >
        <FileDown size={16} className="mr-1" /> Skapa PDF
      </Button>
        </div>
      </div>
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
