import { useMemo } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { toneHsl, type ChartTone } from "@/lib/chartColors";
import {
  chartAnimation,
  chartLineActiveDot,
  chartLineDot,
  chartMargins,
} from "@/lib/chartTheme";
import { useChartHeight } from "@/lib/useChartHeight";
import { AnimatedChart, buildChartSignature } from "./AnimatedChart";
import { ThemedGrid, ThemedTooltip, ThemedXAxis, ThemedYAxis } from "./ChartPrimitives";

export type MetricLinePoint = {
  /** Visningsetikett på X-axeln (kort). */
  label: string;
  value: number | null;
  /** Frivillig nyckel för aria/tooltip-titel (t.ex. ISO-datum). */
  key?: string;
};

interface Props {
  data: MetricLinePoint[];
  tone?: ChartTone;
  height?: number;
  /** Y-domain. Default [0, 100]. */
  yMin?: number;
  yMax?: number;
  /** Y-axel-tickar. Default [0,25,50,75,100]. */
  yTicks?: number[];
  /** Format för värde i tooltip. */
  valueFormatter?: (v: number) => string;
  valueLabel?: string;
  /** Visa Y-axel. Default true. */
  showYAxis?: boolean;
  /** Tooltip-rubrik per punkt. Default = label. */
  labelFormatter?: (key: string | undefined, label: string) => string;
}

/**
 * Generisk single-line linje-primitiv för metric-kort.
 * - Synliga axlar (X alltid, Y valbar)
 * - Hover-tooltip med valbar formatter
 * - Smooth monotone, dot per punkt, tonad gradient-stroke
 */
export const MetricLine = ({
  data,
  tone = "green",
  height,
  yMin = 0,
  yMax = 100,
  yTicks = [0, 25, 50, 75, 100],
  valueFormatter = (v) => `${Math.round(v)}`,
  valueLabel = "Värde",
  showYAxis = true,
  labelFormatter,
}: Props) => {
  const heights = useChartHeight();
  const resolvedHeight = height ?? heights.expanded;
  const stroke = toneHsl(tone);
  const gradId = useMemo(() => `metric-line-${tone}-${Math.random().toString(36).slice(2, 7)}`, [tone]);
  const sig = buildChartSignature(data, tone);

  return (
    <AnimatedChart signature={sig}>
      <div style={{ height: resolvedHeight }} role="img" aria-label={valueLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={showYAxis ? chartMargins.lineWithY : chartMargins.line}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.85} />
                <stop offset="100%" stopColor={stroke} stopOpacity={1} />
              </linearGradient>
            </defs>
            <ThemedGrid />
            <ThemedXAxis weight="light" height={22} />
            <ThemedYAxis hide={!showYAxis} domain={[yMin, yMax]} ticks={showYAxis ? yTicks : undefined} />
            <ThemedTooltip
              variant="line"
              labelFormatter={(label, payload) => {
                const k = payload?.[0]?.payload?.key as string | undefined;
                return labelFormatter ? labelFormatter(k, String(label)) : String(label);
              }}
              formatter={(value) => [value == null ? "—" : valueFormatter(Number(value)), valueLabel]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={`url(#${gradId})`}
              strokeWidth={3.5}
              strokeLinecap="round"
              dot={chartLineDot(stroke)}
              activeDot={chartLineActiveDot(stroke)}
              {...chartAnimation("line")}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </AnimatedChart>
  );
};
