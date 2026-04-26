CREATE TABLE public.weekly_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

ALTER TABLE public.weekly_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own weekly_insights"
  ON public.weekly_insights FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own weekly_insights"
  ON public.weekly_insights FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own weekly_insights"
  ON public.weekly_insights FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own weekly_insights"
  ON public.weekly_insights FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_weekly_insights_user_week ON public.weekly_insights(user_id, week_start DESC);