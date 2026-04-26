
-- Rensa svaga källor från övningar (populärvetenskap, böcker, organisationer som inte är primärkällor)
-- Behåller peer-reviewed studier, myndighetsriktlinjer och kliniska protokoll.

UPDATE public.exercises
SET evidence_json = (
  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
  FROM jsonb_array_elements(evidence_json) elem
  WHERE NOT (
    elem->>'source' ILIKE '%Why We Sleep%'
    OR elem->>'source' ILIKE '%Walker%'
    OR elem->>'source' ILIKE '%Atomic Habits%'
    OR elem->>'source' ILIKE '%James Clear%'
    OR elem->>'source' ILIKE '%Tiny Habits%'
    OR elem->>'source' ILIKE '%Fogg%'
    OR elem->>'source' ILIKE '%Happiness Trap%'
    OR elem->>'source' ILIKE '%Russ Harris%'
    OR elem->>'source' ILIKE '%Esfahani Smith%'
    OR elem->>'source' ILIKE '%TED%'
    OR elem->>'source' ILIKE '%Beck Institute%'
    OR elem->>'source' ILIKE '%Wood %26 Neal%'
    OR elem->>'source' ILIKE '%Wood and Neal%'
  )
);

-- Samma rensning för learn_articles (sources_json)
UPDATE public.learn_articles
SET sources_json = (
  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
  FROM jsonb_array_elements(sources_json) elem
  WHERE NOT (
    (elem->>'source' ILIKE '%Why We Sleep%' OR elem->>'title' ILIKE '%Why We Sleep%')
    OR (elem->>'source' ILIKE '%Walker%' AND elem->>'source' NOT ILIKE '%walking%')
    OR (elem->>'source' ILIKE '%Atomic Habits%' OR elem->>'title' ILIKE '%Atomic Habits%')
    OR (elem->>'source' ILIKE '%James Clear%' OR elem->>'title' ILIKE '%James Clear%')
    OR (elem->>'source' ILIKE '%Tiny Habits%' OR elem->>'title' ILIKE '%Tiny Habits%')
    OR (elem->>'source' ILIKE '%Happiness Trap%' OR elem->>'title' ILIKE '%Happiness Trap%')
    OR (elem->>'source' ILIKE '%Russ Harris%' OR elem->>'title' ILIKE '%Russ Harris%')
    OR (elem->>'source' ILIKE '%Esfahani Smith%' OR elem->>'title' ILIKE '%Esfahani Smith%')
    OR (elem->>'source' ILIKE '%TED%' OR elem->>'title' ILIKE '%TED%' OR elem->>'url' ILIKE '%ted.com%')
    OR (elem->>'source' ILIKE '%Beck Institute%' OR elem->>'title' ILIKE '%Beck Institute%')
    OR (elem->>'source' ILIKE '%Cacioppo%26 Patrick%' OR elem->>'source' ILIKE '%Loneliness%' AND elem->>'year' = '2008')
  )
);
