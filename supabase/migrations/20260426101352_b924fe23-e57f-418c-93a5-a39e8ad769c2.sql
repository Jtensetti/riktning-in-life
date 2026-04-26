-- ============ DAILY CHECKINS ============
CREATE TABLE public.daily_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood_heaviness INT CHECK (mood_heaviness BETWEEN 0 AND 10),
  anxiety INT CHECK (anxiety BETWEEN 0 AND 10),
  guilt_selfcriticism INT CHECK (guilt_selfcriticism BETWEEN 0 AND 10),
  hopelessness INT CHECK (hopelessness BETWEEN 0 AND 10),
  energy INT CHECK (energy BETWEEN 0 AND 10),
  getting_started INT CHECK (getting_started BETWEEN 0 AND 10),
  function_score INT CHECK (function_score BETWEEN 0 AND 10),
  daytime_bed_sofa_time_minutes INT,
  sleep_hours NUMERIC,
  sleep_quality INT CHECK (sleep_quality BETWEEN 0 AND 10),
  medication_taken TEXT CHECK (medication_taken IN ('yes','no','partial')),
  movement_today TEXT CHECK (movement_today IN ('none','little','yes')),
  meaningful_activity TEXT CHECK (meaningful_activity IN ('none','little','yes')),
  safety_status TEXT CHECK (safety_status IN ('none','passive_thoughts','active_thoughts','acute')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own checkins" ON public.daily_checkins
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own checkins" ON public.daily_checkins
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own checkins" ON public.daily_checkins
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own checkins" ON public.daily_checkins
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER daily_checkins_updated_at
  BEFORE UPDATE ON public.daily_checkins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ EXERCISES (public library) ============
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  duration_minutes INT NOT NULL,
  description TEXT NOT NULL,
  steps_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_for_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  not_recommended_for_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  color TEXT NOT NULL DEFAULT 'orange',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read exercises" ON public.exercises
  FOR SELECT TO authenticated USING (true);

-- ============ EXERCISE SESSIONS ============
CREATE TABLE public.exercise_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  anxiety_before INT CHECK (anxiety_before BETWEEN 0 AND 10),
  anxiety_after INT CHECK (anxiety_after BETWEEN 0 AND 10),
  energy_before INT CHECK (energy_before BETWEEN 0 AND 10),
  energy_after INT CHECK (energy_after BETWEEN 0 AND 10),
  mood_before INT CHECK (mood_before BETWEEN 0 AND 10),
  mood_after INT CHECK (mood_after BETWEEN 0 AND 10),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exercise_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own sessions" ON public.exercise_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON public.exercise_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sessions" ON public.exercise_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sessions" ON public.exercise_sessions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ SEED EXERCISES ============
INSERT INTO public.exercises (title, category, type, duration_minutes, description, steps_json, color) VALUES
-- Kom igång
('3 min upp ur sängen', 'Kom igång', 'focus', 3, 'En liten kedja som tar dig från sängen till dagen.', '["Sätt fötterna i golvet","Drick ett glas vatten","Gå till badrummet"]', 'orange'),
('8 min morgonstart', 'Kom igång', 'focus', 8, 'Mjuk start på dagen utan krav.', '["Öppna ett fönster","Drick vatten","Klä på dig","Gå ut på balkongen eller till dörren"]', 'orange'),
('Vatten, kläder, dörren', 'Kom igång', 'focus', 5, 'Tre steg, inget mer.', '["Drick vatten","Ta på kläder","Öppna ytterdörren i 30 sekunder"]', 'orange'),
('En sak räcker', 'Kom igång', 'focus', 2, 'Välj en enda sak för dagen.', '["Skriv ner en sak","Gör den","Sluta där"]', 'orange'),

-- Lugna kroppen
('4 min längre utandning', 'Lugna kroppen', 'breathing', 4, 'Andas in på 4, ut på 6.', '["Sitt eller ligg bekvämt","Andas in genom näsan i 4 sek","Andas ut genom munnen i 6 sek","Upprepa i 4 minuter"]', 'blue'),
('Kroppsskanning 6 min', 'Lugna kroppen', 'breathing', 6, 'Vandra med uppmärksamheten genom kroppen.', '["Ligg ner","Börja vid fötterna","Flytta uppåt långsamt","Notera utan att döma"]', 'blue'),
('Långsam promenad', 'Lugna kroppen', 'movement', 10, 'Gå halva ditt vanliga tempo.', '["Gå ut","Halvera tempot","Räkna 4 andetag per minut"]', 'blue'),
('Progressiv avslappning', 'Lugna kroppen', 'breathing', 8, 'Spänn och släpp varje muskelgrupp.', '["Spänn fötterna 5 sek","Släpp 10 sek","Fortsätt uppåt i kroppen"]', 'blue'),

-- Bryt ältande
('Tankeloop: fakta/tolkning', 'Bryt ältande', 'journal', 5, 'Skilj fakta från tolkning.', '["Skriv tanken","Lista fakta för","Lista fakta emot","Skriv en rimligare formulering"]', 'yellow'),
('10 min orostid', 'Bryt ältande', 'journal', 10, 'Avsatt tid att oroa sig - sen klart.', '["Sätt timer 10 min","Skriv ner alla orosmoln","När timern går - lägg undan"]', 'yellow'),
('Parkera tanken', 'Bryt ältande', 'focus', 3, 'Lägg tanken på papper för senare.', '["Skriv ner tanken","Säg: jag tar det senare","Gör nästa sak"]', 'yellow'),
('Vad skulle jag säga till en vän?', 'Bryt ältande', 'journal', 5, 'Byt perspektiv.', '["Tänk på en vän i samma situation","Skriv vad du skulle säga","Säg det till dig själv"]', 'yellow'),

-- Sov bättre
('Kvällslandning', 'Sov bättre', 'sleep', 10, 'Förbered kroppen för natten.', '["Dimma ljuset","Lägg undan skärmar","Lugn andning 5 min"]', 'purple'),
('Imorgon-lista', 'Sov bättre', 'journal', 5, 'Töm huvudet på papper.', '["Skriv 3 saker imorgon","Stäng anteckningsboken","Lägg den utanför sovrummet"]', 'purple'),
('Skärm-light', 'Sov bättre', 'sleep', 30, 'Sänk ljus och stimuli en halvtimme.', '["Stäng av notiser","Mörkt skärmläge","Lågt ljus i rummet"]', 'purple'),
('Sömn efter dålig dag', 'Sov bättre', 'sleep', 8, 'Mjuk landning utan prestation.', '["Inga krav på god sömn","Andas långsamt","Lyssna på något lugnt"]', 'purple'),

-- Rör dig mjukt
('15 min dagsljuspromenad', 'Rör dig mjukt', 'movement', 15, 'Ut och få ljus i ögonen.', '["Ta på ytterkläder","Gå ut","Vänd efter 7 min"]', 'pink'),
('Rörlighet 7 min', 'Rör dig mjukt', 'movement', 7, 'Mjuka rörelser för stela leder.', '["Rulla axlar","Vrid bålen","Töj benen"]', 'pink'),
('Mjuk yoga 10 min', 'Rör dig mjukt', 'movement', 10, 'Lugna positioner, ingen prestation.', '["Barnets position","Katt-ko","Liggande vridning"]', 'pink'),
('Lågintensiv reset', 'Rör dig mjukt', 'movement', 5, 'Skaka ut spänningar.', '["Skaka händerna","Skaka benen","Andas djupt"]', 'pink'),

-- Skriv av dig
('Tre rader', 'Skriv av dig', 'journal', 3, 'Tyngst, hjälp, imorgon.', '["Skriv: tyngsta idag var...","Skriv: något som hjälpte var...","Skriv: imorgon behöver jag..."]', 'yellow'),
('Kropp först', 'Skriv av dig', 'journal', 5, 'Lyssna på vad kroppen signalerar.', '["Var sitter känslan?","Vad signalerar kroppen?","Vad kan minska trycket 5%?"]', 'yellow'),
('Bevislogg', 'Skriv av dig', 'journal', 5, 'Dokumentera det du faktiskt gjort.', '["Vad gjorde jag trots motstånd?","Vad säger det om mig?","Vad vill jag minnas?"]', 'yellow'),
('Skuld till handling', 'Skriv av dig', 'journal', 5, 'Vänd skuld till nästa steg.', '["Skriv vad du klandrar dig för","Vad är ett litet steg?","Gör det första"]', 'yellow'),

-- Förbered vårdkontakt
('Inför läkarsamtalet', 'Förbered vårdkontakt', 'education', 10, 'Strukturera det du vill säga.', '["Vad är förändrat sen sist?","Vad fungerar?","Vad fungerar inte?"]', 'green'),
('Biverkningar senaste veckan', 'Förbered vårdkontakt', 'education', 5, 'Lista biverkningar i ordning.', '["Lista biverkningar","Notera när de kom","Notera intensitet"]', 'green'),
('Vad har ändrats?', 'Förbered vårdkontakt', 'education', 5, 'Sammanfatta perioden.', '["Sömn","Energi","Funktion","Mående"]', 'green'),
('Frågor jag vill ställa', 'Förbered vårdkontakt', 'education', 5, 'Skriv ner dina frågor i förväg.', '["Vad är jag osäker på?","Vad behöver jag veta?","Vad ber jag om?"]', 'green');
