REVOKE EXECUTE ON FUNCTION public.get_weekly_report(date) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_weekly_report(date) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;