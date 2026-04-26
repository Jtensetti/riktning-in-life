import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { toneHsl, chartTokens, prefersReducedMotion, type ChartTone } from "@/lib/chartColors";

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
export const TrendLine = ({ dates, series, showAxis = true, height = 160 }: Props) => {
  const reduced = prefersReducedMotion();

  const data = useMemo(() => {
    return dates.map((iso, i) => {
      const row: Record<string, string | number | null> = { date: iso, day: dayLetter(iso) };
      for (const s of series) row[s.key] = s.values[i] ?? null;
      return row;
    });
  }, [dates, series]);

  const yMax = Math.max(...series.map((s) => s.max ?? 10));

  return (
    <div style={{ height }} role="img" aria-label={`Trend för ${series.map((s) => s.label).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: showAxis ? 8 : 0, left: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`area-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={toneHsl(s.tone)} stopOpacity={0.18} />
                <stop offset="100%" stopColor={toneHsl(s.tone)} stopOpacity={0.0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={chartTokens.gridStroke} strokeDasharray="3 4" vertical={false} />
          {showAxis && (
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={{ fill: chartTokens.axisText, fontSize: 11, fontWeight: 700 }}
              height={20}
            />
          )}
          <YAxis hide domain={[0, yMax]} />
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
              activeDot={{ r: 5, strokeWidth: 2, stroke: chartTokens.tooltipBg, fill: toneHsl(s.tone) }}
              isAnimationActive={!reduced}
              animationDuration={700}
              animationEasing="ease-out"
              connectNulls
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
