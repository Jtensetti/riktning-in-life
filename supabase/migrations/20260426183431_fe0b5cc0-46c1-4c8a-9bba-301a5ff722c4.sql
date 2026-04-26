-- Samlad veckorapport. SECURITY DEFINER + auth.uid() => låst till inloggad ägare.
-- Returnerar 14 d checkins/forms/meds/medlogs och 7 d journal/activities som ett JSON-objekt.
CREATE OR REPLACE FUNCTION public.get_weekly_report(target_date date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  d_end date := target_date;
  d_start_14 date := target_date - INTERVAL '13 days';
  d_start_7 date := target_date - INTERVAL '6 days';
  result jsonb;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT jsonb_build_object(
    'period', jsonb_build_object(
      'end', d_end,
      'start_week', d_start_7,
      'start_prev_week', d_start_14
    ),
    'checkins', COALESCE((
      SELECT jsonb_agg(to_jsonb(c) ORDER BY c.date)
      FROM public.daily_checkins c
      WHERE c.user_id = uid AND c.date >= d_start_14 AND c.date <= d_end
    ), '[]'::jsonb),
    'forms', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'type', f.type, 'total_score', f.total_score, 'date', f.date
      ) ORDER BY f.date)
      FROM public.weekly_forms f
      WHERE f.user_id = uid AND f.date >= d_start_14 AND f.date <= d_end
    ), '[]'::jsonb),
    'medications', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'name', m.name, 'dose', m.dose, 'active', m.active, 'date_started', m.date_started
      ))
      FROM public.medications m
      WHERE m.user_id = uid
    ), '[]'::jsonb),
    'medication_logs', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'taken_status', l.taken_status, 'side_effects_json', l.side_effects_json, 'date', l.date
      ) ORDER BY l.date)
      FROM public.medication_logs l
      WHERE l.user_id = uid AND l.date >= d_start_14 AND l.date <= d_end
    ), '[]'::jsonb),
    'journals', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', j.date,
        'template_type', j.template_type,
        'title', j.title,
        'free_text', j.free_text
      ) ORDER BY j.date)
      FROM public.journal_entries j
      WHERE j.user_id = uid
        AND j.include_in_report = true
        AND j.date >= d_start_7 AND j.date <= d_end
    ), '[]'::jsonb),
    'activities', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', a.date,
        'label', a.label,
        'category', a.category,
        'duration_minutes', a.duration_minutes,
        'mood_delta', a.mood_delta
      ) ORDER BY a.date)
      FROM public.activity_logs a
      WHERE a.user_id = uid AND a.date >= d_start_7 AND a.date <= d_end
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

-- Endast inloggade användare får anropa den.
REVOKE ALL ON FUNCTION public.get_weekly_report(date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_weekly_report(date) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_weekly_report(date) TO authenticated;