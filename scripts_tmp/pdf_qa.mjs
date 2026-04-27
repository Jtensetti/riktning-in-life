// Headless QA av drawReportHeader: ladda jsPDF, kalla widgeten och spara två PDF:er.
import { jsPDF } from "jspdf";
import { writeFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Vi kan inte importera TS direkt — kompilera med esbuild.
import { build } from "esbuild";

const result = await build({
  entryPoints: ["/dev-server/src/lib/pdfWidgets.ts"],
  bundle: true,
  format: "esm",
  platform: "neutral",
  external: ["jspdf"],
  write: false,
});
const code = result.outputFiles[0].text;
const dataUrl = "data:text/javascript;base64," + Buffer.from(code).toString("base64");
const widgets = await import(dataUrl);

const make = (title, meta) => {
  const doc = new jsPDF({ unit: widgets.PDF_PAGE.unit, format: widgets.PDF_PAGE.format });
  const y = widgets.drawReportHeader(
    doc,
    {
      title,
      subtitle: "Period 2026-04-21 – 2026-04-27 · 7 dagar",
      meta,
      metrics: [
        { label: "Återhämtning", value: "72/100" },
        { label: "Funktion", value: "65/100" },
        { label: "Belastning", value: "Låg" },
      ],
    },
    widgets.PDF_PAGE.margin,
  );
  // Lite brödtext under för att se att y-returvärdet ger luft.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Här börjar nästa sektion (verifiering av y-offset).", widgets.PDF_PAGE.margin, y);
  return doc.output("arraybuffer");
};

writeFileSync("/tmp/qa_short.pdf", Buffer.from(make("Klinisk veckorapport", "Genererad 2026-04-27")));
writeFileSync(
  "/tmp/qa_long.pdf",
  Buffer.from(
    make(
      "Sammanställd klinisk månadsrapport för uppföljning hos husläkare och rehabkoordinator",
      "Genererad 2026-04-27 · v.18",
    ),
  ),
);
console.log("OK — skrev /tmp/qa_short.pdf och /tmp/qa_long.pdf");
