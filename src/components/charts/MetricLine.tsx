import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { toneHsl, chartTokens, prefersReducedMotion, type ChartTone } from "@/lib/chartColors";
import { AnimatedChart, buildChartSignature } from "./AnimatedChart";

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
  height = 180,
  yMin = 0,
  yMax = 100,
  yTicks = [0, 25, 50, 75, 100],
  valueFormatter = (v) => `${Math.round(v)}`,
  valueLabel = "Värde",
  showYAxis = true,
  labelFormatter,
}: Props) => {
  const reduced = prefersReducedMotion();
  const stroke = toneHsl(tone);
  const gradId = useMemo(() => `metric-line-${tone}-${Math.random().toString(36).slice(2, 7)}`, [tone]);
  const sig = buildChartSignature(data, tone);

  return (
    <AnimatedChart signature={sig}>
      <div style={{ height }} role="img" aria-label={valueLabel}>
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: showYAxis ? -8 : 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.85} />
              <stop offset="100%" stopColor={stroke} stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={chartTokens.gridStroke} strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fill: chartTokens.axisText, fontSize: 11, fontWeight: 700 }}
            height={22}
          />
          {showYAxis ? (
            <YAxis
              domain={[yMin, yMax]}
              ticks={yTicks}
              tickLine={false}
              axisLine={false}
              width={28}
              tick={{ fill: chartTokens.axisText, fontSize: 10, fontWeight: 700 }}
            />
          ) : (
            <YAxis hide domain={[yMin, yMax]} />
          )}
          <Tooltip
            cursor={{ stroke: chartTokens.gridStroke, strokeWidth: 1 }}
            contentStyle={{
              borderRadius: 16,
              border: `1px solid ${chartTokens.tooltipBorder}`,
              background: chartTokens.tooltipBg,
              boxShadow: "0 8px 24px hsl(240 4% 19% / 0.08)",
              fontSize: 12,
              fontWeight: 700,
              padding: "8px 12px",
            }}
            labelFormatter={(label, payload) => {
              const k = payload?.[0]?.payload?.key as string | undefined;
              return labelFormatter ? labelFormatter(k, String(label)) : String(label);
            }}
            formatter={(value) => [
              value == null ? "—" : valueFormatter(Number(value)),
              valueLabel,
            ]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={`url(#${gradId})`}
            strokeWidth={3}
            strokeLinecap="round"
            dot={{ r: 4, strokeWidth: 2, stroke: chartTokens.tooltipBg, fill: stroke }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: chartTokens.tooltipBg, fill: stroke }}
            isAnimationActive={!reduced}
            animationDuration={700}
            animationEasing="ease-out"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
