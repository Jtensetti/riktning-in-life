// Barrel-export för alla diagram-primitiver så metric-kort kan importera
// från en plats: `import { MetricBars, MetricLine, MetricDonut } from "@/components/charts";`

export { ChartCard } from "./ChartCard";
export { AnimatedChart, buildChartSignature } from "./AnimatedChart";
export { ThemedXAxis, ThemedYAxis, ThemedGrid, ThemedTooltip } from "./ChartPrimitives";

// Standardprimitiver — använd dessa i nya metric-kort.
export { MetricBars, type MetricBarPoint } from "./MetricBars";
export { MetricLine, type MetricLinePoint } from "./MetricLine";
export { MetricDonut, MetricPills, type MetricSlice } from "./MetricDonut";

// Specialiserade diagram (kvar för bakåtkompatibilitet).
export { ActivityBars, type ActivityBarPoint } from "./ActivityBars";
export { Sparkline } from "./Sparkline";
export { StackedRecovery, type RecoveryDay } from "./StackedRecovery";
export { TrendLine, type TrendSeries } from "./TrendLine";
export { WeekDirectionChart, type DirectionPoint } from "./WeekDirectionChart";
