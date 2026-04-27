import { useMemo } from "react";
import { BarChart, Bar, ResponsiveContainer, Cell } from "recharts";
import { toneHsl, chartTokens, type ChartTone } from "@/lib/chartColors";
import { chartAnimation, chartBarLayout, chartMargins } from "@/lib/chartTheme";
import { useChartHeight } from "@/lib/useChartHeight";
import { AnimatedChart, buildChartSignature } from "./AnimatedChart";
import { ThemedTooltip, ThemedXAxis, ThemedYAxis } from "./ChartPrimitives";

export type MetricBarPoint = {
  /** Visningsetikett (kort, t.ex. veckodag eller kategori). */
  label: string;
  value: number;
  /** Frivillig ton per stapel. Default: chartens defaultTone. */
  tone?: ChartTone | string;
  /** Frivillig nyckel för aria/sortering. */
  key?: string;
};

interface Props {
  data: MetricBarPoint[];
  /** Default-färg för staplar utan egen tone. */
  defaultTone?: ChartTone;
  height?: number;
  /** Minsta visuella stapel-höjd för 0-värden så raden får rytm. 0 = göm. */
  emptyMin?: number;
  /** Format för värde i tooltip. Default `${v}`. */
  valueFormatter?: (v: number) => string;
  /** Etikett i tooltip-rubriken (t.ex. "Aktiv tid"). */
  valueLabel?: string;
  /** Visa Y-axel med tickar. Default false. */
  showYAxis?: boolean;
  /** Y-domain. Default auto. */
  yMax?: number;
}

/**
 * Generisk stapel-primitiv. Återanvänds av metric-kort som vill visa
 * ett enkelt 5–10-värdes stapeldiagram med konsekventa axlar/tooltip.
 */
export const MetricBars = ({
  data,
  defaultTone = "orange",
  height,
  emptyMin = 4,
  valueFormatter = (v) => `${v}`,
  valueLabel = "Värde",
  showYAxis = false,
  yMax,
}: Props) => {
  const heights = useChartHeight();
  const resolvedHeight = height ?? heights.compact;
  const rows = useMemo(
    () =>
      data.map((d, i) => ({
        ...d,
        idx: i,
        displayValue: d.value === 0 ? emptyMin : d.value,
        isEmpty: d.value === 0,
      })),
    [data, emptyMin],
  );

  const computedMax = yMax ?? Math.max(1, ...data.map((d) => d.value));
  const sig = buildChartSignature(data, defaultTone);

  return (
    <AnimatedChart signature={sig}>
      <div style={{ height }} role="img" aria-label={valueLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={showYAxis ? chartMargins.barsWithY : chartMargins.bars}
            barCategoryGap={chartBarLayout.categoryGap}
          >
            <ThemedXAxis />
            <ThemedYAxis
              hide={!showYAxis}
              domain={showYAxis ? [0, computedMax] : [0, Math.max(computedMax, emptyMin * 4)]}
            />
            <ThemedTooltip
              variant="bar"
              formatter={(_, __, item) => {
                const d = item.payload as (typeof rows)[number];
                return [d.isEmpty ? "—" : valueFormatter(d.value), valueLabel];
              }}
            />
            <Bar dataKey="displayValue" radius={chartBarLayout.radiusTop} {...chartAnimation("bar")}>
              {rows.map((d, i) => (
                <Cell key={i} fill={d.isEmpty ? chartTokens.emptyBar : toneHsl(d.tone ?? defaultTone)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AnimatedChart>
  );
};
