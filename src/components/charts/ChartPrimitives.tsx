import { CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import {
  chartCursor,
  chartGrid,
  chartTooltipStyle,
  chartTypography,
} from "@/lib/chartTheme";

/**
 * Färdiga, tema-trogna Recharts-element. Använd i alla chart-primitiver
 * istället för att duplicera prop-blobs. Att de är funktioner (inte JSX-noder
 * direkt) är medvetet — Recharts läser propsen via React.Children och vi vill
 * fortfarande kunna skicka extra props per användning.
 */

interface XAxisProps {
  dataKey?: string;
  /** Tjockare X-tick (default) eller lättare för linjer. */
  weight?: "bold" | "light";
  hide?: boolean;
  height?: number;
}

export const ThemedXAxis = ({ dataKey = "label", weight = "bold", hide, height = 20 }: XAxisProps) => (
  <XAxis
    dataKey={dataKey}
    hide={hide}
    tickLine={false}
    axisLine={false}
    interval={0}
    tick={weight === "bold" ? chartTypography.xTick : chartTypography.xTickLight}
    height={height}
  />
);

interface YAxisProps {
  domain?: [number, number];
  ticks?: number[];
  hide?: boolean;
  width?: number;
}

export const ThemedYAxis = ({ domain, ticks, hide = false, width = 28 }: YAxisProps) => {
  if (hide) return <YAxis hide domain={domain} />;
  return (
    <YAxis
      domain={domain}
      ticks={ticks}
      tickLine={false}
      axisLine={false}
      width={width}
      tick={chartTypography.yTick}
    />
  );
};

export const ThemedGrid = () => (
  <CartesianGrid stroke={chartGrid.stroke} strokeDasharray={chartGrid.strokeDasharray} vertical={chartGrid.vertical} />
);

interface ThemedTooltipProps {
  variant?: "bar" | "line";
  formatter?: React.ComponentProps<typeof Tooltip>["formatter"];
  labelFormatter?: React.ComponentProps<typeof Tooltip>["labelFormatter"];
}

export const ThemedTooltip = ({ variant = "bar", formatter, labelFormatter }: ThemedTooltipProps) => (
  <Tooltip
    cursor={variant === "bar" ? chartCursor.bar : chartCursor.line}
    contentStyle={chartTooltipStyle(variant)}
    formatter={formatter}
    labelFormatter={labelFormatter}
  />
);
