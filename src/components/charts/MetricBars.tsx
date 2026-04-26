import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toneHsl, chartTokens, prefersReducedMotion, type ChartTone } from "@/lib/chartColors";
import { AnimatedChart, buildChartSignature } from "./AnimatedChart";

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
  height = 128,
  emptyMin = 4,
  valueFormatter = (v) => `${v}`,
  valueLabel = "Värde",
  showYAxis = false,
  yMax,
}: Props) => {
  const reduced = prefersReducedMotion();

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
        <BarChart data={rows} margin={{ top: 6, right: 0, bottom: 0, left: showYAxis ? -8 : 0 }} barCategoryGap="22%">
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fill: chartTokens.axisText, fontSize: 11, fontWeight: 800 }}
            height={20}
          />
          {showYAxis ? (
            <YAxis
              domain={[0, computedMax]}
              tickLine={false}
              axisLine={false}
              width={28}
              tick={{ fill: chartTokens.axisText, fontSize: 10, fontWeight: 700 }}
            />
          ) : (
            <YAxis hide domain={[0, Math.max(computedMax, emptyMin * 4)]} />
          )}
          <Tooltip
            cursor={{ fill: "transparent" }}
            contentStyle={{
              borderRadius: 14,
              border: `1px solid ${chartTokens.tooltipBorder}`,
              background: chartTokens.tooltipBg,
              boxShadow: "0 8px 24px hsl(240 4% 19% / 0.08)",
              fontSize: 12,
              fontWeight: 700,
              padding: "6px 10px",
            }}
            formatter={(_, __, item) => {
              const d = item.payload as (typeof rows)[number];
              return [d.isEmpty ? "—" : valueFormatter(d.value), valueLabel];
            }}
          />
          <Bar
            dataKey="displayValue"
            radius={[12, 12, 4, 4]}
            isAnimationActive={!reduced}
            animationDuration={650}
            animationEasing="ease-out"
          >
            {rows.map((d, i) => (
              <Cell
                key={i}
                fill={d.isEmpty ? chartTokens.emptyBar : toneHsl(d.tone ?? defaultTone)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </AnimatedChart>
  );
};
