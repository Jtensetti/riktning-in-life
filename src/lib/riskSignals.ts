/**
 * Deterministisk riskdetektor — hittar enkelt förklarbara varningssignaler
 * i användarens senaste data. Inga AI-anrop, inga gissningar.
 *
 * Varje signal har en uttrycklig regel som vi kan citera i UI:t. Inget
 * larmas utan tydligt evidensunderlag.
 */

import type { Checkin } from "./metrics";

export type RiskKind =
  | "hopelessness_rising"
  | "safety_concern_repeated"
  | "side_effects_severe"
  | "adherence_drop"
  | "data_gap";

export type RiskSeverity = "info" | "warn" | "alert";

export type RiskSignal = {
  kind: RiskKind;
  severity: RiskSeverity;
  /** Kort rubrik, en mening. */
  headline: string;
  /** Konkreta siffror som motiverar varför vi visar det. */
  evidence: string;
  /** Förslag på nästa steg — neutralt formulerat. */
  suggestion: string;
};

type MedLogLite = {
  date: string;
  taken_status: string;
  severity: number | null;
  side_effects_json: unknown;
};

const lastN = <T extends { date: string }>(rows: T[], n: number): T[] =>
  [...rows].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n);

const avg = (xs: number[]): number =>
  xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;

// ─────────────────────────────────────────────────────────────
// 1. Hopplöshet stiger (sista 7 d vs föregående 7 d)
// ─────────────────────────────────────────────────────────────
const detectHopelessness = (rows: Checkin[]): RiskSignal | null => {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7).map(r => r.hopelessness).filter((x): x is number => x != null);
  const prev = sorted.slice(-14, -7).map(r => r.hopelessness).filter((x): x is number => x != null);
  if (recent.length < 3 || prev.length < 3) return null;
  const a = avg(recent);
  const p = avg(prev);
  const diff = a - p;
  if (a < 5 || diff < 1.5) return null;
  return {
    kind: "hopelessness_rising",
    severity: a >= 7 ? "alert" : "warn",
    headline: "Hopplöshet har ökat senaste veckan",
    evidence: `Snittet är ${a.toFixed(1)}/10 senaste 7 dagarna — mot ${p.toFixed(1)}/10 veckan innan.`,
    suggestion: "Öppna krisplanen eller boka ett samtal med din vårdkontakt.",
  };
};

// ─────────────────────────────────────────────────────────────
// 2. Säkerhetsoro upprepad
// ─────────────────────────────────────────────────────────────
const detectSafety = (rows: Checkin[]): RiskSignal | null => {
  const recent = lastN(rows, 14);
  const concern = recent.filter(r => r.safety_status && r.safety_status !== "ok" && r.safety_status !== "stable");
  if (concern.length < 2) return null;
  return {
    kind: "safety_concern_repeated",
    severity: "alert",
    headline: "Du har markerat säkerhetsoro flera gånger",
    evidence: `${concern.length} av senaste ${recent.length} incheckningar har flaggats.`,
    suggestion: "Krisplanen är ett klick bort. Kontakta din vårdkontakt eller 112 om det brådskar.",
  };
};

// ─────────────────────────────────────────────────────────────
// 3. Svåra biverkningar
// ─────────────────────────────────────────────────────────────
const detectSideEffects = (medLogs: MedLogLite[]): RiskSignal | null => {
  const recent = lastN(medLogs, 14);
  const severe = recent.filter(l => (l.severity ?? 0) >= 4);
  const anyEffects = recent.filter(l => {
    const arr = Array.isArray(l.side_effects_json) ? l.side_effects_json : [];
    return arr.length > 0;
  });
  if (severe.length < 2 && anyEffects.length < 4) return null;
  const isSevere = severe.length >= 2;
  return {
    kind: "side_effects_severe",
    severity: isSevere ? "warn" : "info",
    headline: isSevere
      ? "Du har rapporterat svåra biverkningar"
      : "Biverkningar återkommer ofta",
    evidence: isSevere
      ? `${severe.length} loggar med svårighetsgrad 4+ senaste 14 dagarna.`
      : `Biverkningar registrerade ${anyEffects.length} av senaste 14 dagarna.`,
    suggestion: "Ta upp det vid nästa läkarkontakt — texten kan följa med i din rapport.",
  };
};

// ─────────────────────────────────────────────────────────────
// 4. Följsamhet sjunker
// ─────────────────────────────────────────────────────────────
const detectAdherence = (medLogs: MedLogLite[]): RiskSignal | null => {
  const sorted = [...medLogs].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7);
  const prev = sorted.slice(-14, -7);
  if (recent.length < 4 || prev.length < 4) return null;
  const rate = (g: MedLogLite[]) => g.filter(l => l.taken_status === "taken").length / g.length;
  const rRecent = rate(recent);
  const rPrev = rate(prev);
  if (rRecent >= 0.8) return null;
  if (rPrev - rRecent < 0.2) return null;
  return {
    kind: "adherence_drop",
    severity: rRecent < 0.5 ? "warn" : "info",
    headline: "Din medicinrutin har vacklat",
    evidence: `Senaste 7 dagar: ${Math.round(rRecent * 100)} % tagna doser — mot ${Math.round(rPrev * 100)} % veckan innan.`,
    suggestion: "Påminnelser i Vård-vyn kan hjälpa, eller en kort dialog med din läkare.",
  };
};

// ─────────────────────────────────────────────────────────────
// 5. Data gap — vi vet för lite för att se mönster
// ─────────────────────────────────────────────────────────────
const detectDataGap = (rows: Checkin[]): RiskSignal | null => {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const last14 = sorted.slice(-14);
  if (last14.length === 0) {
    return {
      kind: "data_gap",
      severity: "info",
      headline: "Vi behöver dina incheckningar för att se mönster",
      evidence: "Inga incheckningar de senaste 14 dagarna.",
      suggestion: "En kort morgon-incheckning räcker långt.",
    };
  }
  const today = new Date().toISOString().split("T")[0];
  const cutoff = new Date(Date.now() - 14 * 86_400_000).toISOString().split("T")[0];
  const days = new Set(last14.map(c => c.date));
  let count = 0;
  for (let i = 0; i < 14; i++) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().split("T")[0];
    if (d >= cutoff && d <= today && days.has(d)) count++;
  }
  if (count >= 7) return null;
  return {
    kind: "data_gap",
    severity: "info",
    headline: "Få incheckningar senaste två veckorna",
    evidence: `${count} av 14 dagar loggade — mönster och rekommendationer blir tunnare.`,
    suggestion: "En morgon-incheckning per dag ger snabbt mer underlag.",
  };
};

// ─────────────────────────────────────────────────────────────
// Publik API
// ─────────────────────────────────────────────────────────────

export type DetectRisksInput = {
  checkins: Checkin[];
  medLogs: MedLogLite[];
};

export const detectRisks = (input: DetectRisksInput): RiskSignal[] => {
  const out: RiskSignal[] = [];
  const s = detectSafety(input.checkins);
  if (s) out.push(s);
  const h = detectHopelessness(input.checkins);
  if (h) out.push(h);
  const se = detectSideEffects(input.medLogs);
  if (se) out.push(se);
  const a = detectAdherence(input.medLogs);
  if (a) out.push(a);
  const g = detectDataGap(input.checkins);
  if (g) out.push(g);

  // Sortera efter allvarsgrad: alert > warn > info
  const order: Record<RiskSeverity, number> = { alert: 0, warn: 1, info: 2 };
  out.sort((x, y) => order[x.severity] - order[y.severity]);
  return out;
};
