import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Stilkontroll för app-illustrationer.
// Reglerna håller SVG:erna i linje med designsystemet:
//   – inga gradienter (vi använder platta toner + blobbar)
//   – inga filter (skuggor/blurs ska komma från Tailwind/CSS)
//   – inga hårdkodade hex-färger på child-paths (currentColor + design tokens)
//
// Tomma stroke-värden ("none") och referenser till <symbol>/<use> är ok.

const ILLUSTRATIONS_DIR = join(process.cwd(), "src/assets/illustrations");

const FORBIDDEN_TAGS = [
  "<linearGradient",
  "<radialGradient",
  "<filter",
  "<feGaussianBlur",
  "<feDropShadow",
  "<feColorMatrix",
];

// Matchar fill="#abc" eller stroke="#aabbcc" (3-, 4-, 6- eller 8-siffriga hex).
const HEX_FILL_OR_STROKE = /\b(?:fill|stroke)\s*=\s*"#(?:[0-9a-fA-F]{3,8})"/g;

// Matchar inline-style: fill:#abc; eller stroke:#aabbcc;
const HEX_INLINE_STYLE = /(?:fill|stroke)\s*:\s*#(?:[0-9a-fA-F]{3,8})/g;

const listSvgs = (): string[] => {
  try {
    return readdirSync(ILLUSTRATIONS_DIR).filter((f) => f.endsWith(".svg"));
  } catch {
    return [];
  }
};

describe("illustration style guard", () => {
  const files = listSvgs();

  it("hittar minst en illustration att kontrollera", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    describe(file, () => {
      const raw = readFileSync(join(ILLUSTRATIONS_DIR, file), "utf8");

      it("innehåller inga gradienter eller filter", () => {
        const found = FORBIDDEN_TAGS.filter((tag) => raw.includes(tag));
        expect(found, `Hittade förbjudna SVG-element: ${found.join(", ")}`).toEqual([]);
      });

      it("har inga hårdkodade hex-färger i fill/stroke-attribut", () => {
        const matches = raw.match(HEX_FILL_OR_STROKE) ?? [];
        expect(
          matches,
          `Hex-färger ska bytas mot currentColor eller design-token: ${matches.join(", ")}`,
        ).toEqual([]);
      });

      it("har inga hårdkodade hex-färger i inline style", () => {
        const matches = raw.match(HEX_INLINE_STYLE) ?? [];
        expect(
          matches,
          `Inline-style med hex ska bytas mot currentColor: ${matches.join(", ")}`,
        ).toEqual([]);
      });
    });
  }
});
