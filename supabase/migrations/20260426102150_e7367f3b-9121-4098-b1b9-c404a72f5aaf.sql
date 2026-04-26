-- ============ JOURNAL ENTRIES ============
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  template_type TEXT NOT NULL CHECK (template_type IN ('three_lines','thought_loop','body_first','evidence_log','free')),
  title TEXT,
  body_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  free_text TEXT,
  linked_checkin_id UUID REFERENCES public.daily_checkins(id) ON DELETE SET NULL,
  include_in_report BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own journal" ON public.journal_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own journal" ON public.journal_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own journal" ON public.journal_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own journal" ON public.journal_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_journal_user_date ON public.journal_entries(user_id, date DESC);

-- ============ WEEKLY FORMS (PHQ-9, GAD-7, WHO-5) ============
CREATE TABLE public.weekly_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('phq9','gad7','who5')),
  answers_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_score NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own forms" ON public.weekly_forms FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own forms" ON public.weekly_forms FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own forms" ON public.weekly_forms FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own forms" ON public.weekly_forms FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_weekly_user_type_date ON public.weekly_forms(user_id, type, date DESC);

-- ============ MEDICATIONS ============
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dose TEXT,
  date_started DATE,
  date_stopped DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own meds" ON public.medications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own meds" ON public.medications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own meds" ON public.medications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own meds" ON public.medications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ MEDICATION LOGS ============
CREATE TABLE public.medication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  taken_status TEXT NOT NULL CHECK (taken_status IN ('taken','missed','partial')),
  side_effects_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own med_logs" ON public.medication_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own med_logs" ON public.medication_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own med_logs" ON public.medication_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own med_logs" ON public.medication_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_med_logs_user_date ON public.medication_logs(user_id, date DESC);
