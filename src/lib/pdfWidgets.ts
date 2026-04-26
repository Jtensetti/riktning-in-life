// Visuella widgets för kliniska PDF-rapporter (jsPDF).
// Ren, lugn och rapport-tydlig stil — inga gradienter, mjuka gråtoner,
// HSL-värden manuellt översatta till RGB-trippel eftersom jsPDF inte
// förstår HSL/CSS-tokens.

import type jsPDF from "jspdf";

/* ---------- Färgpalett (RGB) ---------- */
// Höll oss till en lugn, klinisk palett. Om vi senare vill matcha temat
// exakt kan vi mappa CSS-tokens via getComputedStyle vid genereringstid.
export const PDF_COLORS = {
  ink: [30, 30, 36] as const,
  inkSoft: [90, 90, 100] as const,
  inkMuted: [140, 140, 150] as const,
  rule: [220, 222, 228] as const,
  surface: [248, 248, 250] as const,
  surfaceAlt: [240, 241, 245] as const,
  // Färgade staplar/punkter — semantiska
  blue: [88, 134, 196] as const,        // Riktning, neutralt positivt
  green: [108, 168, 132] as const,      // Funktion / återhämtning bra
  amber: [220, 168, 92] as const,       // Varning mild
  red: [200, 96, 96] as const,          // Risk, akut
  purple: [140, 124, 188] as const,     // Sömn
  slate: [110, 124, 140] as const,      // Stabilitet
} as const;

export type RGB = readonly [number, number, number];

/* ---------- Hjälp ---------- */
const setFill = (doc: jsPDF, c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
const setDraw = (doc: jsPDF, c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
const setText = (doc: jsPDF, c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
export const setPdfText = setText;
export const setPdfFill = setFill;
export const setPdfDraw = setDraw;

/** Klampa 0..1 från ett 0..100-värde. */
const norm100 = (v: number | null) => (v == null ? 0 : Math.max(0, Math.min(1, v / 100)));

/** Färg utifrån score (högre = bättre). */
export const colorForScore = (v: number | null): RGB => {
  if (v == null) return PDF_COLORS.inkMuted;
  if (v >= 70) return PDF_COLORS.green;
  if (v >= 40) return PDF_COLORS.amber;
  return PDF_COLORS.red;
};

/* ---------- Header-band ---------- */
export interface ReportHeaderOpts {
  title: string;
  subtitle?: string;
  /** Liten meta-rad, t.ex. "Genererad 2025-04-26". */
  meta?: string;
  /** 0..3 nyckeltal som visas inuti headern. */
  metrics?: { label: string; value: string }[];
}

/**
 * Heltäckande header-band överst på sidan. Returnerar nytt `y` efter bandet.
 */
export const drawReportHeader = (
  doc: jsPDF,
  opts: ReportHeaderOpts,
  margin: number,
): number => {
  const pageW = doc.internal.pageSize.getWidth();
  const h = opts.metrics?.length ? 96 : 70;
  setFill(doc, PDF_COLORS.surfaceAlt);
  doc.rect(0, 0, pageW, h, "F");

  // Vänster vertikal accentlinje
  setFill(doc, PDF_COLORS.blue);
  doc.rect(0, 0, 4, h, "F");

  setText(doc, PDF_COLORS.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(opts.title, margin, 32);

  if (opts.subtitle) {
    setText(doc, PDF_COLORS.inkSoft);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(opts.subtitle, margin, 50);
  }
  if (opts.meta) {
    setText(doc, PDF_COLORS.inkMuted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(opts.meta, pageW - margin, 32, { align: "right" });
  }

  if (opts.metrics?.length) {
    const slotW = (pageW - margin * 2) / opts.metrics.length;
    opts.metrics.forEach((m, i) => {
      const x = margin + slotW * i;
      setText(doc, PDF_COLORS.inkMuted);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(m.label.toUpperCase(), x, 70);
      setText(doc, PDF_COLORS.ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(m.value, x, 88);
    });
  }

  setText(doc, PDF_COLORS.ink);
  return h + 18;
};

/* ---------- Sektionsrubrik ---------- */
export const drawSectionHeader = (
  doc: jsPDF,
  title: string,
  y: number,
  margin: number,
): number => {
  const pageW = doc.internal.pageSize.getWidth();
  setDraw(doc, PDF_COLORS.rule);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 16;
  setText(doc, PDF_COLORS.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, margin, y);
  return y + 10;
};

/* ---------- Score-kort i rad ---------- */
export interface ScoreCard {
  label: string;
  value: number | null;
  /** Föregående periods värde — visar delta. */
  prev?: number | null;
  /** Suffix, default "/100". */
  suffix?: string;
  /** Tvinga färg (annars baseras på värdet). */
  color?: RGB;
}

/**
 * 2–4 score-kort i en rad. Varje kort har stor siffra, etikett och en
 * mjuk progress-bar. Returnerar nytt `y`.
 */
export const drawScoreCards = (
  doc: jsPDF,
  cards: ScoreCard[],
  y: number,
  margin: number,
): number => {
  const pageW = doc.internal.pageSize.getWidth();
  const gap = 10;
  const totalW = pageW - margin * 2;
  const cardW = (totalW - gap * (cards.length - 1)) / cards.length;
  const cardH = 78;

  cards.forEach((c, i) => {
    const x = margin + (cardW + gap) * i;
    // Bakgrund
    setFill(doc, PDF_COLORS.surface);
    doc.roundedRect(x, y, cardW, cardH, 6, 6, "F");

    const color = c.color ?? colorForScore(c.value);
    // Top accentlinje
    setFill(doc, color);
    doc.roundedRect(x, y, cardW, 3, 1.5, 1.5, "F");

    // Etikett
    setText(doc, PDF_COLORS.inkMuted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(c.label.toUpperCase(), x + 10, y + 18);

    // Stor värdetext
    setText(doc, PDF_COLORS.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    const valueText = c.value == null ? "—" : `${Math.round(c.value)}`;
    doc.text(valueText, x + 10, y + 42);

    // Suffix
    if (c.value != null) {
      setText(doc, PDF_COLORS.inkSoft);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const suffix = c.suffix ?? "/100";
      const valueW = doc.getTextWidth(valueText);
      doc.text(suffix, x + 10 + valueW + 3, y + 42);
    }

    // Delta
    if (c.value != null && c.prev != null) {
      const d = Math.round(c.value - c.prev);
      const sym = d > 0 ? "▲" : d < 0 ? "▼" : "·";
      const txt = d === 0 ? "oförändrat" : `${sym} ${Math.abs(d)} mot förra`;
      setText(doc, d === 0 ? PDF_COLORS.inkMuted : d > 0 ? PDF_COLORS.green : PDF_COLORS.red);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(txt, x + 10, y + 56);
    }

    // Mini progress-bar
    const barX = x + 10;
    const barY = y + cardH - 14;
    const barW = cardW - 20;
    setFill(doc, PDF_COLORS.surfaceAlt);
    doc.roundedRect(barX, barY, barW, 4, 2, 2, "F");
    if (c.value != null) {
      setFill(doc, color);
      doc.roundedRect(barX, barY, barW * norm100(c.value), 4, 2, 2, "F");
    }
  });

  setText(doc, PDF_COLORS.ink);
  return y + cardH + 14;
};

/* ---------- Sparkline ---------- */
export interface SparklineRow {
  label: string;
  values: (number | null)[];
  /** Domän [min, max] att skala mot. */
  domain: [number, number];
  /** Suffix för aktuellt värde, t.ex. " h" eller "/10". */
  suffix?: string;
  color?: RGB;
  /** Tröskel som visas som streckad linje (t.ex. "kort sömn"). */
  threshold?: { value: number; label?: string };
}

/**
 * Lista med sparklines, en per rad. Visar etikett, mini-graf och
 * dagens värde. Returnerar nytt `y`.
 */
export const drawSparklineRows = (
  doc: jsPDF,
  rows: SparklineRow[],
  y: number,
  margin: number,
): number => {
  const pageW = doc.internal.pageSize.getWidth();
  const rowH = 32;
  const labelW = 80;
  const valueW = 60;
  const chartX = margin + labelW;
  const chartW = pageW - margin * 2 - labelW - valueW;

  rows.forEach((row) => {
    const cy = y + rowH / 2;
    // Etikett
    setText(doc, PDF_COLORS.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(row.label, margin, cy + 3);

    // Diagrambakgrund
    setFill(doc, PDF_COLORS.surface);
    doc.roundedRect(chartX, y + 4, chartW, rowH - 8, 3, 3, "F");

    const [d0, d1] = row.domain;
    const span = d1 - d0 || 1;
    const n = row.values.length;
    if (n > 1) {
      // Tröskellinje (streckad)
      if (row.threshold) {
        const ty = y + rowH - 4 - ((row.threshold.value - d0) / span) * (rowH - 8);
        setDraw(doc, PDF_COLORS.amber);
        doc.setLineWidth(0.5);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(chartX + 4, ty, chartX + chartW - 4, ty);
        doc.setLineDashPattern([], 0);
      }

      // Linje
      const color = row.color ?? PDF_COLORS.blue;
      setDraw(doc, color);
      doc.setLineWidth(1.2);
      const stepX = (chartW - 8) / (n - 1);
      let prevX: number | null = null;
      let prevY: number | null = null;
      row.values.forEach((v, i) => {
        if (v == null) {
          prevX = null;
          prevY = null;
          return;
        }
        const px = chartX + 4 + stepX * i;
        const py = y + rowH - 4 - ((v - d0) / span) * (rowH - 8);
        if (prevX != null && prevY != null) doc.line(prevX, prevY, px, py);
        prevX = px;
        prevY = py;
      });

      // Punkter
      setFill(doc, color);
      row.values.forEach((v, i) => {
        if (v == null) return;
        const px = chartX + 4 + stepX * i;
        const py = y + rowH - 4 - ((v - d0) / span) * (rowH - 8);
        doc.circle(px, py, 1.4, "F");
      });
    } else {
      setText(doc, PDF_COLORS.inkMuted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("ej tillräcklig data", chartX + 6, cy + 2);
    }

    // Senaste värdet till höger
    const last = [...row.values].reverse().find((v) => v != null) ?? null;
    setText(doc, PDF_COLORS.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const text =
      last == null ? "—" : `${Math.round(last * 10) / 10}${row.suffix ?? ""}`;
    doc.text(text, pageW - margin, cy + 3, { align: "right" });

    y += rowH;
  });

  setText(doc, PDF_COLORS.ink);
  return y + 6;
};

/* ---------- Mini-stapeldiagram ---------- */
export interface BarDatum {
  label: string;
  value: number;
  /** Per-bar-färg (annars singel-färg). */
  color?: RGB;
}

/**
 * Horisontellt mini-stapeldiagram. Värdena normaliseras mot maxvärdet.
 * Bra för "Mest loggade aktiviteter", "Drivare", osv.
 */
export const drawHBarChart = (
  doc: jsPDF,
  data: BarDatum[],
  y: number,
  margin: number,
  opts: { color?: RGB; valueSuffix?: string; labelW?: number } = {},
): number => {
  if (data.length === 0) return y;
  const pageW = doc.internal.pageSize.getWidth();
  const labelW = opts.labelW ?? 130;
  const rowH = 18;
  const valueW = 42;
  const barX = margin + labelW;
  const barW = pageW - margin * 2 - labelW - valueW;
  const max = Math.max(...data.map((d) => d.value), 1);

  data.forEach((d) => {
    const cy = y + rowH / 2;
    setText(doc, PDF_COLORS.ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lbl = doc.splitTextToSize(d.label, labelW - 8)[0];
    doc.text(lbl, margin, cy + 3);

    // Bakgrund
    setFill(doc, PDF_COLORS.surfaceAlt);
    doc.roundedRect(barX, y + 4, barW, rowH - 8, 2, 2, "F");

    // Värde
    const w = (d.value / max) * barW;
    setFill(doc, d.color ?? opts.color ?? PDF_COLORS.blue);
    doc.roundedRect(barX, y + 4, Math.max(2, w), rowH - 8, 2, 2, "F");

    // Värdetext
    setText(doc, PDF_COLORS.inkSoft);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${d.value}${opts.valueSuffix ?? ""}`, pageW - margin, cy + 3, {
      align: "right",
    });

    y += rowH;
  });

  setText(doc, PDF_COLORS.ink);
  return y + 6;
};

/* ---------- Veckans rörelse — 7 punkter ---------- */
export interface DayDot {
  label: string; // "Mån"
  level: 0 | 1 | 2; // 0=ingen, 1=lite, 2=full
}

/** Liten "veckopuls" som en rad cirklar — bra för rörelse / meningsfull aktivitet. */
export const drawWeekDots = (
  doc: jsPDF,
  data: DayDot[],
  y: number,
  margin: number,
  title: string,
): number => {
  const pageW = doc.internal.pageSize.getWidth();
  const w = pageW - margin * 2;
  const slot = w / data.length;

  setText(doc, PDF_COLORS.inkMuted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(title.toUpperCase(), margin, y);
  y += 14;

  data.forEach((d, i) => {
    const cx = margin + slot * i + slot / 2;
    const color =
      d.level === 2 ? PDF_COLORS.green : d.level === 1 ? PDF_COLORS.amber : PDF_COLORS.surfaceAlt;
    setFill(doc, color);
    const r = d.level === 0 ? 4 : d.level === 1 ? 5 : 6;
    doc.circle(cx, y + 8, r, "F");
    setText(doc, PDF_COLORS.inkMuted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(d.label, cx, y + 24, { align: "center" });
  });

  setText(doc, PDF_COLORS.ink);
  return y + 32;
};

/* ---------- Sidnumrering & footer ---------- */
export const drawFooter = (doc: jsPDF, footerText: string, margin: number) => {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    setText(doc, PDF_COLORS.inkMuted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(footerText, margin, pageH - 22);
    doc.text(`Sida ${i} / ${total}`, pageW - margin, pageH - 22, { align: "right" });
  }
  setText(doc, PDF_COLORS.ink);
};

/* ---------- Serie-bygge från check-ins ---------- */
export const sevenDayLabels = (): string[] => {
  const out: string[] = [];
  const wk = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(wk[d.getDay()]);
  }
  return out;
};

export const sevenDayDates = (): string[] => {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().split("T")[0]);
  }
  return out;
};

/** Plocka serie ur en lista av check-ins, fyll luckor med null. */
export const seriesFor = <T extends { date: string }>(
  rows: T[],
  field: keyof T,
): (number | null)[] => {
  const dates = sevenDayDates();
  const map = new Map(rows.map((r) => [r.date, r]));
  return dates.map((d) => {
    const r = map.get(d);
    if (!r) return null;
    const v = r[field];
    return typeof v === "number" ? v : v == null ? null : Number(v);
  });
};
