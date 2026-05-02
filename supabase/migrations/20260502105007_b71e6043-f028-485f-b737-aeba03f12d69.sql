ALTER TABLE public.weekly_forms DROP CONSTRAINT weekly_forms_type_check;

ALTER TABLE public.weekly_forms
  ADD CONSTRAINT weekly_forms_type_check
  CHECK (type = ANY (ARRAY['phq9'::text, 'gad7'::text, 'who5'::text, 'madrs'::text, 'keds'::text, 'bbq12'::text]));