// Single source of truth för diagram-tema:
// färger, padding/marginaler, axel/grid-stilar, tooltip-look, typografi och animationer.
// Alla chart-primitiver läser härifrån så att hela appen håller samma uttryck.

import type { CSSProperties } from "react";
import { chartTokens, prefersReducedMotion } from "./chartColors";

/** Standardhöjder per chart-typ — så kort i hela appen får samma rytm. */
export const chartHeights = {
  sparkline: 24,
  compact: 128, // små stapeldiagram
  standard: 160, // donut/stacked/activity
  expanded: 180, // linjer / trender med Y-axel
} as const;

/** Standard-margins per chart-typ. Y-axel skiftar vänsterkanten konsekvent. */
export const chartMargins = {
  bars: { top: 6, right: 0, bottom: 0, left: 0 },
  barsWithY: { top: 6, right: 0, bottom: 0, left: -8 },
  line: { top: 8, right: 12, bottom: 8, left: 0 },
  lineWithY: { top: 8, right: 12, bottom: 8, left: -8 },
  area: { top: 8, right: 8, bottom: 8, left: 0 },
} as const;

/** Bar-layout-konstanter. */
export const chartBarLayout = {
  categoryGap: "18%" as const,
  radiusTop: [14, 14, 4, 4] as [number, number, number, number],
  radiusFlat: [0, 0, 0, 0] as [number, number, number, number],
} as const;

/** Typografi för axel-tickar. Två varianter för X (kraftigare) vs Y (lättare). */
export const chartTypography = {
  xTick: { fill: chartTokens.axisText, fontSize: 11, fontWeight: 800, fontVariantNumeric: "tabular-nums" as const },
  xTickLight: { fill: chartTokens.axisText, fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums" as const },
  yTick: { fill: chartTokens.axisText, fontSize: 10, fontWeight: 700, fontVariantNumeric: "tabular-nums" as const },
} as const;

/** En enda gemensam tooltip-stil — skiftar bara radius om man vill. */
export const chartTooltipStyle = (variant: "bar" | "line" = "bar"): CSSProperties => ({
  borderRadius: variant === "line" ? 16 : 14,
  border: `1px solid ${chartTokens.tooltipBorder}`,
  background: chartTokens.tooltipBg,
  boxShadow: "0 8px 24px hsl(240 4% 19% / 0.08)",
  fontSize: 12,
  fontWeight: 700,
  padding: variant === "line" ? "8px 12px" : "6px 10px",
});

/** Cursor-stilar som matchar tooltip-typen. */
export const chartCursor = {
  bar: { fill: "transparent" as const },
  line: { stroke: chartTokens.gridStroke, strokeWidth: 1 },
} as const;

/** Standard grid-konfiguration (horisontellt streckat, mjukt). */
export const chartGrid = {
  stroke: chartTokens.gridStroke,
  strokeDasharray: "3 4",
  vertical: false as const,
} as const;

/** Animationsprofil — respekterar reduced-motion globalt. */
export const chartAnimation = (kind: "bar" | "line" | "donut" = "bar") => {
  const reduced = prefersReducedMotion();
  return {
    isAnimationActive: !reduced,
    animationDuration: kind === "bar" ? 650 : 700,
    animationEasing: "ease-out" as const,
  };
};

/** Standard-dot för linjer. Liten "ring" via tooltip-bg så den läses tydligt över linjen. */
export const chartLineDot = (color: string) => ({
  r: 5,
  strokeWidth: 2.5,
  stroke: chartTokens.tooltipBg,
  fill: color,
});

export const chartLineActiveDot = (color: string) => ({
  r: 7,
  strokeWidth: 2.5,
  stroke: chartTokens.tooltipBg,
  fill: color,
});
