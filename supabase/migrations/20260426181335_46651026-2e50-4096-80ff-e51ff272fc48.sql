
-- Återställ artiklarnas källor från statiska data, sedan filtrera precist.
-- Vi sätter helt enkelt om sources_json med endast de starka källorna.

UPDATE public.learn_articles SET sources_json = '[
  {"year": 2013, "source": "Xie et al. — sleep drives metabolite clearance"},
  {"year": 2015, "source": "Chang et al. — evening blue light suppresses melatonin"}
]'::jsonb WHERE slug = (SELECT slug FROM public.learn_articles WHERE title = 'Sömn är hjärnans städning' LIMIT 1);

UPDATE public.learn_articles SET sources_json = '[
  {"year": 2006, "source": "Dimidjian et al. — behavioral activation vs antidepressants"},
  {"year": 2022, "source": "NICE NG222 — Depression in adults"},
  {"year": 2007, "source": "Cuijpers et al. — BA meta-analysis"}
]'::jsonb WHERE title = 'Vägen ut ur tunga dagar';

UPDATE public.learn_articles SET sources_json = '[
  {"year": 2005, "source": "Brown & Gerbarg — Sudarshan Kriya breathing"},
  {"year": 2018, "source": "Zaccaro et al. — How breath-control can change your life"},
  {"year": 2007, "source": "Lieberman et al. — affect labeling"}
]'::jsonb WHERE title = 'Oro i kroppen, inte i huvudet';

UPDATE public.learn_articles SET sources_json = '[
  {"year": 2013, "source": "Cooney et al. — exercise for depression Cochrane review"},
  {"year": 2018, "source": "Schuch et al. — physical activity and depression incidence"},
  {"year": 2021, "source": "Folkhälsomyndigheten — fysisk aktivitet"}
]'::jsonb WHERE title = 'Rörelse som antidepressivum';

UPDATE public.learn_articles SET sources_json = '[
  {"year": 1983, "source": "Borkovec et al. — worry time intervention"},
  {"year": 2012, "source": "Hayes et al. — Acceptance and Commitment Therapy"},
  {"year": 1994, "source": "Wegner — ironic processes of mental control"}
]'::jsonb WHERE title = 'Att bryta ältande utan att slåss';

UPDATE public.learn_articles SET sources_json = '[
  {"year": 2019, "source": "Adan et al. — nutrition and mood review"},
  {"year": 2014, "source": "Pross et al. — dehydration and mood"},
  {"year": 2013, "source": "Leidy et al. — breakfast protein and appetite"}
]'::jsonb WHERE title = 'Mat, blodsocker och humör';

UPDATE public.learn_articles SET sources_json = '[
  {"year": 2010, "source": "Holt-Lunstad et al. — social connection meta-analysis"},
  {"year": 2014, "source": "Sandstrom & Dunn — weak ties and well-being"}
]'::jsonb WHERE title = 'Människor är medicin';

UPDATE public.learn_articles SET sources_json = '[
  {"year": 2012, "source": "Stanley & Brown — Safety Planning Intervention"},
  {"year": 2020, "source": "Socialstyrelsen — Nationella riktlinjer suicidprevention"}
]'::jsonb WHERE title = 'När det är tungt på riktigt';

UPDATE public.learn_articles SET sources_json = '[
  {"url": "https://doi.org/10.1016/j.xcrm.2022.100895", "title": "Cyclic sighing reduces stress more than meditation — Cell Reports Medicine 2022"},
  {"url": "https://doi.org/10.3389/fnhum.2018.00353", "title": "Slow breathing and heart rate variability — Frontiers in Human Neuroscience 2018"}
]'::jsonb WHERE title = 'Andningen som fjärrkontroll till nervsystemet';

UPDATE public.learn_articles SET sources_json = '[
  {"url": "https://aasm.org/clinical-resources/practice-standards/practice-guidelines/", "title": "AASM — Clinical Practice Guideline for the Treatment of Chronic Insomnia"},
  {"url": "https://www.cochrane.org/CD010753", "title": "Cochrane review on CBT-I"}
]'::jsonb WHERE title = 'CBT-I: starkaste medicinen för sömn — utan piller';

-- 2-minutersregeln-artikeln: Cochrane räcker, hoppar Atomic Habits.
UPDATE public.learn_articles SET sources_json = '[
  {"url": "https://www.cochrane.org/CD003380", "title": "Behavioral activation for depression — Cochrane"}
]'::jsonb WHERE title = '2-minutersregeln: när lust inte kommer först';

UPDATE public.learn_articles SET sources_json = '[
  {"url": "https://doi.org/10.1037/bul0000273", "title": "Self-compassion and well-being meta-analysis — Psychological Bulletin"}
]'::jsonb WHERE title = 'Självmedkänsla — inte mjukt prat, hård forskning';

-- ACT: hoppar Happiness Trap-länken.
UPDATE public.learn_articles SET sources_json = '[
  {"url": "https://doi.org/10.1016/j.brat.2020.103747", "title": "ACT meta-analysis — Behaviour Research and Therapy"}
]'::jsonb WHERE title = 'ACT: dina värden som kompass när allt skakar';

UPDATE public.learn_articles SET sources_json = '[
  {"url": "https://doi.org/10.1001/jamapsychiatry.2022.0609", "title": "Physical activity and depression — JAMA Psychiatry 2022"},
  {"url": "https://doi.org/10.1136/bmj-2022-073412", "title": "Brief exercise snacks improve fitness — BMJ 2022"}
]'::jsonb WHERE title = 'Rörelse är medicin — även 10 minuter räknas';

UPDATE public.learn_articles SET sources_json = '[
  {"url": "https://doi.org/10.1001/jamapsychiatry.2020.4337", "title": "Loneliness and risk for depression — JAMA Psychiatry meta-analysis"},
  {"url": "https://doi.org/10.1073/pnas.2118062119", "title": "Weak ties och välmående — PNAS"}
]'::jsonb WHERE title = 'Sociala band är skyddsutrustning';

-- Mening: TED-talk borta, behåller Annual Review.
UPDATE public.learn_articles SET sources_json = '[
  {"url": "https://doi.org/10.1146/annurev-psych-072420-122921", "title": "Sense of meaning and well-being — Annual Review of Psychology"}
]'::jsonb WHERE title = 'Mening i smått — när det stora känns för långt bort';
