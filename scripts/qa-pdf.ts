// Visuell QA av PDF-rapportlayouten — kör samma widgets som Vard/WeeklyReport
// med plausibel testdata och skriver till /tmp/qa-report.pdf.
import { jsPDF } from "jspdf";
import {
  PDF_COLORS,
  drawReportHeader,
  drawSectionHeader,
  drawScoreCards,
  drawSparklineRows,
  drawHBarChart,
  drawWeekDots,
  drawSummaryBlock,
  drawClinicianSummary,
  drawFooter,
  sevenDayLabels,
} from "../src/lib/pdfWidgets";
import { writeFileSync } from "node:fs";

const doc = new jsPDF({ unit: "pt", format: "a4" });
const margin = 36;
const days = sevenDayLabels();

let y = drawReportHeader(
  doc,
  {
    title: "Klinisk veckorapport",
    subtitle: "Sammanställning för läkare eller psykolog",
    meta: "Genererad 2026-04-27",
    metrics: [
      { label: "Period", value: "7 dagar" },
      { label: "Check-ins", value: "6 / 7" },
      { label: "Loggade aktiviteter", value: "14" },
    ],
  },
  margin,
);

y = drawClinicianSummary(
  doc,
  {
    periodLabel: "senaste 7 dagar",
    scores: [
      { label: "Funktion", value: 62, prev: 54 },
      { label: "Återhämtning", value: 71, prev: 68 },
      { label: "Stabilitet", value: 58, prev: 60 },
      { label: "Belastning", value: 38, prev: 46, goodWhenUp: false },
    ],
    drivers: [
      "Promenader 4 dagar — koppling till förbättrad funktion (+8)",
      "Sömn under 6 h tre nätter — sannolik drivare av belastningstoppen",
      "Sociala möten två dagar — koppling till positiv mood-delta",
      "Medicin missad en kväll — ingen tydlig effekt på följande dag",
    ],
    safety: { passive: 1, active: 0, acute: 0 },
    daysWithData: 6,
    totalDays: 7,
  },
  y,
  margin,
);

y = drawSectionHeader(doc, "Beräknade scores (0–100)", y, margin);
y = drawScoreCards(
  doc,
  [
    { label: "Funktion", value: 62, prev: 54 },
    { label: "Återhämtning", value: 71, prev: 68 },
    { label: "Stabilitet", value: 58, prev: 60, color: PDF_COLORS.purple },
    { label: "Belastning", value: 38, prev: 46, color: PDF_COLORS.orange },
  ],
  y,
  margin,
);

y = drawSectionHeader(doc, "Sammanfattning veckan", y, margin);
y = drawSummaryBlock(
  doc,
  [
    { label: "Sömn", value: "6,8 h", sub: "snitt · 7 nätter", trend: { dir: "up", text: "+0,4 h vs förra" }, color: PDF_COLORS.purple },
    { label: "Rörelse", value: "5 dgr", sub: "av 7", trend: { dir: "up", text: "+1 dag" }, color: PDF_COLORS.pink },
    { label: "Journal", value: "4", sub: "anteckningar", trend: { dir: "flat", text: "oförändrat" }, color: PDF_COLORS.amber },
    { label: "Medicin", value: "92%", sub: "tagen i tid", trend: { dir: "down", text: "−4 procentenheter", goodWhenUp: true }, color: PDF_COLORS.blue },
  ],
  y,
  margin,
);

y = drawSectionHeader(doc, "Trender senaste 7 dagar", y, margin);
y = drawSparklineRows(
  doc,
  [
    { label: "Mående", values: [4, 5, 5, 6, 7, 6, 7], domain: [0, 10], suffix: "/10", color: PDF_COLORS.green },
    { label: "Oro", values: [7, 6, 6, 5, 4, 5, 4], domain: [0, 10], suffix: "/10", color: PDF_COLORS.orange },
    { label: "Energi", values: [3, 4, 5, 5, 6, 6, 7], domain: [0, 10], suffix: "/10", color: PDF_COLORS.blue },
    { label: "Sömn", values: [5.5, 6, 5, 7, 6.5, 7.5, 7], domain: [0, 12], suffix: " h", color: PDF_COLORS.purple, threshold: { value: 6 } },
  ],
  y,
  margin,
);

y = drawSectionHeader(doc, "Rörelse senaste 7 dagar", y, margin);
y = drawWeekDots(
  doc,
  days.map((d, i) => ({ label: d, level: ([0, 1, 2, 2, 1, 2, 2][i] as 0 | 1 | 2) })),
  y,
  margin,
  "Dagar med rörelse",
);

y = drawSectionHeader(doc, "Mest loggade aktiviteter", y, margin);
y = drawHBarChart(
  doc,
  [
    { label: "Promenad", value: 4, color: PDF_COLORS.pink },
    { label: "Andningsövning", value: 3, color: PDF_COLORS.blue },
    { label: "Måltid med någon", value: 2, color: PDF_COLORS.orange },
    { label: "Läsning", value: 2, color: PDF_COLORS.purple },
  ],
  y,
  margin,
);

drawFooter(doc, "Riktning · Klinisk veckorapport", margin);

writeFileSync("/tmp/qa-report.pdf", Buffer.from(doc.output("arraybuffer")));
console.log("OK");
