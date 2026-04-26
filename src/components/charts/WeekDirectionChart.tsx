import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { chartTokens, prefersReducedMotion, toneHsl } from "@/lib/chartColors";
import { AnimatedChart, buildChartSignature } from "./AnimatedChart";

export type DirectionPoint = {
  /** ISO-datum (YYYY-MM-DD) i kronologisk ordning. */
  date: string;
  /** Riktning 0–100, högre = bättre. null = saknad data. */
  value: number | null;
};

interface Props {
  data: DirectionPoint[];
  height?: number;
}

const dayLetter = (iso: string): string => {
  const d = new Date(iso);
  return ["S", "M", "T", "O", "T", "F", "L"][d.getDay()];
};

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
};

/**
 * 7-dagars linjediagram för veckans Riktning (0–100).
 * - Recharts LineChart med synlig X- och Y-axel
 * - Hover-tooltip som visar dag + värde
 * - Använder samma tokens som övriga ChartCard-diagram
 */
export const WeekDirectionChart = ({ data, height = 180 }: Props) => {
  const reduced = prefersReducedMotion();

  const rows = useMemo(
    () => data.map((p) => ({ ...p, day: dayLetter(p.date) })),
    [data],
  );

  const stroke = toneHsl("green");

  const sig = buildChartSignature(data);

  return (
    <AnimatedChart signature={sig}>
      <div
        style={{ height }}
        role="img"
        aria-label="Veckans riktning, sju dagar"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 8, left: -8 }}>
          <defs>
            <linearGradient id="dir-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.85} />
              <stop offset="100%" stopColor={stroke} stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={chartTokens.gridStroke} strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fill: chartTokens.axisText, fontSize: 11, fontWeight: 700 }}
            height={22}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickLine={false}
            axisLine={false}
            width={28}
            tick={{ fill: chartTokens.axisText, fontSize: 10, fontWeight: 700 }}
          />
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
              return iso ? fmtDate(iso) : "";
            }}
            formatter={(value: number | string) => [
              value == null ? "—" : `${Math.round(Number(value))}/100`,
              "Riktning",
            ]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="url(#dir-line)"
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
    </AnimatedChart>
  );
};
