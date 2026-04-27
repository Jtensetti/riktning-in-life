-- 1. user_settings.flags
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS flags jsonb NOT NULL DEFAULT '{"auto_journal": true}'::jsonb;

-- 2. daily_checkins.context
ALTER TABLE public.daily_checkins
  ADD COLUMN IF NOT EXISTS context jsonb;

-- 3. journal_entries.suggested_for_report
ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS suggested_for_report boolean NOT NULL DEFAULT false;

-- 4. cached_insights table
CREATE TABLE IF NOT EXISTS public.cached_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind)
);

ALTER TABLE public.cached_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own cached_insights"
  ON public.cached_insights FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own cached_insights"
  ON public.cached_insights FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own cached_insights"
  ON public.cached_insights FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own cached_insights"
  ON public.cached_insights FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS cached_insights_user_kind_idx
  ON public.cached_insights (user_id, kind);

-- 5. Realtime — lägg till tabeller i supabase_realtime publication.
--    DO-block så vi inte failar om tabellen redan är tillagd.
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'daily_checkins', 'activity_logs', 'exercise_sessions',
    'medication_logs', 'cached_insights'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', tbl);
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    EXCEPTION WHEN duplicate_object THEN
      -- redan tillagd, skip
      NULL;
    END;
  END LOOP;
END $$;
