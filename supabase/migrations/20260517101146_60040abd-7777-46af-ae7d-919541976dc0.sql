REVOKE EXECUTE ON FUNCTION public.get_clinical_report(date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_clinical_report(date, date) TO authenticated;