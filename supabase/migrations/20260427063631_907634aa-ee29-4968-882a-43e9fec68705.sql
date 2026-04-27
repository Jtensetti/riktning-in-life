-- ============================================================
-- Fas A: Schema-förstärkningar för full datapipeline
-- ============================================================

-- 1. exercise_sessions — fånga faktisk tid + timer-läge + rutin-koppling
ALTER TABLE public.exercise_sessions
  ADD COLUMN IF NOT EXISTS actual_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS planned_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS timer_mode text DEFAULT 'silent',
  ADD COLUMN IF NOT EXISTS sequence_slug text,
  ADD COLUMN IF NOT EXISTS sequence_step integer;

-- 2. exercises — per-övning timer-läge
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS timer_mode text NOT NULL DEFAULT 'silent';

-- Sätt 'breathing' för andningskategorier (matchar befintlig kategoristruktur).
UPDATE public.exercises
SET timer_mode = 'breathing'
WHERE LOWER(category) IN ('andning', 'breathing', 'andningsövning')
   OR LOWER(title) LIKE '%andning%'
   OR LOWER(title) LIKE '%4-2-6%'
   OR LOWER(title) LIKE '%box-breath%';

-- 3. medication_logs — strukturerade biverkningar + faktisk tid
ALTER TABLE public.medication_logs
  ADD COLUMN IF NOT EXISTS taken_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS severity integer
    CHECK (severity IS NULL OR (severity >= 0 AND severity <= 10));

-- 4. activity_logs — faktisk effekt + faktisk tid
ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS mood_before integer
    CHECK (mood_before IS NULL OR (mood_before >= 0 AND mood_before <= 10)),
  ADD COLUMN IF NOT EXISTS mood_after integer
    CHECK (mood_after IS NULL OR (mood_after >= 0 AND mood_after <= 10)),
  ADD COLUMN IF NOT EXISTS energy_before integer
    CHECK (energy_before IS NULL OR (energy_before >= 0 AND energy_before <= 10)),
  ADD COLUMN IF NOT EXISTS energy_after integer
    CHECK (energy_after IS NULL OR (energy_after >= 0 AND energy_after <= 10)),
  ADD COLUMN IF NOT EXISTS actual_duration_minutes integer;

-- 5. daily_summaries — cache för trender
CREATE TABLE IF NOT EXISTS public.daily_summaries (
  user_id uuid NOT NULL,
  date date NOT NULL,
  burden numeric,
  function numeric,
  recovery numeric,
  stability numeric,
  activities_count integer NOT NULL DEFAULT 0,
  exercises_count integer NOT NULL DEFAULT 0,
  exercises_actual_minutes integer NOT NULL DEFAULT 0,
  medications_taken integer NOT NULL DEFAULT 0,
  medications_missed integer NOT NULL DEFAULT 0,
  side_effect_severity integer,
  computed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own daily_summaries"
  ON public.daily_summaries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own daily_summaries"
  ON public.daily_summaries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own daily_summaries"
  ON public.daily_summaries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own daily_summaries"
  ON public.daily_summaries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date
  ON public.daily_summaries (user_id, date DESC);

-- 6. recommendations_log — vad föreslogs och vad funkade
CREATE TABLE IF NOT EXISTS public.recommendations_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  source text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  shown_at timestamptz NOT NULL DEFAULT now(),
  acted_on boolean NOT NULL DEFAULT false,
  acted_at timestamptz,
  outcome jsonb
);

ALTER TABLE public.recommendations_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own recommendations_log"
  ON public.recommendations_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own recommendations_log"
  ON public.recommendations_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own recommendations_log"
  ON public.recommendations_log FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own recommendations_log"
  ON public.recommendations_log FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_recommendations_log_user_date
  ON public.recommendations_log (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_recommendations_log_user_source
  ON public.recommendations_log (user_id, source);
