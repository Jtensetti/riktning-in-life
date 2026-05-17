CREATE OR REPLACE FUNCTION public.get_clinical_report(p_start date, p_end date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  result jsonb;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_end < p_start THEN
    RAISE EXCEPTION 'invalid_range';
  END IF;

  SELECT jsonb_build_object(
    'period', jsonb_build_object('start', p_start, 'end', p_end),
    'checkins', COALESCE((
      SELECT jsonb_agg(to_jsonb(c) ORDER BY c.date)
      FROM public.daily_checkins c
      WHERE c.user_id = uid AND c.date >= p_start AND c.date <= p_end
    ), '[]'::jsonb),
    'forms', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'type', f.type, 'total_score', f.total_score, 'date', f.date
      ) ORDER BY f.date)
      FROM public.weekly_forms f
      WHERE f.user_id = uid AND f.date >= p_start AND f.date <= p_end
    ), '[]'::jsonb),
    'medications', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'name', m.name, 'dose', m.dose, 'active', m.active,
        'date_started', m.date_started, 'date_stopped', m.date_stopped
      ))
      FROM public.medications m
      WHERE m.user_id = uid
    ), '[]'::jsonb),
    'medication_logs', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'taken_status', l.taken_status, 'side_effects_json', l.side_effects_json,
        'severity', l.severity, 'date', l.date
      ) ORDER BY l.date)
      FROM public.medication_logs l
      WHERE l.user_id = uid AND l.date >= p_start AND l.date <= p_end
    ), '[]'::jsonb),
    'journals', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', j.date, 'template_type', j.template_type,
        'title', j.title, 'free_text', j.free_text
      ) ORDER BY j.date)
      FROM public.journal_entries j
      WHERE j.user_id = uid AND j.include_in_report = true
        AND j.date >= p_start AND j.date <= p_end
    ), '[]'::jsonb),
    'activities', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', a.date, 'label', a.label, 'category', a.category,
        'duration_minutes', a.duration_minutes, 'mood_delta', a.mood_delta,
        'anxiety_before', a.anxiety_before, 'anxiety_after', a.anxiety_after,
        'mood_before', a.mood_before, 'mood_after', a.mood_after
      ) ORDER BY a.date)
      FROM public.activity_logs a
      WHERE a.user_id = uid AND a.date >= p_start AND a.date <= p_end
    ), '[]'::jsonb),
    'exercise_sessions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', s.date, 'anxiety_before', s.anxiety_before, 'anxiety_after', s.anxiety_after,
        'mood_before', s.mood_before, 'mood_after', s.mood_after
      ) ORDER BY s.date)
      FROM public.exercise_sessions s
      WHERE s.user_id = uid AND s.date >= p_start AND s.date <= p_end
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$function$;