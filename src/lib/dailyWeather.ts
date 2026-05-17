/**
 * Daily weather — backfill från Open-Meteo Archive API + lokal cache i
 * `daily_weather`-tabellen. Inga API-nycklar krävs.
 *
 * Vi använder Open-Meteo eftersom det är gratis, anonymt och har en separat
 * historik-endpoint (`archive-api.open-meteo.com`) som ger dygnsaggregat
 * tillbaka i tiden — perfekt för mönster- och riskanalys över 14–28 dagar.
 *
 * Backfill triggas högst en gång per dygn via en localStorage-stämpel.
 */

import { supabase } from "@/integrations/supabase/client";

export type DailyWeatherRow = {
  date: string;
  temp_min_c: number | null;
  temp_max_c: number | null;
  temp_avg_c: number | null;
  precip_mm: number | null;
  pressure_hpa_mean: number | null;
  daylight_minutes: number | null;
  uv_index_max: number | null;
  weather_code: number | null;
};

const BACKFILL_STAMP_KEY = "riktning_daily_weather_backfilled_v1";
const STAMP_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DAYS = 30;

const shouldRunBackfill = (): boolean => {
  try {
    const raw = localStorage.getItem(BACKFILL_STAMP_KEY);
    if (!raw) return true;
    return Date.now() - Number(raw) > STAMP_TTL_MS;
  } catch {
    return true;
  }
};

const markBackfilled = () => {
  try {
    localStorage.setItem(BACKFILL_STAMP_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
};

const isoDaysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

type ArchiveResponse = {
  daily?: {
    time?: string[];
    temperature_2m_min?: (number | null)[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_mean?: (number | null)[];
    precipitation_sum?: (number | null)[];
    pressure_msl_mean?: (number | null)[];
    daylight_duration?: (number | null)[]; // seconds
    uv_index_max?: (number | null)[];
    weather_code?: (number | null)[];
  };
};

/**
 * Hämta dygnsaggregat från Open-Meteo Archive.
 * Returnerar tom array vid nätverksfel — backfill är best-effort.
 */
const fetchArchive = async (
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
): Promise<DailyWeatherRow[]> => {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    start_date: startDate,
    end_date: endDate,
    daily: [
      "temperature_2m_min",
      "temperature_2m_max",
      "temperature_2m_mean",
      "precipitation_sum",
      "pressure_msl_mean",
      "daylight_duration",
      "uv_index_max",
      "weather_code",
    ].join(","),
    timezone: "auto",
  });
  try {
    const res = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`);
    if (!res.ok) return [];
    const json = (await res.json()) as ArchiveResponse;
    const d = json.daily;
    if (!d?.time) return [];
    return d.time.map((date, i) => ({
      date,
      temp_min_c: d.temperature_2m_min?.[i] ?? null,
      temp_max_c: d.temperature_2m_max?.[i] ?? null,
      temp_avg_c: d.temperature_2m_mean?.[i] ?? null,
      precip_mm: d.precipitation_sum?.[i] ?? null,
      pressure_hpa_mean: d.pressure_msl_mean?.[i] ?? null,
      daylight_minutes:
        d.daylight_duration?.[i] != null
          ? Math.round((d.daylight_duration[i] as number) / 60)
          : null,
      uv_index_max: d.uv_index_max?.[i] ?? null,
      weather_code: d.weather_code?.[i] ?? null,
    }));
  } catch {
    return [];
  }
};

/**
 * Backfilla `daily_weather` för senaste `days` dagar — hoppa över datum som
 * redan finns. Körs högst en gång per dygn per enhet (localStorage-stämpel).
 *
 * Returnerar antal upserterade rader (0 om hoppad eller fel).
 */
export const backfillDailyWeather = async (
  userId: string,
  lat: number,
  lon: number,
  days: number = DEFAULT_DAYS,
  force = false,
): Promise<number> => {
  if (!force && !shouldRunBackfill()) return 0;

  const endDate = isoDaysAgo(1); // archive uppdateras med ~2 dagars fördröjning
  const startDate = isoDaysAgo(days);

  const existing = await supabase
    .from("daily_weather")
    .select("date")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);
  const have = new Set((existing.data ?? []).map((r) => r.date as string));

  const rows = await fetchArchive(lat, lon, startDate, endDate);
  const toInsert = rows
    .filter((r) => !have.has(r.date))
    .map((r) => ({ ...r, user_id: userId }));

  if (toInsert.length === 0) {
    markBackfilled();
    return 0;
  }

  const { error } = await supabase
    .from("daily_weather")
    .upsert(toInsert, { onConflict: "user_id,date" });

  if (!error) markBackfilled();
  return error ? 0 : toInsert.length;
};

/**
 * Läs senaste `days` dagars dagligt väder för en användare. Sorterat
 * stigande på datum, klart att mata in i `detectPatterns` / `detectRisks`.
 */
export const loadDailyWeather = async (
  userId: string,
  days: number = DEFAULT_DAYS,
): Promise<DailyWeatherRow[]> => {
  const since = isoDaysAgo(days);
  const { data } = await supabase
    .from("daily_weather")
    .select("date,temp_min_c,temp_max_c,temp_avg_c,precip_mm,pressure_hpa_mean,daylight_minutes,uv_index_max,weather_code")
    .eq("user_id", userId)
    .gte("date", since)
    .order("date", { ascending: true });
  return (data ?? []) as DailyWeatherRow[];
};

/** Mappa Open-Meteo weather_code till samma kind-strängar som lib/weather. */
export const weatherCodeKind = (code: number | null | undefined): string => {
  if (code == null) return "";
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95 && code <= 99) return "thunder";
  return "cloudy";
};
