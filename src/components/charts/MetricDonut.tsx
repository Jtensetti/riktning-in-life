import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { toneHsl, toneSoftBg, type ChartTone } from "@/lib/chartColors";
import { chartAnimation } from "@/lib/chartTheme";
import { useChartHeight } from "@/lib/useChartHeight";
import { AnimatedChart, buildChartSignature } from "./AnimatedChart";
import { ThemedTooltip } from "./ChartPrimitives";

export type MetricSlice = {
  label: string;
  value: number;
  tone: ChartTone | string;
  /** Frivillig nyckel för React-listor. */
  key?: string;
};

interface DonutProps {
  data: MetricSlice[];
  size?: number;
  /** Innerradius i procent av size/2. Default 62 = tunn donut. */
  innerPct?: number;
  /** Centertext (siffra eller kort etikett). */
  centerValue?: string | number;
  /** Sub-text under centerValue. */
  centerSubtitle?: string;
  /** Valuformatter för tooltip. Default `${v}`. */
  valueFormatter?: (v: number) => string;
}

/**
 * Donut för fördelningar (t.ex. tid per kategori, andel mående-axlar).
 * Centertext + tooltip per slice.
 */
export const MetricDonut = ({
  data,
  size,
  innerPct = 62,
  centerValue,
  centerSubtitle,
  valueFormatter = (v) => `${v}`,
}: DonutProps) => {
  const heights = useChartHeight();
  const resolvedSize = size ?? heights.standard;
  const inner = (resolvedSize / 2) * (innerPct / 100);
  const outer = resolvedSize / 2 - 2;

  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  const sig = buildChartSignature(data, `${size}-${innerPct}`);

  return (
    <AnimatedChart signature={sig} className="relative">
      <div className="relative" style={{ width: size, height: size }} role="img" aria-label="Fördelning">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <ThemedTooltip
              variant="bar"
              formatter={(value, _name, item) => {
                const d = item.payload as MetricSlice;
                const pct = total > 0 ? Math.round((Number(value) / total) * 100) : 0;
                return [`${valueFormatter(Number(value))} · ${pct}%`, d.label];
              }}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={inner}
              outerRadius={outer}
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="none"
              {...chartAnimation("donut")}
            >
              {data.map((d, i) => (
                <Cell key={d.key ?? i} fill={toneHsl(d.tone)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {(centerValue != null || centerSubtitle) && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none text-center">
            <div>
              {centerValue != null && (
                <p className="text-2xl font-extrabold leading-none tabular-nums">{centerValue}</p>
              )}
              {centerSubtitle && (
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary mt-1">
                  {centerSubtitle}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </AnimatedChart>
  );
};

interface PillsProps {
  data: MetricSlice[];
  /** Format för värdet i pillen. */
  valueFormatter?: (v: number) => string;
  /** Visa procent istället för absolutvärde. */
  asPercent?: boolean;
  className?: string;
}

/**
 * Kompakta pills som ofta paras med MetricDonut för att visa legend + värde.
 * Färgad prick + etikett + värde, wrappar fritt.
 */
export const MetricPills = ({
  data,
  valueFormatter = (v) => `${v}`,
  asPercent = false,
  className = "",
}: PillsProps) => {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {data.map((d, i) => {
        const display = asPercent
          ? `${total > 0 ? Math.round((d.value / total) * 100) : 0}%`
          : valueFormatter(d.value);
        return (
          <li
            key={d.key ?? i}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${toneSoftBg(d.tone as ChartTone)}`}
          >
            <span aria-hidden className="w-2 h-2 rounded-full shrink-0" style={{ background: toneHsl(d.tone) }} />
            <span className="text-[11px] font-extrabold leading-none">{d.label}</span>
            <span className="text-[11px] font-bold leading-none tabular-nums opacity-80">{display}</span>
          </li>
        );
      })}
    </ul>
  );
};
