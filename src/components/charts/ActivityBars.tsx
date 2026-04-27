import { useMemo } from "react";
import { BarChart, Bar, ResponsiveContainer, Cell } from "recharts";
import { toneHsl, chartTokens } from "@/lib/chartColors";
import { chartAnimation, chartBarLayout, chartMargins } from "@/lib/chartTheme";
import { useChartHeight } from "@/lib/useChartHeight";
import { AnimatedChart, buildChartSignature } from "./AnimatedChart";
import { ThemedTooltip, ThemedXAxis, ThemedYAxis } from "./ChartPrimitives";

export type ActivityBarPoint = {
  /** ISO-datum YYYY-MM-DD */
  iso: string;
  minutes: number;
  /** Token "orange" | "blue" | … för dominant aktivitet den dagen. */
  color: string;
};

interface Props {
  data: ActivityBarPoint[];
  height?: number;
  /** Tom-stapel-höjd så raden alltid har visuell rytm. */
  emptyMin?: number;
  /** Etikett som visas i tooltip och aria-label (t.ex. "Rörelse", "Sömn"). */
  label?: string;
}

const dayLetter = (iso: string): string => {
  const d = new Date(iso);
  return ["S", "M", "T", "O", "T", "F", "L"][d.getDay()];
};

/**
 * Stapeldiagram för aktiv tid per dag. Varje stapel färgas efter dominant aktivitet,
 * tomma dagar visas som ljus border-soft-stapel så raden känns balanserad.
 */
export const ActivityBars = ({ data, height, emptyMin = 4, label = "Aktivitet" }: Props) => {
  const heights = useChartHeight();
  const resolvedHeight = height ?? heights.compact;
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        label: dayLetter(d.iso),
        date: d.iso,
        minutes: d.minutes,
        // Recharts skalar mot detta värde; vi visar det riktiga i tooltip.
        displayMin: d.minutes === 0 ? emptyMin : d.minutes,
        color: d.color,
        isEmpty: d.minutes === 0,
      })),
    [data, emptyMin],
  );

  const maxMinutes = Math.max(60, ...data.map((d) => d.minutes));
  const sig = buildChartSignature(data.map((d) => ({ value: d.minutes, iso: d.iso })));

  return (
    <AnimatedChart signature={sig}>
      <div style={{ height }} role="img" aria-label={`${label} per dag senaste veckan`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={chartMargins.bars} barCategoryGap={chartBarLayout.categoryGap}>
            <ThemedXAxis />
            <ThemedYAxis hide domain={[0, Math.max(maxMinutes, emptyMin * 4)]} />
            <ThemedTooltip
              variant="bar"
              formatter={(_, __, item) => {
                const d = item.payload as (typeof chartData)[number];
                return [d.isEmpty ? "Ingen logg" : `${d.minutes} min`, label];
              }}
              labelFormatter={(_, payload) => {
                const iso = payload?.[0]?.payload?.date as string | undefined;
                if (!iso) return "";
                return new Date(iso).toLocaleDateString("sv-SE", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                });
              }}
            />
            <Bar dataKey="displayMin" radius={chartBarLayout.radiusTop} {...chartAnimation("bar")}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.isEmpty ? chartTokens.emptyBar : toneHsl(d.color)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AnimatedChart>
  );
};
