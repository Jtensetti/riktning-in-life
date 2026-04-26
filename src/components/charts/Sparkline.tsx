import { useMemo } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { toneHsl, prefersReducedMotion, type ChartTone } from "@/lib/chartColors";

interface Props {
  values: (number | null)[];
  tone?: ChartTone;
  width?: number;
  height?: number;
}

/**
 * Pyttelitet trendmått-grafem. Visar form, inte exakta siffror.
 * Inga axlar, inga tooltips — bara en mjuk linje + slutpunkt.
 */
export const Sparkline = ({ values, tone = "orange", width = 64, height = 24 }: Props) => {
  const reduced = prefersReducedMotion();
  const data = useMemo(
    () =>
      values.map((v, i) => ({
        i,
        v: v ?? null,
      })),
    [values],
  );

  // Behöver minst två datapunkter för att rita meningsfullt.
  const validCount = values.filter((v) => v != null).length;
  if (validCount < 2) {
    return (
      <div
        aria-hidden
        className="rounded-full bg-white/30"
        style={{ width, height: 4, marginTop: (height - 4) / 2, marginBottom: (height - 4) / 2 }}
      />
    );
  }

  const color = toneHsl(tone);

  return (
    <div style={{ width, height }} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={false}
            isAnimationActive={!reduced}
            animationDuration={650}
            animationEasing="ease-out"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
