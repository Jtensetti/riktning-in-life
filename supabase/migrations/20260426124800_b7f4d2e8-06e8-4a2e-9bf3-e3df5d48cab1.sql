-- A) Forskningsstöd på övningar
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS mechanism text,
  ADD COLUMN IF NOT EXISTS evidence_json jsonb NOT NULL DEFAULT '[]'::jsonb;

-- B) Sekvenser (rutinpaket)
CREATE TABLE IF NOT EXISTS public.exercise_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  color text NOT NULL DEFAULT 'orange',
  time_of_day text,
  exercise_ids_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exercise_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read sequences"
  ON public.exercise_sequences FOR SELECT TO authenticated USING (true);

-- C) Lär dig-artiklar
CREATE TABLE IF NOT EXISTS public.learn_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  color text NOT NULL,
  read_minutes integer NOT NULL DEFAULT 2,
  excerpt text NOT NULL,
  body_md text NOT NULL,
  related_exercise_ids_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.learn_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read articles"
  ON public.learn_articles FOR SELECT TO authenticated USING (true);

-- D) Krisplan (en per user)
CREATE TABLE IF NOT EXISTS public.crisis_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  warning_signs_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  helps_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  avoid_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  contacts_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  professional_contacts_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  safe_places_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  reasons_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crisis_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own crisis plan"
  ON public.crisis_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own crisis plan"
  ON public.crisis_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own crisis plan"
  ON public.crisis_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own crisis plan"
  ON public.crisis_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER set_crisis_plans_updated_at
  BEFORE UPDATE ON public.crisis_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();