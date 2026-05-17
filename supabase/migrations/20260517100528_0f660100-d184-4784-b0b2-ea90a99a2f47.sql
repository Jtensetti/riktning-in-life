CREATE TABLE public.daily_weather (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  temp_min_c numeric,
  temp_max_c numeric,
  temp_avg_c numeric,
  precip_mm numeric,
  pressure_hpa_mean numeric,
  daylight_minutes integer,
  uv_index_max numeric,
  weather_code integer,
  source text NOT NULL DEFAULT 'open-meteo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_daily_weather_user_date ON public.daily_weather (user_id, date DESC);

ALTER TABLE public.daily_weather ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own daily_weather"
  ON public.daily_weather FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own daily_weather"
  ON public.daily_weather FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own daily_weather"
  ON public.daily_weather FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own daily_weather"
  ON public.daily_weather FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER daily_weather_set_updated_at
  BEFORE UPDATE ON public.daily_weather
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();