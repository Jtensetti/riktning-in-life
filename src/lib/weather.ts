// Weather context — Open-Meteo (no API key, no PII sent beyond lat/lon).
// Cached in localStorage for 30 minutes per coordinate.

import { useEffect, useState, useCallback } from "react";

export type WeatherKind =
  | "clear"
  | "partly"
  | "cloudy"
  | "rain"
  | "snow"
  | "fog"
  | "thunder"
  | "wind";

export type Weather = {
  kind: WeatherKind;
  tempC: number;
  feelsLikeC: number;
  windMs: number;
  isDaylight: boolean;
  fetchedAt: string;
  lat: number;
  lon: number;
};

export type WeatherStatus =
  | "idle"
  | "prompting"
  | "loading"
  | "ready"
  | "denied"
  | "error";

const CACHE_KEY = "riktning_weather_v1";
const PERMISSION_ASKED_KEY = "riktning_weather_perm_asked";
const PERMISSION_GRANTED_KEY = "riktning_weather_perm_granted";
const PERMISSION_DISMISSED_KEY = "riktning_weather_perm_dismissed";
const CACHE_TTL_MS = 30 * 60 * 1000;

// Stockholm fallback when location is unavailable.
const FALLBACK = { lat: 59.3293, lon: 18.0686 };

// WMO weather codes → our kinds.
// Ref: https://open-meteo.com/en/docs
const codeToKind = (code: number): WeatherKind => {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95 && code <= 99) return "thunder";
  return "cloudy";
};

const readCache = (): Weather | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const w = JSON.parse(raw) as Weather;
    if (Date.now() - new Date(w.fetchedAt).getTime() > CACHE_TTL_MS) return null;
    return w;
  } catch {
    return null;
  }
};

const writeCache = (w: Weather) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(w));
  } catch {
    /* ignore */
  }
};

export const hasAskedWeatherPermission = () =>
  !!localStorage.getItem(PERMISSION_ASKED_KEY);
export const markWeatherPermissionAsked = () =>
  localStorage.setItem(PERMISSION_ASKED_KEY, "1");
export const setWeatherPermissionGranted = (granted: boolean) =>
  localStorage.setItem(PERMISSION_GRANTED_KEY, granted ? "1" : "0");
export const isWeatherPermissionGranted = () =>
  localStorage.getItem(PERMISSION_GRANTED_KEY) === "1";

const getPosition = (): Promise<{ lat: number; lon: number }> =>
  new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("no-geolocation"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, maximumAge: 10 * 60 * 1000, timeout: 8000 }
    );
  });

const fetchWeather = async (lat: number, lon: number): Promise<Weather> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&current=temperature_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&wind_speed_unit=ms&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`weather_http_${res.status}`);
  const data = await res.json();
  const cur = data.current ?? {};
  const code = Number(cur.weather_code ?? 3);
  const windMs = Number(cur.wind_speed_10m ?? 0);
  let kind = codeToKind(code);
  if (kind === "clear" && windMs > 12) kind = "wind";
  return {
    kind,
    tempC: Number(cur.temperature_2m ?? 0),
    feelsLikeC: Number(cur.apparent_temperature ?? cur.temperature_2m ?? 0),
    windMs,
    isDaylight: Number(cur.is_day ?? 1) === 1,
    fetchedAt: new Date().toISOString(),
    lat,
    lon,
  };
};

export const useWeather = (autoStart: boolean = true) => {
  const [weather, setWeather] = useState<Weather | null>(() => readCache());
  const [status, setStatus] = useState<WeatherStatus>(() =>
    readCache() ? "ready" : "idle"
  );

  const load = useCallback(async (opts?: { askLocation?: boolean }) => {
    setStatus("loading");
    let coords = { ...FALLBACK };
    let usedFallback = true;
    const askLocation = opts?.askLocation ?? isWeatherPermissionGranted();
    if (askLocation) {
      try {
        coords = await getPosition();
        usedFallback = false;
        setWeatherPermissionGranted(true);
      } catch (e: any) {
        if (e?.code === 1) {
          setWeatherPermissionGranted(false);
          markWeatherPermissionAsked();
          setStatus("denied");
          // still try fallback so UI has something
        }
      }
    }
    try {
      const w = await fetchWeather(coords.lat, coords.lon);
      writeCache(w);
      setWeather(w);
      setStatus(usedFallback ? (status === "denied" ? "denied" : "ready") : "ready");
      return w;
    } catch {
      setStatus("error");
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autoStart) return;
    const cached = readCache();
    if (cached) return;
    // Only auto-fetch with location if user already granted; otherwise quietly use fallback.
    load({ askLocation: isWeatherPermissionGranted() });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const requestLocation = useCallback(async () => {
    setStatus("prompting");
    markWeatherPermissionAsked();
    return load({ askLocation: true });
  }, [load]);

  const refresh = useCallback(() => load({ askLocation: isWeatherPermissionGranted() }), [load]);

  return { weather, status, requestLocation, refresh };
};

// Friendly Swedish label.
export const weatherLabel = (kind: WeatherKind): string => {
  switch (kind) {
    case "clear": return "Klart";
    case "partly": return "Delvis molnigt";
    case "cloudy": return "Molnigt";
    case "rain": return "Regn";
    case "snow": return "Snö";
    case "fog": return "Dimma";
    case "thunder": return "Åska";
    case "wind": return "Blåsigt";
  }
};

export const isOutdoorFriendly = (w: Weather | null): boolean => {
  if (!w) return false;
  if (!w.isDaylight) return false;
  if (w.kind === "rain" || w.kind === "snow" || w.kind === "thunder") return false;
  if (w.windMs > 12) return false;
  if (w.tempC < -5) return false;
  return true;
};
