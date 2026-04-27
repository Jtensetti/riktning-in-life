import { jsPDF } from "jspdf";
import { writeFileSync } from "node:fs";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";

await build({
  entryPoints: ["/dev-server/src/lib/pdfWidgets.ts"],
  bundle: true, format: "esm", platform: "neutral",
  external: ["jspdf"], outfile: "/tmp/pdfWidgets.bundle.mjs",
});
const w = await import(pathToFileURL("/tmp/pdfWidgets.bundle.mjs").href);

const doc = new jsPDF({ unit: w.PDF_PAGE.unit, format: w.PDF_PAGE.format });
let y = w.drawReportHeader(doc, {
  title: "Klinisk veckorapport",
  subtitle: "Period 2026-04-21 – 2026-04-27 · 7 dagar",
  meta: "Genererad 2026-04-27",
}, w.PDF_PAGE.margin);

// 1. Standard summary-block (referens för matchning)
y = w.drawSectionHeader(doc, "Sammanfattning", y, w.PDF_PAGE.margin);
y = w.drawSummaryBlock(doc, [
  { label: "Återhämtning", value: "72/100", sub: "snitt 7 dagar", color: w.PDF_COLORS.green,
    trend: { dir: "up", text: "+4 mot förra", goodWhenUp: true } },
  { label: "Funktion", value: "65/100", sub: "snitt 7 dagar", color: w.PDF_COLORS.blue,
    trend: { dir: "flat", text: "stabilt" } },
  { label: "Sömn", value: "7,2 h", sub: "snitt", color: w.PDF_COLORS.purple,
    trend: { dir: "down", text: "-0,4h", goodWhenUp: true } },
], y, w.PDF_PAGE.margin);

// 2. Till läkaren-kortet
y = w.drawSectionHeader(doc, "Avsnitt för läkaren", y, w.PDF_PAGE.margin);
y = w.drawClinicianSummary(doc, {
  periodLabel: "Senaste 7 dagar",
  scores: [
    { label: "Funktion", value: 65, prev: 61, goodWhenUp: true },
    { label: "Återhämtning", value: 72, prev: 68, goodWhenUp: true },
    { label: "Belastning", value: 28, prev: 35, goodWhenUp: false },
  ],
  drivers: [
    "Sömnkvalitet förbättrad efter ny rutin",
    "Färre dagar med ångest > 6/10",
    "Något lägre rörelseintensitet jämfört med föregående vecka",
  ],
  safety: { passive: 0, active: 0, acute: 0 },
  daysWithData: 7, totalDays: 7,
}, y, w.PDF_PAGE.margin);

writeFileSync("/tmp/qa_clin.pdf", Buffer.from(doc.output("arraybuffer")));
console.log("OK");
