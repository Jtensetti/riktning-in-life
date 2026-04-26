import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toneHsl, chartTokens, prefersReducedMotion } from "@/lib/chartColors";
import { AnimatedChart, buildChartSignature } from "./AnimatedChart";

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
}

const dayLetter = (iso: string): string => {
  const d = new Date(iso);
  return ["S", "M", "T", "O", "T", "F", "L"][d.getDay()];
};

/**
 * Stapeldiagram för aktiv tid per dag. Varje stapel färgas efter dominant aktivitet,
 * tomma dagar visas som ljus border-soft-stapel så raden känns balanserad.
 */
export const ActivityBars = ({ data, height = 128, emptyMin = 4 }: Props) => {
  const reduced = prefersReducedMotion();

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        day: dayLetter(d.iso),
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
  const sig = buildChartSignature(
    data.map((d) => ({ value: d.minutes, iso: d.iso })),
  );

  return (
    <AnimatedChart signature={sig}>
      <div style={{ height }} role="img" aria-label="Aktiv tid per dag senaste veckan">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 6, right: 0, bottom: 0, left: 0 }} barCategoryGap="22%">
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fill: chartTokens.axisText, fontSize: 11, fontWeight: 800 }}
            height={20}
          />
          <YAxis hide domain={[0, Math.max(maxMinutes, emptyMin * 4)]} />
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
              const d = item.payload as typeof chartData[number];
              return [d.isEmpty ? "Ingen logg" : `${d.minutes} min`, "Aktiv tid"];
            }}
            labelFormatter={(_, payload) => {
              const iso = payload?.[0]?.payload?.date as string | undefined;
              if (!iso) return "";
              return new Date(iso).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "short" });
            }}
          />
          <Bar
            dataKey="displayMin"
            radius={[12, 12, 4, 4]}
            isAnimationActive={!reduced}
            animationDuration={650}
            animationEasing="ease-out"
          >
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.isEmpty ? chartTokens.emptyBar : toneHsl(d.color)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
