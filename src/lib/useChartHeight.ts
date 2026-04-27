import { useIsMobile } from "@/hooks/use-mobile";
import { chartHeights } from "./chartTheme";

/**
 * useChartHeight — give every chart a desktop-friendly default height
 * without affecting mobile.
 *
 * The chart primitives (MetricLine, TrendLine, WeekDirectionChart, …) all
 * accept a `height` prop. When callers don't pass one, we used to fall back
 * to `chartHeights.expanded/standard/compact` which were tuned for a 448 px
 * mobile column. On desktop those numbers feel cramped because the chart
 * card is now ~700–1100 px wide.
 *
 * This hook returns the same shape as `chartHeights` but with bigger values
 * on `lg+` viewports. Charts call it once and pick the variant they need.
 */
export const useChartHeight = () => {
  const isMobile = useIsMobile();
  if (isMobile) return chartHeights;
  return {
    sparkline: 32,
    compact: 180,
    standard: 240,
    expanded: 280,
  } as const;
};
