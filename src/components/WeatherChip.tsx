import { AbstractIcon, weatherIcon, weatherIconColor } from "./AbstractIcon";
import type { Weather } from "@/lib/weather";

interface Props {
  weather: Weather;
  /** Compact: just icon + temp. Default true. */
  compact?: boolean;
}

export const WeatherChip = ({ weather, compact = true }: Props) => {
  const name = weatherIcon(weather.kind, weather.isDaylight);
  const color = weatherIconColor(weather.kind, weather.isDaylight);
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-surface/90 backdrop-blur shadow-card px-3 py-1.5">
      <AbstractIcon name={name} size={compact ? 20 : 24} color={color} />
      <span className="text-xs font-extrabold tabular-nums text-foreground">
        {Math.round(weather.tempC)}°
      </span>
    </div>
  );
};
