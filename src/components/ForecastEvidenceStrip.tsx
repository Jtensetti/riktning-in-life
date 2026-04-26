import type { Forecast } from "@/lib/forecast";
import type { PersonalThresholds } from "@/lib/baseline";
import type { RecentCheckin } from "@/hooks/useRecentCheckins";

interface Props {
  forecast: Forecast;
  rows: RecentCheckin[];
  thresholds: PersonalThresholds;
}

/** Senaste 7 dagar som en rad små prickar — fyllda när värdet passerar tröskeln. */
const Dots = ({
  values,
  isFlag,
  flagColor,
  baseColor,
  ariaLabel,
}: {
  values: (number | null)[];
  isFlag: (v: number) => boolean;
  flagColor: string;
  baseColor: string;
  ariaLabel: string;
}) => {
  const last7 = values.slice(-7);
  while (last7.length < 7) last7.unshift(null);
  return (
    <div className="flex items-center gap-1" aria-label={ariaLabel}>
      {last7.map((v, i) => {
        const empty = v == null;
        const flag = !empty && isFlag(v);
        return (
          <span
            key={i}
            aria-hidden
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: empty
                ? "hsl(var(--muted-foreground) / 0.25)"
                : flag
                  ? flagColor
                  : baseColor,
              opacity: empty ? 1 : flag ? 1 : 0.5,
            }}
          />
        );
      })}
    </div>
  );
};

/**
 * Liten "varför ser vi det här?"-rad under prognoskortet.
 * Visar två kompakta minilinjer (sömn + oro) med 7 dagars prickar
 * och en kort textförklaring per rad.
 */
export const ForecastEvidenceStrip = ({ forecast, rows, thresholds }: Props) => {
  if (!forecast.kind) return null;

  const sleeps = rows.map((r) => (r.sleep_hours == null ? null : Number(r.sleep_hours)));
  const anxs = rows.map((r) => r.anxiety);

  const shortNights = sleeps
    .slice(-7)
    .filter((s): s is number => s != null && s < thresholds.shortSleep).length;
  const highAnxDays = anxs
    .slice(-7)
    .filter((a): a is number => a != null && a >= thresholds.highAnxiety).length;

  return (
    <section
      className="-mt-4 mb-7 px-4 py-3 rounded-2xl bg-surface-alt animate-fade-in-up"
      aria-label="Varför vi visar prognosen"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
          Senaste 7 dagar
        </span>
        <span className="text-[10px] text-muted-foreground">Varför nu?</span>
      </div>

      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold shrink-0">Sömn</span>
          <span className="text-[11px] text-muted-foreground truncate">
            {shortNights > 0
              ? `${shortNights} ${shortNights === 1 ? "natt" : "nätter"} under ${thresholds.shortSleep.toFixed(1)} h`
              : "Stabil"}
          </span>
        </div>
        <Dots
          values={sleeps}
          isFlag={(v) => v < thresholds.shortSleep}
          flagColor="hsl(var(--purple-sleep))"
          baseColor="hsl(var(--blue-calm))"
          ariaLabel="Sömn senaste 7 dagar"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold shrink-0">Oro</span>
          <span className="text-[11px] text-muted-foreground truncate">
            {highAnxDays > 0
              ? `${highAnxDays} ${highAnxDays === 1 ? "dag" : "dagar"} över ${thresholds.highAnxiety.toFixed(0)}/10`
              : "Stabil"}
          </span>
        </div>
        <Dots
          values={anxs}
          isFlag={(v) => v >= thresholds.highAnxiety}
          flagColor="hsl(var(--orange-start))"
          baseColor="hsl(var(--blue-calm))"
          ariaLabel="Oro senaste 7 dagar"
        />
      </div>
    </section>
  );
};
