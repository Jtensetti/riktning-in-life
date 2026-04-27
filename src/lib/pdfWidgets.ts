// Visuella widgets för kliniska PDF-rapporter (jsPDF).
//
// Designspråk: matchar Riktning-appen — lugn cream-bakgrund, mjuka radier
// (12pt), tunna vänsteraccent-linjer, fokus på vita kort och en handfull
// identitetsfärger (blue-calm för struktur, green-recovery för funktion,
// orange-start för aktivitet, purple-sleep för sömn). Ingen visuell ångest.
//
// jsPDF förstår inte HSL eller CSS-tokens, så våra app-färger är översatta
// till manuella RGB-trippel. Värdena hålls i synk med index.css. Cream-bandet
// används sparsamt (header, "Till läkaren") så A4:n förblir utskriftsekonomisk
// och dokumentet känns lika lugnt som appen.

import type jsPDF from "jspdf";

/* ---------- Färgpalett (RGB, översatt från --tokens i index.css) ---------- */
export const PDF_COLORS = {
  // Neutralt
  ink: [46, 46, 50] as const,           // --foreground
  inkSoft: [110, 102, 92] as const,     // mjukare brödtext
  inkMuted: [148, 138, 128] as const,   // metainfo, eyebrow
  rule: [232, 225, 217] as const,       // --border-soft
  surface: [255, 253, 249] as const,    // --surface (off-white)
  cream: [250, 247, 242] as const,      // --background — bara header/cream-band
  creamCard: [247, 240, 236] as const,  // --cream-card — sub-band
  surfaceAlt: [243, 238, 234] as const, // --surface-alt — bakgrund staplar
  // Identitetsfärger — exakt från appens palett
  blue: [31, 122, 242] as const,        // --blue-calm — vård/struktur (primär PDF-accent)
  green: [7, 148, 91] as const,         // --green-recovery — funktion/återhämtning
  amber: [255, 201, 40] as const,       // --yellow-journal — varning mild/sömn-tröskel
  red: [214, 69, 69] as const,          // --red-risk — säkerhet
  purple: [86, 51, 158] as const,       // --purple-sleep ljusare för läsbarhet
  pink: [198, 83, 154] as const,        // --pink-move
  orange: [255, 107, 26] as const,      // --orange-start — aktivitet
  // Mjuka tonade fyllningar (för area under sparklines)
  blueSoft: [225, 236, 253] as const,
  greenSoft: [220, 240, 230] as const,
  orangeSoft: [255, 232, 218] as const,
  purpleSoft: [232, 225, 246] as const,
  pinkSoft: [246, 225, 238] as const,
  amberSoft: [255, 243, 215] as const,
} as const;

export type RGB = readonly [number, number, number];

/* ---------- Hjälp ---------- */
const setFill = (doc: jsPDF, c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
const setDraw = (doc: jsPDF, c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
const setText = (doc: jsPDF, c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
export const setPdfText = setText;
export const setPdfFill = setFill;
export const setPdfDraw = setDraw;

/** Mjuk version av en accentfärg för area-fyllning. Matchas heuristiskt. */
const softVariant = (c: RGB): RGB => {
  if (c === PDF_COLORS.blue) return PDF_COLORS.blueSoft;
  if (c === PDF_COLORS.green) return PDF_COLORS.greenSoft;
  if (c === PDF_COLORS.orange) return PDF_COLORS.orangeSoft;
  if (c === PDF_COLORS.purple) return PDF_COLORS.purpleSoft;
  if (c === PDF_COLORS.pink) return PDF_COLORS.pinkSoft;
  if (c === PDF_COLORS.amber) return PDF_COLORS.amberSoft;
  return PDF_COLORS.surfaceAlt;
};

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
 * Heltäckande header-band överst på sidan. Cream-bakgrund som speglar
 * appens "calm stream" — wordmark vänster, datum/period höger, valfria
 * KPI:er på en delad rad under. Tunn blå accentlinje längst ner gör
 * övergången till vit canvas mjuk.
 */
export const drawReportHeader = (
  doc: jsPDF,
  opts: ReportHeaderOpts,
  margin: number,
): number => {
  const pageW = doc.internal.pageSize.getWidth();
  const hasMetrics = !!opts.metrics?.length;
  const h = hasMetrics ? 124 : 92;

  // Cream-band
  setFill(doc, PDF_COLORS.cream);
  doc.rect(0, 0, pageW, h, "F");

  // Wordmark "Riktning" — diskret eyebrow ovanför titeln
  setText(doc, PDF_COLORS.blue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("RIKTNING", margin, 26);

  // Liten markörprick efter wordmark — speglar appens identitetspunkter
  setFill(doc, PDF_COLORS.orange);
  doc.circle(margin + doc.getTextWidth("RIKTNING") + 6, 23, 1.6, "F");

  // Titel
  setText(doc, PDF_COLORS.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(opts.title, margin, 50);

  // Subtitel
  if (opts.subtitle) {
    setText(doc, PDF_COLORS.inkSoft);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(opts.subtitle, margin, 66);
  }

  // Meta (höger)
  if (opts.meta) {
    setText(doc, PDF_COLORS.inkMuted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(opts.meta, pageW - margin, 26, { align: "right" });
  }

  // KPI-rad
  if (hasMetrics) {
    const slotW = (pageW - margin * 2) / opts.metrics!.length;
    const baseY = 88;
    opts.metrics!.forEach((m, i) => {
      const x = margin + slotW * i;
      // Liten accentprick före etikett
      setFill(doc, PDF_COLORS.blue);
      doc.circle(x + 2, baseY - 2, 1.2, "F");

      setText(doc, PDF_COLORS.inkMuted);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(m.label.toUpperCase(), x + 8, baseY);
      setText(doc, PDF_COLORS.ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(m.value, x, baseY + 18);
    });
  }

  // Tunn separator i botten av cream-bandet
  setDraw(doc, PDF_COLORS.rule);
  doc.setLineWidth(0.4);
  doc.line(0, h, pageW, h);

  setText(doc, PDF_COLORS.ink);
  return h + 22;
};

/* ---------- Sektionsrubrik ---------- */
/**
 * Sektionsrubrik med en kort vertikal markör i blue-calm istället för
 * heltäckande linje. Ger lugnare rytm och mer luft mellan sektionerna.
 */
export const drawSectionHeader = (
  doc: jsPDF,
  title: string,
  y: number,
  margin: number,
): number => {
  const headerY = y + 14;

  // Vertikal markör (3pt bred, 10pt hög) — appens vänsteraccent översatt
  setFill(doc, PDF_COLORS.blue);
  doc.roundedRect(margin, headerY - 9, 2.5, 11, 1, 1, "F");

  setText(doc, PDF_COLORS.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title, margin + 8, headerY);

  return headerY + 14;
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
 * 2–4 score-kort i en rad. Varje kort har en cirkulär progress-ring
 * i stället för platt stapel — speglar appens StreakRing och känns
 * mer "Riktning" än "klinisk dashboard". Returnerar nytt `y`.
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
  const cardH = 96;

  cards.forEach((c, i) => {
    const x = margin + (cardW + gap) * i;

    // Vit kort-bakgrund med tunn ram
    setFill(doc, PDF_COLORS.surface);
    setDraw(doc, PDF_COLORS.rule);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, cardW, cardH, 8, 8, "FD");

    const color = c.color ?? colorForScore(c.value);

    // Ring uppe till höger (sektionscirkel) — visar score visuellt
    const ringR = 18;
    const ringCx = x + cardW - ringR - 12;
    const ringCy = y + cardH / 2;
    // Spår
    setDraw(doc, PDF_COLORS.surfaceAlt);
    doc.setLineWidth(3);
    doc.circle(ringCx, ringCy, ringR, "S");
    // Aktiv båge — jsPDF saknar arc, så vi simulerar med en ring av prickar
    if (c.value != null) {
      const pct = norm100(c.value);
      const segments = Math.max(1, Math.round(60 * pct));
      setFill(doc, color);
      for (let s = 0; s < segments; s++) {
        const t = (s / 60) * Math.PI * 2 - Math.PI / 2;
        const px = ringCx + Math.cos(t) * ringR;
        const py = ringCy + Math.sin(t) * ringR;
        doc.circle(px, py, 1.5, "F");
      }
    }

    // Label
    setText(doc, PDF_COLORS.inkMuted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(c.label.toUpperCase(), x + 14, y + 22);

    // Värde
    setText(doc, PDF_COLORS.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    const valueText = c.value == null ? "—" : `${Math.round(c.value)}`;
    doc.text(valueText, x + 14, y + 54);

    // Suffix
    if (c.value != null) {
      const valueW = doc.getTextWidth(valueText);
      setText(doc, PDF_COLORS.inkMuted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(c.suffix ?? "/100", x + 16 + valueW, y + 54);
    }

    // Delta
    if (c.value != null && c.prev != null) {
      const d = Math.round(c.value - c.prev);
      const sym = d > 0 ? "+" : d < 0 ? "−" : "=";
      const txt = d === 0 ? "oforandrat" : `${sym}${Math.abs(d)} mot forra`;
      setText(doc, d === 0 ? PDF_COLORS.inkMuted : d > 0 ? PDF_COLORS.green : PDF_COLORS.red);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(txt, x + 14, y + 72);
    }
  });

  setText(doc, PDF_COLORS.ink);
  return y + cardH + 16;
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
 * Lista med sparklines, en per rad. Linje + mjukt fyllt area-band
 * under linjen, samma uttryck som appens chart-uppgradering. Returnerar
 * nytt `y`.
 */
export const drawSparklineRows = (
  doc: jsPDF,
  rows: SparklineRow[],
  y: number,
  margin: number,
): number => {
  const pageW = doc.internal.pageSize.getWidth();
  const rowH = 36;
  const labelW = 90;
  const valueW = 64;
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
    setDraw(doc, PDF_COLORS.rule);
    doc.setLineWidth(0.4);
    doc.roundedRect(chartX, y + 4, chartW, rowH - 8, 4, 4, "FD");

    const [d0, d1] = row.domain;
    const span = d1 - d0 || 1;
    const n = row.values.length;

    if (n > 1 && row.values.some((v) => v != null)) {
      const color = row.color ?? PDF_COLORS.blue;
      const stepX = (chartW - 8) / (n - 1);
      const yTop = y + 6;
      const yBot = y + rowH - 6;

      const pointFor = (v: number) => yBot - ((v - d0) / span) * (yBot - yTop);

      // Tröskellinje (streckad)
      if (row.threshold) {
        const ty = pointFor(row.threshold.value);
        setDraw(doc, PDF_COLORS.amber);
        doc.setLineWidth(0.5);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(chartX + 4, ty, chartX + chartW - 4, ty);
        doc.setLineDashPattern([], 0);
      }

      // Area-fyllning under linjen — bygg sammanhängande segment och
      // rita varje segment som en serie tunna vertikala linjer för att
      // simulera fyllning (jsPDF saknar polygon-fill med transparens).
      const soft = softVariant(color);
      setDraw(doc, soft);
      doc.setLineWidth(1.2);
      const points: { x: number; y: number }[] = [];
      row.values.forEach((v, i) => {
        if (v == null) return;
        points.push({ x: chartX + 4 + stepX * i, y: pointFor(v) });
      });
      // Rita area: för varje par av punkter, fyll trapets med vertikala linjer
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        const steps = Math.max(2, Math.round(b.x - a.x));
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const px = a.x + (b.x - a.x) * t;
          const py = a.y + (b.y - a.y) * t;
          doc.line(px, py, px, yBot);
        }
      }

      // Linje ovanpå
      setDraw(doc, color);
      doc.setLineWidth(1.4);
      let prev: { x: number; y: number } | null = null;
      row.values.forEach((v, i) => {
        if (v == null) {
          prev = null;
          return;
        }
        const px = chartX + 4 + stepX * i;
        const py = pointFor(v);
        if (prev) doc.line(prev.x, prev.y, px, py);
        prev = { x: px, y: py };
      });

      // Punkter — vit ring runt för "stansad" känsla
      row.values.forEach((v, i) => {
        if (v == null) return;
        const px = chartX + 4 + stepX * i;
        const py = pointFor(v);
        setFill(doc, PDF_COLORS.surface);
        doc.circle(px, py, 2.0, "F");
        setFill(doc, color);
        doc.circle(px, py, 1.3, "F");
      });
    } else {
      setText(doc, PDF_COLORS.inkMuted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("ej tillräcklig data", chartX + 8, cy + 2);
    }

    // Senaste värdet till höger
    const last = [...row.values].reverse().find((v) => v != null) ?? null;
    setText(doc, PDF_COLORS.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const text =
      last == null ? "—" : `${Math.round(last * 10) / 10}${row.suffix ?? ""}`;
    doc.text(text, pageW - margin, cy + 4, { align: "right" });

    y += rowH;
  });

  setText(doc, PDF_COLORS.ink);
  return y + 8;
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
  const labelW = opts.labelW ?? 140;
  const rowH = 22;
  const valueW = 46;
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
    doc.roundedRect(barX, y + 6, barW, rowH - 12, 3, 3, "F");

    // Värde
    const w = (d.value / max) * barW;
    setFill(doc, d.color ?? opts.color ?? PDF_COLORS.blue);
    doc.roundedRect(barX, y + 6, Math.max(2, w), rowH - 12, 3, 3, "F");

    // Värdetext
    setText(doc, PDF_COLORS.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${d.value}${opts.valueSuffix ?? ""}`, pageW - margin, cy + 3, {
      align: "right",
    });

    y += rowH;
  });

  setText(doc, PDF_COLORS.ink);
  return y + 8;
};

/* ---------- Veckans rörelse — 7 punkter ---------- */
export interface DayDot {
  label: string; // "Mån"
  level: 0 | 1 | 2; // 0=ingen, 1=lite, 2=full
}

/**
 * Veckopuls — rad med soft-cirklar, fylld bakgrund för varje slot.
 * Speglar appens "DayHighlightCards"-rytm. Aktiva dagar får grönt fyll,
 * milda dagar får orange (matchar app-paletten).
 */
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

  // Eyebrow
  setText(doc, PDF_COLORS.inkMuted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(title.toUpperCase(), margin, y);
  y += 14;

  // Bakgrundsband
  setFill(doc, PDF_COLORS.surface);
  setDraw(doc, PDF_COLORS.rule);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, w, 36, 6, 6, "FD");

  data.forEach((d, i) => {
    const cx = margin + slot * i + slot / 2;
    const color =
      d.level === 2 ? PDF_COLORS.green : d.level === 1 ? PDF_COLORS.orange : PDF_COLORS.surfaceAlt;
    // Mjuk halo
    if (d.level > 0) {
      setFill(doc, softVariant(color));
      doc.circle(cx, y + 16, 9, "F");
    }
    setFill(doc, color);
    const r = d.level === 0 ? 3.5 : d.level === 1 ? 5 : 6;
    doc.circle(cx, y + 16, r, "F");
    setText(doc, PDF_COLORS.inkMuted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(d.label, cx, y + 32, { align: "center" });
  });

  setText(doc, PDF_COLORS.ink);
  return y + 44;
};

/* ---------- Sammanfattningsblock ---------- */
export interface SummaryTile {
  label: string;
  value: string;
  sub?: string;
  trend?: { dir: "up" | "down" | "flat"; text: string; goodWhenUp?: boolean };
  color?: RGB;
}

/**
 * Fyrdelat sammanfattningsblock — vita kort med tunn ram + en liten
 * färgad accentprick uppe vänster. Mjukare än vänsterstripen, mer
 * "Riktning"-känsla. Returnerar nytt `y`.
 */
export const drawSummaryBlock = (
  doc: jsPDF,
  tiles: SummaryTile[],
  y: number,
  margin: number,
): number => {
  const pageW = doc.internal.pageSize.getWidth();
  const gap = 10;
  const totalW = pageW - margin * 2;
  const tileW = (totalW - gap * (tiles.length - 1)) / tiles.length;
  const tileH = 100;

  tiles.forEach((t, i) => {
    const x = margin + (tileW + gap) * i;
    const color = t.color ?? PDF_COLORS.blue;

    // Vit kort med tunn ram
    setFill(doc, PDF_COLORS.surface);
    setDraw(doc, PDF_COLORS.rule);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, tileW, tileH, 8, 8, "FD");

    // Accentprick + halo uppe vänster
    setFill(doc, softVariant(color));
    doc.circle(x + 18, y + 18, 9, "F");
    setFill(doc, color);
    doc.circle(x + 18, y + 18, 4, "F");

    // Etikett
    setText(doc, PDF_COLORS.inkMuted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(t.label.toUpperCase(), x + 32, y + 16);

    // Sub-rad
    if (t.sub) {
      setText(doc, PDF_COLORS.inkSoft);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const sub = doc.splitTextToSize(t.sub, tileW - 44)[0] ?? t.sub;
      doc.text(sub, x + 32, y + 26);
    }

    // Huvudvärde — stort och lugnt
    setText(doc, PDF_COLORS.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(t.value, x + 14, y + 62);

    // Trend
    if (t.trend) {
      const goodUp = t.trend.goodWhenUp ?? true;
      const arrow = t.trend.dir === "up" ? "↑" : t.trend.dir === "down" ? "↓" : "·";
      const isPositive =
        t.trend.dir === "flat"
          ? null
          : (t.trend.dir === "up" && goodUp) || (t.trend.dir === "down" && !goodUp);
      const trendColor =
        isPositive === null
          ? PDF_COLORS.inkMuted
          : isPositive
            ? PDF_COLORS.green
            : PDF_COLORS.red;
      setText(doc, trendColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      const txt = doc.splitTextToSize(`${arrow} ${t.trend.text}`, tileW - 28)[0] ?? t.trend.text;
      doc.text(txt, x + 14, y + tileH - 14);
    }
  });

  setText(doc, PDF_COLORS.ink);
  return y + tileH + 16;
};

/* ---------- Till läkaren – auto-genererad sammanfattning ---------- */
export interface ClinicianScore {
  label: string;
  value: number | null;
  prev?: number | null;
  goodWhenUp?: boolean;
}

export interface ClinicianSummaryInput {
  periodLabel: string;
  scores: ClinicianScore[];
  drivers: string[];
  safety?: { passive: number; active: number; acute: number };
  daysWithData?: number;
  totalDays?: number;
}

/**
 * "Till läkaren" — kompakt narrativ sammanfattning. Cream-bakgrund med
 * tunn vänsteraccent, samma uttryck som appens kortmodul. Säkerhetsraden
 * får egen mjuk röd-band så den syns även i utskrift.
 */
export const drawClinicianSummary = (
  doc: jsPDF,
  input: ClinicianSummaryInput,
  y: number,
  margin: number,
): number => {
  const pageW = doc.internal.pageSize.getWidth();
  const w = pageW - margin * 2;

  const padX = 18;
  const padY = 16;
  const startY = y;

  // ---- Mät innehåll först för exakt höjd ----
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const driverLines: string[] = [];
  const driversToShow = input.drivers.slice(0, 5);
  driversToShow.forEach((d) => {
    const wrapped = doc.splitTextToSize(`•  ${d}`, w - padX * 2 - 8);
    driverLines.push(...wrapped);
  });

  const fmtDelta = (cur: number | null, prev: number | null | undefined, goodUp = true) => {
    if (cur == null || prev == null) return "";
    const diff = cur - prev;
    if (Math.abs(diff) < 0.5) return " (stabil)";
    const arrow = diff > 0 ? "↑" : "↓";
    const positive = (diff > 0 && goodUp) || (diff < 0 && !goodUp);
    const sign = diff > 0 ? "+" : "";
    return ` (${arrow} ${sign}${Math.round(diff)} ${positive ? "förbättring" : "försämring"})`;
  };
  const narrative = input.scores
    .filter((s) => s.value != null)
    .map((s) => `${s.label}: ${Math.round(s.value as number)}/100${fmtDelta(s.value, s.prev, s.goodWhenUp ?? true)}`)
    .join("    ");
  const narrativeLines = narrative
    ? doc.splitTextToSize(narrative, w - padX * 2)
    : ["Inte tillräckligt med data för att beräkna scores."];

  const safetyTotal =
    (input.safety?.passive ?? 0) + (input.safety?.active ?? 0) + (input.safety?.acute ?? 0);
  const hasSafety = safetyTotal > 0;
  const dataCoverage =
    input.daysWithData != null && input.totalDays != null
      ? `Underlag: ${input.daysWithData}/${input.totalDays} dagar med checkin (${input.periodLabel}).`
      : `Underlag: ${input.periodLabel}.`;

  const driversBlockH = driversToShow.length > 0 ? 18 + driverLines.length * 12 + 6 : 0;
  const safetyH = hasSafety ? 26 : 0;
  const totalH =
    padY + 22 + 10 + narrativeLines.length * 12 + 10 + driversBlockH + safetyH + 16 + padY;

  // ---- Måla bakgrund i cream för varm "anteckning"-känsla ----
  setFill(doc, PDF_COLORS.cream);
  setDraw(doc, PDF_COLORS.rule);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, startY, w, totalH, 10, 10, "FD");
  // Vänsteraccent (blue-calm) — tunn och hög
  setFill(doc, PDF_COLORS.blue);
  doc.roundedRect(margin, startY, 3, totalH, 1.5, 1.5, "F");

  // ---- Eyebrow + rubrik ----
  setText(doc, PDF_COLORS.blue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("AUTO-SAMMANFATTNING", margin + padX, startY + padY + 4);

  setText(doc, PDF_COLORS.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Till läkaren", margin + padX, startY + padY + 18);

  setText(doc, PDF_COLORS.inkMuted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(input.periodLabel, pageW - margin - padX, startY + padY + 18, { align: "right" });

  let cursor = startY + padY + 36;

  // ---- Narrativ scoretext ----
  setText(doc, PDF_COLORS.ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  narrativeLines.forEach((ln: string) => {
    doc.text(ln, margin + padX, cursor);
    cursor += 12;
  });
  cursor += 6;

  // ---- Drivare ----
  if (driversToShow.length > 0) {
    setText(doc, PDF_COLORS.inkMuted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("VIKTIGASTE BIDRAGANDE FAKTORER", margin + padX, cursor);
    cursor += 12;
    setText(doc, PDF_COLORS.ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    driverLines.forEach((ln) => {
      doc.text(ln, margin + padX, cursor);
      cursor += 12;
    });
    cursor += 6;
  }

  // ---- Säkerhetsband ----
  if (hasSafety) {
    const bandH = 18;
    setFill(doc, [253, 235, 235]); // mjuk röd
    doc.roundedRect(margin + padX - 6, cursor - 12, w - padX * 2 + 12, bandH, 4, 4, "F");
    setFill(doc, PDF_COLORS.red);
    doc.circle(margin + padX, cursor - 3, 2, "F");
    setText(doc, PDF_COLORS.red);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const parts: string[] = [];
    if (input.safety!.acute > 0) parts.push(`${input.safety!.acute} dgr akuta signaler`);
    if (input.safety!.active > 0) parts.push(`${input.safety!.active} dgr aktiva tankar`);
    if (input.safety!.passive > 0) parts.push(`${input.safety!.passive} dgr passiva dödstankar`);
    doc.text(`Säkerhet: ${parts.join("  ·  ")}`, margin + padX + 8, cursor);
    cursor += bandH + 4;
  }

  // ---- Underlagsrad ----
  setText(doc, PDF_COLORS.inkMuted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(dataCoverage, margin + padX, cursor);

  setText(doc, PDF_COLORS.ink);
  return startY + totalH + 16;
};

/* ---------- Sidnumrering & footer ---------- */
/**
 * Sidfot med tunn separator, wordmark vänster och sidnumrering höger.
 * Speglar appens lugna minimalism.
 */
export const drawFooter = (doc: jsPDF, footerText: string, margin: number) => {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    // Tunn separator
    setDraw(doc, PDF_COLORS.rule);
    doc.setLineWidth(0.4);
    doc.line(margin, pageH - 36, pageW - margin, pageH - 36);

    // Liten orange identitetsprick
    setFill(doc, PDF_COLORS.orange);
    doc.circle(margin + 2, pageH - 24, 1.4, "F");

    setText(doc, PDF_COLORS.inkMuted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(footerText, margin + 8, pageH - 22);

    // Sidnumrering 01 / 02 — paddat med nollor för rytm
    const pad = (n: number) => String(n).padStart(2, "0");
    doc.text(`${pad(i)} / ${pad(total)}`, pageW - margin, pageH - 22, { align: "right" });
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
