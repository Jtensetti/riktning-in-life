import { useMemo } from "react";
import { BarChart, Bar, ResponsiveContainer } from "recharts";
import { toneHsl, toneSoftBg, type ChartTone } from "@/lib/chartColors";
import { chartAnimation, chartBarLayout, chartMargins } from "@/lib/chartTheme";
import { useChartHeight } from "@/lib/useChartHeight";
import { AnimatedChart } from "./AnimatedChart";
import { ThemedTooltip, ThemedXAxis, ThemedYAxis } from "./ChartPrimitives";

export type RecoveryDay = {
  iso: string;
  /** Minuter per kategori. Tomma fält tolkas som 0. */
  sleep?: number;
  movement?: number;
  mood?: number;
  recovery?: number;
};

interface Props {
  data: RecoveryDay[];
  height?: number;
}

type SeriesDef = { key: keyof RecoveryDay; label: string; tone: ChartTone };

const SERIES: SeriesDef[] = [
  { key: "sleep", label: "Sömn", tone: "purple" },
  { key: "movement", label: "Rörelse", tone: "pink" },
  { key: "mood", label: "Mående", tone: "orange" },
  { key: "recovery", label: "Återhämtning", tone: "green" },
];

const dayLetter = (iso: string): string => {
  const d = new Date(iso);
  return ["S", "M", "T", "O", "T", "F", "L"][d.getDay()];
};

/**
 * Stacked stapel per dag som visar hur veckan fördelas mellan kategorier.
 * Legend som färgade pills under diagrammet — samma stil som QuickLogPills.
 */
export const StackedRecovery = ({ data, height }: Props) => {
  const heights = useChartHeight();
  const resolvedHeight = height ?? heights.standard;
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        label: dayLetter(d.iso),
        date: d.iso,
        sleep: d.sleep ?? 0,
        movement: d.movement ?? 0,
        mood: d.mood ?? 0,
        recovery: d.recovery ?? 0,
      })),
    [data],
  );

  const ariaLabel = "Veckans minuter fördelat på sömn, rörelse, mående och återhämtning";

  let sum = 0;
  for (const r of chartData) sum += r.sleep + r.movement + r.mood + r.recovery;
  const sig = `${chartData.length}|${chartData[0]?.date ?? ""}|${chartData[chartData.length - 1]?.date ?? ""}|${sum}`;

  return (
    <AnimatedChart signature={sig}>
      <div role="img" aria-label={ariaLabel}>
        <div style={{ height: resolvedHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={chartMargins.bars} barCategoryGap={chartBarLayout.categoryGap}>
              <ThemedXAxis />
              <ThemedYAxis hide />
              <ThemedTooltip
                variant="bar"
                formatter={(value: number, name: string) => {
                  const s = SERIES.find((x) => x.key === name);
                  return [`${value} min`, s?.label ?? name];
                }}
                labelFormatter={(_, payload) => {
                  const iso = payload?.[0]?.payload?.date as string | undefined;
                  if (!iso) return "";
                  return new Date(iso).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric" });
                }}
              />
              {SERIES.map((s, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === SERIES.length - 1;
                return (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    stackId="recovery"
                    fill={toneHsl(s.tone)}
                    radius={isLast ? [12, 12, 0, 0] : isFirst ? [0, 0, 4, 4] : chartBarLayout.radiusFlat}
                    {...chartAnimation("bar")}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex flex-wrap gap-1.5 mt-3" aria-hidden>
          {SERIES.map((s) => (
            <li
              key={s.key}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${toneSoftBg(s.tone)}`}
              style={{ color: toneHsl(s.tone) }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: toneHsl(s.tone) }} />
              {s.label}
            </li>
          ))}
        </ul>
      </div>
    </AnimatedChart>
  );
};
