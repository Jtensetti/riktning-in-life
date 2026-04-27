import { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { toneHsl, type ChartTone } from "@/lib/chartColors";
import { chartAnimation, chartLineActiveDot, chartMargins } from "@/lib/chartTheme";
import { useChartHeight } from "@/lib/useChartHeight";
import { AnimatedChart } from "./AnimatedChart";
import { ThemedGrid, ThemedTooltip, ThemedXAxis, ThemedYAxis } from "./ChartPrimitives";

export type TrendSeries = {
  key: string;
  label: string;
  tone: ChartTone;
  /** Värde per dag i kronologisk ordning. null = saknas. */
  values: (number | null)[];
  /** Skala-max så Y-axeln blir rimlig. Default 10. */
  max?: number;
};

interface Props {
  /** ISO-datumsträngar, samma längd som varje series.values. */
  dates: string[];
  series: TrendSeries[];
  /** Visa kompakt veckodag M T O T F L S. Default true. */
  showAxis?: boolean;
  height?: number;
}

const dayLetter = (iso: string): string => {
  const d = new Date(iso);
  const letters = ["S", "M", "T", "O", "T", "F", "L"];
  return letters[d.getDay()];
};

const fmtTooltipDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
};

/**
 * Mjuk monotone-area med tunna linjer i kategorifärger.
 * Visar 1–3 serier samtidigt utan att bli rörig.
 */
export const TrendLine = ({ dates, series, showAxis = true, height }: Props) => {
  const heights = useChartHeight();
  const resolvedHeight = height ?? heights.standard;
  const data = useMemo(() => {
    return dates.map((iso, i) => {
      const row: Record<string, string | number | null> = { date: iso, label: dayLetter(iso) };
      for (const s of series) row[s.key] = s.values[i] ?? null;
      return row;
    });
  }, [dates, series]);

  const yMax = Math.max(...series.map((s) => s.max ?? 10));

  let valueSum = 0;
  for (const s of series) for (const v of s.values) valueSum += v ?? 0;
  const sig = `${dates.length}|${dates[0] ?? ""}|${dates[dates.length - 1] ?? ""}|${series.map((s) => s.key).join(",")}|${valueSum}`;

  return (
    <AnimatedChart signature={sig}>
      <div style={{ height }} role="img" aria-label={`Trend för ${series.map((s) => s.label).join(", ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={chartMargins.area}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`area-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={toneHsl(s.tone)} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={toneHsl(s.tone)} stopOpacity={0.0} />
                </linearGradient>
              ))}
            </defs>
            <ThemedGrid />
            {showAxis && <ThemedXAxis weight="light" />}
            <ThemedYAxis hide domain={[0, yMax]} />
            <ThemedTooltip
              variant="line"
              labelFormatter={(_, payload) => {
                const iso = payload?.[0]?.payload?.date as string | undefined;
                return iso ? fmtTooltipDate(iso) : "";
              }}
              formatter={(value: number | string, name: string) => {
                const s = series.find((x) => x.key === name);
                return [value == null ? "—" : value, s?.label ?? name];
              }}
            />
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={toneHsl(s.tone)}
                strokeWidth={3}
                strokeLinecap="round"
                fill={`url(#area-${s.key})`}
                dot={false}
                activeDot={chartLineActiveDot(toneHsl(s.tone))}
                {...chartAnimation("line")}
                connectNulls
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AnimatedChart>
  );
};
