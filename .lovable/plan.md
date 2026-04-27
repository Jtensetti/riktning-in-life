
# Plan — Tre spår som hänger ihop

Allt som ändras här rör **logik och data**, inte design. UI-komponenter får färgad chip/text via befintliga klasser från `valence.ts` (`deltaChipClass`, `formatDelta`) — inga nya färger eller layouter.

---

## Spår 1 — Koppla in valens i hela kedjan

### 1a. `src/lib/patterns.ts`
- Använd `improvementSign`/`directionOf` istället för hårdkodade `diff > 0 = negative`-villkor.
- Per detektor mappas mönstret till **rätt valens-metric** så `direction` blir konsekvent:
  - `sleep_next_day_anxiety` → `anxiety` (lower-better)
  - `weekday_dip` → burden (lower-better)
  - `stillness_heaviness` → `mood_heaviness`
  - `med_miss_next_day` → `mood_heaviness`
  - `lifter_delayed` / `drainer_next_day` → burden-baserat (lower-better)
- Lägg till `metric: string` på `Pattern` så UI kan visa rätt chip-färg via `deltaChipClass`.

### 1b. `src/components/PatternsSection.tsx`
- Byt hårdkodad `bg-green-recovery` / `bg-cream-card` mot färg via `deltaChipClass(tone)` på en liten delta-pille.
- Behåll Trending-ikon, men välj `Up`/`Down` baserat på `improvementSign` istället för `direction`.

### 1c. `src/pages/WeeklyReport.tsx`
- Ersätt egen `fmtTrend`/`fmtTrendInt` med `formatDelta(metric, prev, cur)` så +/- och färg är konsekvent med övriga appen.
- Mappa fält → metric: `sleep_hours`, `movement` (via "energy"-fallback), `adherence` (higher-better).
- I PDF-generatorn används samma `improvementSign` för pilriktning så grön=förbättring även när siffran sjunker (oro, tyngd).

### 1d. `src/lib/recommend.ts`
- `EffectHistory.avgDelta` är idag tolkad som "positivt = lyfter". Lägg till `metric`-fält per stat och beräkna lift med `improvementSign(metric, delta)` så att t.ex. en sänkning av oro räknas som lyft (idag missar vi det).
- Justera `scoreExercise` så bias räknas på `improvedSign * |avgDelta|`.

### 1e. Test
- Utöka `valence.test.ts` med pattern- och recommend-cases.

---

## Spår 2 — Smartare analyser, journal-koppling, datainsamling

### 2a. Analys-kompletteringar (`src/lib/analysis.ts`)
- **Datatäckning per metric**: rapportera `coverage` (antal dagar med värdet) så sparkline med 2 punkter inte skriker "stabilt".
- **Confidence-flagga**: `low` om n<3 i någon vecka, `medium` 3-5, `high` 6-7. UI kan dölja verdict när `low`.
- **Korrelations-light**: enkel parvis korrelation mellan `sleep_hours→anxiety_next_day`, `movement→energy`, `daytime_bed_sofa→mood_heaviness`. Ren funktion — testbar.
- **"Det här verkar hjälpa"**: byt till valens-baserad lift (oro-sänkning räknas) och kräv `n≥3`.

### 2b. Auto-journal-koppling
- Ny `src/lib/autoJournal.ts`:
  - `buildExerciseJournalDraft(session, before, after)` → kort svensk text:  
    *"Andning 4-7-8 — oro 6 → 4 (förbättring 2 steg)"*.
  - `buildActivityJournalDraft(activity, mood_delta)` → liknande.
- `ExerciseDetail.tsx` & `ActivityPicker.tsx`: efter spara, om användaren har `auto_journal=true` (ny `user_settings.flags`-jsonb), skapa `journal_entries`-rad med `template_type='auto_session'` och `include_in_report=true`.
- Lägg till toggle i Settings: "Skapa journal automatiskt från övningar/aktiviteter" (default på).

### 2c. Datainsamling som är low-friction
Värden vi enkelt kan börja samla (allt valfritt):
- **`exercise_sessions`**: redan har before/after — säkerställ att alla 3 dimensioner (mood/energy/anxiety) skickas (idag bara delvis i ExerciseDetail). Pre-fill av "after" = "before" finns redan.
- **`activity_logs.energy_before/after`**: ActivityPicker frågar bara mood. Lägg till en valfri "Hur orkar du nu?"-pille (1 tap) så vi får energi-deltan också.
- **`daily_checkins.context`** (ny jsonb-kolumn via migration): plats (hemma/jobb/ute), socialt (ensam/sällskap), koffein-tröskel. Helt valfritt — hjälper mönsterdetektorn.

### 2d. Journal-relevans
- I `journal_entries`-listan: visa chip "kopplad till oro -2" baserat på `linked_checkin_id` + valens.
- Auto-genererade rapport-kandidater: posts med stor förbättring (|delta|≥2) flaggas `suggested_for_report=true`.

### 2e. "Relevant för mig" (personalisering)
- `src/lib/relevance.ts`: scorar kort/insikter mot:
  - Senast loggade smärtpunkt (högsta värde i senaste check-in)
  - Tid på dygnet (`getTimeContext`)
  - Kända lyftare från `EffectHistory`
- Today-feed och Explore filtrerar/sorterar via denna score (inga nya UI-block, bara annan ordning).

---

## Spår 3 — Dynamisk app som uppdaterar sig själv

### 3a. Tick-loop när appen är öppen
- Ny `src/hooks/useAppTick.ts`: `setInterval` var 60s + `visibilitychange`-lyssnare.
- Returnerar `{ now, partOfDay, justBecameVisible }`.
- `Today.tsx` använder den för att:
  - Räkna om greeting/forecast vid 05/10/14/17/22-gränser utan reload.
  - Trigga refetch av `daily_checkins`/`activity_logs` när `justBecameVisible=true` (debounce 5s).

### 3b. Realtime på de tre huvudtabellerna
- Migration: `ALTER PUBLICATION supabase_realtime ADD TABLE daily_checkins, activity_logs, exercise_sessions, medication_logs;` + `REPLICA IDENTITY FULL`.
- Ny `src/hooks/useLiveData.ts`: subscriberar på `postgres_changes` filtrerat på `user_id=eq.<uid>`. Invaliderar relevanta hooks (`useRecentCheckins`, `useRecentActivities`).
- Dvs: loggar du via en annan enhet → Today uppdateras direkt.

### 3c. Background refresh (även när appen ligger i bakgrunden)
- Service worker via Vite PWA-plugin (lättviktig setup, ingen UI-ändring):
  - Periodic background sync där webbläsaren stödjer det.
  - Vid `online`-event: kör en `prefetchToday()` så cache är varm.
- Cachepolicy: `daily_checkins` senaste 28d, `activities/exercises`-katalog stale-while-revalidate.
- För iOS Safari (saknar periodic sync): kör `prefetchToday()` på `pageshow` + `focus` istället.

### 3d. Edge function: nightly precompute
- `supabase/functions/nightly-precompute/index.ts` (cron 03:00 UTC):
  - Räknar `daily_summaries` för gårdagen per användare.
  - Räknar mönster + sparar i ny `cached_insights`-tabell (jsonb) så Today/Analys laddar instant.
  - Skickar inga notiser i denna iteration.
- pg_cron-job sätts upp via SQL (med projektets URL/anon-key, inte i migration).

### 3e. Smart "ny data sedan du var här"-prompt
- `useLastSeen` finns redan. Lägg till en liten räknare i Today: "3 nya loggar sedan i går kl 18". Ingen modal — bara en chip på header.

---

## Migrationer som behövs
1. `user_settings.flags jsonb default '{"auto_journal":true}'`
2. `daily_checkins.context jsonb null`
3. `journal_entries.suggested_for_report boolean default false`
4. `cached_insights` (user_id, kind, payload jsonb, computed_at) + RLS
5. `ALTER PUBLICATION supabase_realtime ADD TABLE …` + `REPLICA IDENTITY FULL`

## Edge function
- `nightly-precompute` (verify_jwt=false, anropas av pg_cron med service role).

## Filer som skapas
- `src/hooks/useAppTick.ts`, `src/hooks/useLiveData.ts`
- `src/lib/autoJournal.ts`, `src/lib/relevance.ts`
- `src/test/patterns.valence.test.ts`, `src/test/autoJournal.test.ts`
- `supabase/functions/nightly-precompute/index.ts`
- Vite PWA-config i `vite.config.ts` + `public/sw.js` (autogenererad)

## Filer som uppdateras
- `src/lib/patterns.ts`, `src/lib/recommend.ts`, `src/lib/analysis.ts`
- `src/components/PatternsSection.tsx`, `src/pages/WeeklyReport.tsx`
- `src/pages/Today.tsx`, `src/pages/ExerciseDetail.tsx`, `src/components/ActivityPicker.tsx`
- `src/pages/Settings.tsx` (auto-journal toggle)

---

## Vad som **inte** ingår
- Inga design- eller layout-förändringar (bara nya chips/text via befintliga utility-klasser).
- Inga push-notiser (kräver separat opt-in, gör vi i nästa runda).
- Ingen AI-skriven sammanfattning (befintlig `weekly-insight` rörs inte).

Säg till om du vill skala ner — t.ex. hoppa över PWA/service worker eller migrationen för `context` — så krymper jag scopet.
