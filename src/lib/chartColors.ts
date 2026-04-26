// Centraliserade färgtokens för diagram. Allt går genom hsl(var(--…))
// så vi automatiskt följer dark mode och eventuella temaändringar.

export type ChartTone = "orange" | "blue" | "yellow" | "purple" | "pink" | "green" | "neutral";

/** Returnerar full HSL-sträng för en kategori-färg eller tone-nyckel. */
export const toneHsl = (tone: ChartTone | string): string => {
  switch (tone) {
    case "orange": return "hsl(var(--orange-start))";
    case "blue": return "hsl(var(--blue-calm))";
    case "yellow": return "hsl(var(--yellow-journal))";
    case "purple": return "hsl(var(--purple-sleep))";
    case "pink": return "hsl(var(--pink-move))";
    case "green": return "hsl(var(--green-recovery))";
    case "neutral": return "hsl(var(--text-secondary))";
    default: return "hsl(var(--orange-start))";
  }
};

/** Bakgrundston (motsvarar bg-{tone}/15) för accentprickar och chips. */
export const toneSoftBg = (tone: ChartTone): string => {
  switch (tone) {
    case "orange": return "bg-orange-start/15";
    case "blue": return "bg-blue-calm/15";
    case "yellow": return "bg-yellow-journal/25";
    case "purple": return "bg-purple-sleep/15";
    case "pink": return "bg-pink-move/15";
    case "green": return "bg-green-recovery/15";
    case "neutral": return "bg-surface-alt";
  }
};

/** Vanliga axel/grid-färger så alla diagram delar samma mjuka uttryck. */
export const chartTokens = {
  axisText: "hsl(var(--text-secondary))",
  gridStroke: "hsl(var(--border-soft))",
  tooltipBg: "hsl(var(--surface))",
  tooltipBorder: "hsl(var(--border-soft))",
  emptyBar: "hsl(var(--border-soft))",
} as const;

/** Single source of truth för animationsbeteende. Respekterar reduced-motion. */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
};
