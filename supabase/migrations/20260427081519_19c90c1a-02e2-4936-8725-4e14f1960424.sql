-- Add semantic_kind axis and lightweight per-activity fields.
-- semantic_kind classifies activities for reporting (rörelse/återhämtning/...).
-- intensity (rörelse) and with_who (socialt) are optional context fields.

ALTER TABLE public.activity_catalog
  ADD COLUMN IF NOT EXISTS semantic_kind text;

ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS semantic_kind text,
  ADD COLUMN IF NOT EXISTS intensity text,
  ADD COLUMN IF NOT EXISTS with_who text;

-- Constrain to a known vocabulary (validation trigger style via CHECK on enum-like text).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_catalog_semantic_kind_chk') THEN
    ALTER TABLE public.activity_catalog
      ADD CONSTRAINT activity_catalog_semantic_kind_chk
      CHECK (semantic_kind IS NULL OR semantic_kind IN ('rorelse','aterhamtning','socialt','fokus','vardag','somn','journal'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_semantic_kind_chk') THEN
    ALTER TABLE public.activity_logs
      ADD CONSTRAINT activity_logs_semantic_kind_chk
      CHECK (semantic_kind IS NULL OR semantic_kind IN ('rorelse','aterhamtning','socialt','fokus','vardag','somn','journal'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_intensity_chk') THEN
    ALTER TABLE public.activity_logs
      ADD CONSTRAINT activity_logs_intensity_chk
      CHECK (intensity IS NULL OR intensity IN ('latt','medel','hard'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_with_who_chk') THEN
    ALTER TABLE public.activity_logs
      ADD CONSTRAINT activity_logs_with_who_chk
      CHECK (with_who IS NULL OR with_who IN ('ensam','partner','barn','van','kollega','annan'));
  END IF;
END $$;

-- Backfill activity_catalog.semantic_kind from slug list.
UPDATE public.activity_catalog SET semantic_kind = 'rorelse' WHERE slug IN (
  'promenad','langpromenad-skog','jogg','cykla','simma','styrketraning','gym',
  'stretch-yoga','padel-tennis','bollsport-barn','snoskottning','vedhuggning','skogspromenad'
);

UPDATE public.activity_catalog SET semantic_kind = 'aterhamtning' WHERE slug IN (
  'langt-bad','lasa-bok','podd','film-med-frun','hangmatta','bara-vara',
  'bastu','kaffe-i-solen','sitta-altan','bada-natur','fagelskadning','fiska'
);

UPDATE public.activity_catalog SET semantic_kind = 'socialt' WHERE slug IN (
  'lek-barn','godnattsaga','matlaga-barn','date-fru','fika-utan-skarmar',
  'lego','bradspel','bada-barnen','ringa-van','fika-granne','hjalpa-nagon',
  'match','foreningsmote','skicka-meddelande','grilla','bilresa-ett-barn'
);

UPDATE public.activity_catalog SET semantic_kind = 'fokus' WHERE slug IN (
  'lara-nytt','instrument','slutfora-smasak','reparera','bygga-snickra','mala-om'
);

UPDATE public.activity_catalog SET semantic_kind = 'vardag' WHERE slug IN (
  'laga-middag','tradgardsarbete','klippa-gras','plantera','meka-bil','bar-svamp'
);

UPDATE public.activity_catalog SET semantic_kind = 'journal' WHERE slug IN (
  'skriva-dagbok','musik-betyder'
);
