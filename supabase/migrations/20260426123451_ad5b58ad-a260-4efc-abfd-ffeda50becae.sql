ALTER TABLE public.daily_checkins
  ADD COLUMN IF NOT EXISTS weather_kind text,
  ADD COLUMN IF NOT EXISTS weather_temp_c numeric;