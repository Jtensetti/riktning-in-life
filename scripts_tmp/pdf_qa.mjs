import { jsPDF } from "jspdf";
import { writeFileSync } from "node:fs";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";

const result = await build({
  entryPoints: ["/dev-server/src/lib/pdfWidgets.ts"],
  bundle: true,
  format: "esm",
  platform: "neutral",
  external: ["jspdf"],
  outfile: "/tmp/pdfWidgets.bundle.mjs",
});
const widgets = await import(pathToFileURL("/tmp/pdfWidgets.bundle.mjs").href);

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
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Här börjar nästa sektion (verifiering av y-offset).", widgets.PDF_PAGE.margin, y);
  return Buffer.from(doc.output("arraybuffer"));
};

writeFileSync("/tmp/qa_short.pdf", make("Klinisk veckorapport", "Genererad 2026-04-27"));
writeFileSync(
  "/tmp/qa_long.pdf",
  make(
    "Sammanställd klinisk månadsrapport för uppföljning hos husläkare och rehabkoordinator",
    "Genererad 2026-04-27 · v.18",
  ),
);
console.log("OK");
