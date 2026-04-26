CREATE UNIQUE INDEX IF NOT EXISTS medications_user_active_namedose_uq
  ON public.medications (user_id, lower(name), coalesce(lower(dose), ''))
  WHERE active = true;