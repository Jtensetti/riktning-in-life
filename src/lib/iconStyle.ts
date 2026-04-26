/**
 * Riktning Icon Style Guide
 * -------------------------
 * Centraliserad regellista för hur AbstractIcon-set ska se ut.
 * Importera dessa konstanter i nya ikoner istället för att hårdkoda värden,
 * så följer alla nya ikoner automatiskt samma designprofil.
 *
 * Filosofi (Headspace-vibe, mjuk geometri):
 * - Platt, fyllda former. Stroke endast när det behövs (linjer, cirklar utan kropp).
 * - Allt ritas i 32×32 viewBox och centreras kring 16,16.
 * - currentColor som default → ikonen ärver textfärg från sin container.
 * - Två-tons-ikoner får använda `accent` (default = `--yellow-journal`) för
 *   detaljer (skugga, sekundär form), aldrig för huvudkroppen.
 * - Inga gradienter, inga drop-shadows. Djup byggs av lager + opacity.
 */

/** Standardkanvas. Alla nya ikoner SKA rita inom detta viewBox. */
export const ICON_VIEWBOX = "0 0 32 32" as const;

/** Standardstorlekar (px) — använd via storleksskala, inte godtyckliga tal. */
export const ICON_SIZE = {
  xs: 16,
  sm: 20,
  md: 24, // default i AbstractIcon-komponenten är 28, motsvarar `md+`
  lg: 28,
  xl: 40,
  xxl: 56,
} as const;
export type IconSizeToken = keyof typeof ICON_SIZE;

/** Tillåtna stroke-bredder. Smala detaljer = 1.6, normala konturer = 2.2–2.4, accent ≤ 3.0. */
export const ICON_STROKE = {
  hair: 1.6,
  base: 2.2,
  bold: 2.4,
  accent: 2.6,
  max: 3.0,
} as const;

/** Linjeändar och hörn — alltid mjuka. */
export const ICON_LINECAP = "round" as const;
export const ICON_LINEJOIN = "round" as const;

/** Tillåtet opacity-spann för sekundära former (t.ex. accent-blob, glansprick). */
export const ICON_OPACITY = {
  min: 0.25,
  max: 0.85,
} as const;

/** Standardfärg-token. Ikoner ska ärva färg från sin förälder. */
export const ICON_DEFAULT_COLOR = "currentColor" as const;

/** Default accent (used for two-tone icons). */
export const ICON_DEFAULT_ACCENT = "hsl(var(--yellow-journal))" as const;

/**
 * Regellista — text-baserad checklist för designgranskning av nya ikoner.
 * Visa i Storybook/dokumentation eller använd som copy-paste till PR-mall.
 */
export const ICON_STYLE_RULES = [
  "Använd viewBox '0 0 32 32' och centrera motivet runt (16,16).",
  "Använd `currentColor` som primär fyllnad — färg sätts av föräldern.",
  "Tvåtonsikoner: huvudform i `color`, sekundär form i `accent` (default --yellow-journal).",
  "Stroke-bredd 1.6–3.0. Hårfin detalj 1.6, kontur 2.2–2.4, accent 2.6, max 3.0.",
  "Använd alltid strokeLinecap='round' och strokeLinejoin='round'.",
  "Inga gradienter, inga drop-shadows, inga filter — djup görs med opacity 0.25–0.85.",
  "Föredra fyllda former framför outline. Outline används bara när formen inte fungerar fylld.",
  "Storlekar väljs från ICON_SIZE-skalan (xs 16, sm 20, md 24, lg 28, xl 40, xxl 56).",
  "Ikonen ska kännas igen vid 16px — undvik detaljer mindre än 1.6 enheter.",
  "Vita kontraster (innuti fylld form) använder hsl(var(--surface)), aldrig #fff.",
] as const;

/**
 * Runtime-validering. Returnerar lista med varningar (tom = OK).
 * Används i dev-mode i AbstractIcon för att fånga avvikelser tidigt.
 *
 * Note: körs bara mot props vi kan inspektera utifrån, inte mot SVG-strängen.
 */
export interface IconStyleCheckInput {
  name: string;
  size: number;
  color: string;
}

export const validateIconStyle = ({ name, size, color }: IconStyleCheckInput): string[] => {
  const warnings: string[] = [];

  // Storlek måste ligga i ett rimligt spann (12–96).
  if (size < 12 || size > 96) {
    warnings.push(
      `Icon "${name}": storlek ${size}px utanför rekommenderat spann 12–96. Använd ICON_SIZE-tokens.`,
    );
  }

  // Storlek bör vara en av tokens (eller mycket nära). Mjuk varning.
  const known = Object.values(ICON_SIZE) as number[];
  if (!known.includes(size) && size !== 22 && size !== 28) {
    warnings.push(
      `Icon "${name}": storlek ${size}px matchar inte ICON_SIZE-skalan (${known.join(", ")}).`,
    );
  }

  // Hårdkodade hex-färger är förbjudna — vi vill ha currentColor eller HSL-token.
  if (/^#[0-9a-fA-F]{3,8}$/.test(color)) {
    warnings.push(
      `Icon "${name}": hårdkodad färg "${color}". Använd currentColor eller hsl(var(--token)).`,
    );
  }

  return warnings;
};
