-- Catalog of suggested activities (read-only for users)
CREATE TABLE public.activity_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  category text NOT NULL,
  icon text NOT NULL DEFAULT 'spark',
  color text NOT NULL DEFAULT 'orange',
  tags_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_minutes integer NOT NULL DEFAULT 30,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read activity catalog"
  ON public.activity_catalog
  FOR SELECT
  TO authenticated
  USING (true);

-- User activity logs
CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  activity_slug text NOT NULL,
  label text NOT NULL,
  category text NOT NULL,
  icon text NOT NULL DEFAULT 'spark',
  color text NOT NULL DEFAULT 'orange',
  duration_minutes integer,
  mood_delta integer,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_user_date ON public.activity_logs(user_id, date DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own activity logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own activity logs"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own activity logs"
  ON public.activity_logs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own activity logs"
  ON public.activity_logs FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Seed catalog (~60 activities, 7 categories)
INSERT INTO public.activity_catalog (slug, label, category, icon, color, default_minutes, sort_order, tags_json) VALUES
-- Rörelse & kropp
('promenad', 'Promenad', 'Rörelse & kropp', 'bike', 'pink', 30, 10, '["movement","outdoor"]'),
('langpromenad-skog', 'Långpromenad i skogen', 'Rörelse & kropp', 'bike', 'green', 60, 11, '["movement","outdoor","nature"]'),
('jogg', 'Jogg', 'Rörelse & kropp', 'bike', 'pink', 30, 12, '["movement","outdoor"]'),
('cykla', 'Cykla', 'Rörelse & kropp', 'bike', 'pink', 45, 13, '["movement","outdoor"]'),
('simma', 'Simma', 'Rörelse & kropp', 'bike', 'blue', 45, 14, '["movement"]'),
('styrketraning', 'Styrketräning', 'Rörelse & kropp', 'spark', 'pink', 45, 15, '["movement"]'),
('gym', 'Gymmet', 'Rörelse & kropp', 'spark', 'pink', 60, 16, '["movement"]'),
('stretch-yoga', 'Stretching / yoga', 'Rörelse & kropp', 'heart-pulse', 'purple', 20, 17, '["movement","calm"]'),
('padel-tennis', 'Padel / tennis', 'Rörelse & kropp', 'spark', 'pink', 60, 18, '["movement","social"]'),
('bollsport-barn', 'Bollsport med barnen', 'Rörelse & kropp', 'spark', 'orange', 30, 19, '["movement","family"]'),

-- Utomhus & natur
('kaffe-i-solen', 'Kaffe i solen', 'Utomhus & natur', 'weather-sun', 'orange', 15, 20, '["outdoor","calm","joy"]'),
('sitta-altan', 'Sitta på altanen', 'Utomhus & natur', 'weather-sun', 'orange', 20, 21, '["outdoor","calm"]'),
('fiska', 'Fiska', 'Utomhus & natur', 'spark', 'blue', 90, 22, '["outdoor","calm","mastery"]'),
('vedhuggning', 'Vedhuggning', 'Utomhus & natur', 'spark', 'green', 30, 23, '["outdoor","movement","mastery"]'),
('bar-svamp', 'Bär- eller svampplockning', 'Utomhus & natur', 'spark', 'green', 60, 24, '["outdoor","nature","mastery"]'),
('fagelskadning', 'Fågelskådning', 'Utomhus & natur', 'eye-closed', 'green', 30, 25, '["outdoor","calm","nature"]'),
('grilla', 'Grilla', 'Utomhus & natur', 'spark', 'orange', 60, 26, '["outdoor","family","joy"]'),
('bada-natur', 'Bada (sjö/hav)', 'Utomhus & natur', 'spark', 'blue', 30, 27, '["outdoor","joy"]'),
('bastu', 'Bastu', 'Utomhus & natur', 'heart-pulse', 'orange', 45, 28, '["calm","joy"]'),
('skogspromenad', 'Skogspromenad utan mobil', 'Utomhus & natur', 'eye-closed', 'green', 45, 29, '["outdoor","calm","nature"]'),

-- Villa & trädgård
('tradgardsarbete', 'Trädgårdsarbete', 'Villa & trädgård', 'spark', 'green', 60, 30, '["outdoor","mastery","movement"]'),
('klippa-gras', 'Klippa gräs', 'Villa & trädgård', 'spark', 'green', 45, 31, '["outdoor","mastery","movement"]'),
('snoskottning', 'Snöskottning', 'Villa & trädgård', 'weather-snow', 'blue', 30, 32, '["outdoor","mastery","movement"]'),
('meka-bil', 'Meka med bilen', 'Villa & trädgård', 'spark', 'orange', 60, 33, '["mastery"]'),
('bygga-snickra', 'Bygga eller snickra', 'Villa & trädgård', 'spark', 'orange', 60, 34, '["mastery"]'),
('mala-om', 'Måla om något', 'Villa & trädgård', 'pencil-soft', 'orange', 90, 35, '["mastery"]'),
('reparera', 'Reparera något som varit trasigt', 'Villa & trädgård', 'spark', 'orange', 30, 36, '["mastery"]'),
('plantera', 'Plantera eller så', 'Villa & trädgård', 'spark', 'green', 30, 37, '["outdoor","mastery"]'),

-- Familj & nära
('lek-barn', 'Lek med barnen', 'Familj & nära', 'blob-smile', 'orange', 30, 40, '["family","joy"]'),
('godnattsaga', 'Läsa godnattsaga', 'Familj & nära', 'bookmark-soft', 'purple', 15, 41, '["family","calm"]'),
('matlaga-barn', 'Matlaga med barnen', 'Familj & nära', 'spark', 'orange', 45, 42, '["family","mastery"]'),
('bilresa-ett-barn', 'Bilresa med ett barn', 'Familj & nära', 'blob-smile', 'orange', 30, 43, '["family"]'),
('date-fru', 'Date-kväll med frun', 'Familj & nära', 'heart-pulse', 'pink', 90, 44, '["social","joy"]'),
('fika-utan-skarmar', 'Fika utan skärmar', 'Familj & nära', 'blob-smile', 'orange', 20, 45, '["family","calm"]'),
('lego', 'Bygga lego', 'Familj & nära', 'spark', 'orange', 30, 46, '["family","mastery"]'),
('bradspel', 'Spela brädspel', 'Familj & nära', 'spark', 'yellow', 45, 47, '["family","joy"]'),
('bada-barnen', 'Bada barnen utan stress', 'Familj & nära', 'blob-smile', 'blue', 30, 48, '["family","calm"]'),

-- Social kontakt
('ringa-van', 'Ringa en gammal vän', 'Social kontakt', 'heart-pulse', 'pink', 20, 50, '["social"]'),
('fika-granne', 'Fika med granne', 'Social kontakt', 'blob-smile', 'orange', 30, 51, '["social"]'),
('hjalpa-nagon', 'Hjälpa någon', 'Social kontakt', 'heart-pulse', 'pink', 30, 52, '["social","mastery"]'),
('match', 'Gå på match', 'Social kontakt', 'spark', 'orange', 120, 53, '["social","joy"]'),
('foreningsmote', 'Föreningsmöte', 'Social kontakt', 'spark', 'orange', 60, 54, '["social"]'),
('skicka-meddelande', 'Skicka ett meddelande till någon', 'Social kontakt', 'heart-pulse', 'pink', 5, 55, '["social"]'),

-- Mästring & mening
('laga-middag', 'Laga en god middag', 'Mästring & mening', 'spark', 'orange', 45, 60, '["mastery","family"]'),
('slutfora-smasak', 'Slutföra en småsak du skjutit upp', 'Mästring & mening', 'flag', 'green', 20, 61, '["mastery"]'),
('lara-nytt', 'Lära dig något nytt', 'Mästring & mening', 'bookmark-soft', 'yellow', 30, 62, '["mastery"]'),
('skriva-dagbok', 'Skriva i dagboken', 'Mästring & mening', 'pencil-soft', 'yellow', 10, 63, '["calm"]'),
('musik-betyder', 'Lyssna på musik som betyder något', 'Mästring & mening', 'play-soft', 'purple', 20, 64, '["calm","joy"]'),
('instrument', 'Spela ett instrument', 'Mästring & mening', 'play-soft', 'purple', 30, 65, '["mastery","joy"]'),

-- Lugn glädje
('langt-bad', 'Långt bad', 'Lugn glädje', 'heart-pulse', 'blue', 30, 70, '["calm","joy"]'),
('lasa-bok', 'Läsa en bok', 'Lugn glädje', 'bookmark-soft', 'yellow', 30, 71, '["calm","joy"]'),
('podd', 'Lyssna på podd', 'Lugn glädje', 'play-soft', 'purple', 45, 72, '["calm"]'),
('film-med-frun', 'Titta på en film med frun', 'Lugn glädje', 'play-soft', 'pink', 120, 73, '["social","joy"]'),
('hangmatta', 'Ligga i hängmattan', 'Lugn glädje', 'moon-soft', 'orange', 20, 74, '["calm","outdoor","joy"]'),
('bara-vara', 'Bara vara', 'Lugn glädje', 'blob-smile', 'yellow', 10, 75, '["calm"]');