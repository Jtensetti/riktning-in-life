import { useMemo } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { chartTokens, toneHsl } from "@/lib/chartColors";
import {
  chartAnimation,
  chartHeights,
  chartLineActiveDot,
  chartLineDot,
  chartMargins,
} from "@/lib/chartTheme";
import { AnimatedChart, buildChartSignature } from "./AnimatedChart";
import { ThemedGrid, ThemedTooltip, ThemedXAxis, ThemedYAxis } from "./ChartPrimitives";

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
 * Använder samma tema-tokens som övriga ChartCard-diagram.
 */
export const WeekDirectionChart = ({ data, height = chartHeights.expanded }: Props) => {
  const rows = useMemo(() => data.map((p) => ({ ...p, label: dayLetter(p.date) })), [data]);
  const stroke = toneHsl("green");
  const sig = buildChartSignature(data);

  return (
    <AnimatedChart signature={sig}>
      <div style={{ height }} role="img" aria-label="Veckans riktning, sju dagar">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={chartMargins.lineWithY}>
            <defs>
              <linearGradient id="dir-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.85} />
                <stop offset="100%" stopColor={stroke} stopOpacity={1} />
              </linearGradient>
            </defs>
            <ThemedGrid />
            <ThemedXAxis weight="light" height={22} />
            <ThemedYAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} />
            <ThemedTooltip
              variant="line"
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
// kept chartTokens import for future axis customization parity
void chartTokens;
