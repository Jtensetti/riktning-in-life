
# Datadriven app: full pipeline från insamling → analys → råd → journal

## Vad som finns idag (kort utvärdering)

**Bra grund:**
- Daglig check-in samlar 11 dimensioner (mood, ångest, hopplöshet, sömn, funktion etc.)
- `activity_logs`, `exercise_sessions`, `medication_logs`, `weekly_forms` finns
- Deterministisk analys i `src/lib/metrics.ts` + `patterns.ts` (sömn→ångest, veckodags-dipp, lyftare/sänkare)
- `WeeklyReport` + `weekly-insight` edge function genererar AI-sammanfattning
- `journal_entries.include_in_report` finns

**Tydliga luckor:**
1. **Faktisk tid loggas inte** — `exercise_sessions` saknar `actual_duration_seconds`. Vi vet bara *planerad* tid.
2. **Biverkningar är gömda** — `side_effects_json` finns i schemat men inget UI använder det utanför Vård-formuläret. Daily-checkin loggar bara `medication_taken` (text), inte vilken medicin eller biverkningar.
3. **Aktivitetens effekt mäts inte rätt** — `mood_delta` på `activity_logs` sätts från katalog-default (statiskt), inte från faktisk skattning före/efter.
4. **Journal är frikopplad** — `exercise_sessions` och meningsfulla aktiviteter skrivs inte automatiskt in som journal-rader. Användaren måste manuellt skriva.
5. **Råd är statiska** — `recommend.ts`/`priorities.ts` finns men kopplas inte tillbaka till individens upptäckta mönster (`patterns.ts`). Vi vet att "X lyfter dig nästa dag" men föreslår inte X aktivt.
6. **Ingen aggregering över tid** — vi räknar veckovis on-demand. Ingen `daily_summary` eller `monthly_summary` cache → långsamt och svårt att se trender > 4v.

---

## Plan: 4 leveranser i ordning

### Fas A — Schema-förstärkningar (migrations)

**1. `exercise_sessions` — fånga faktisk tid + timer-läge**
```sql
ALTER TABLE exercise_sessions
  ADD COLUMN actual_duration_seconds integer,
  ADD COLUMN planned_duration_seconds integer,
  ADD COLUMN timer_mode text DEFAULT 'silent',  -- silent | breathing | none
  ADD COLUMN sequence_slug text,                -- vilken rutin steg ingick i
  ADD COLUMN sequence_step integer;
```

**2. `exercises` — per-övning timer-läge (du valde "valbart per övning")**
```sql
ALTER TABLE exercises
  ADD COLUMN timer_mode text DEFAULT 'silent';
-- Sed: andningsövningar → 'breathing', reflektion/journal → 'silent', läsning → 'none'
```

**3. `medication_logs` — strukturerade biverkningar + tid**
```sql
ALTER TABLE medication_logs
  ADD COLUMN taken_at timestamptz DEFAULT now(),
  ADD COLUMN severity integer; -- 0-10 totalt biverkningsbesvär, NULL = inte skattat
-- side_effects_json finns redan; vi standardiserar formatet:
-- [{slug:"trotthet", label:"Trötthet", severity:6}, ...]
```

**4. `activity_logs` — faktisk effekt**
```sql
ALTER TABLE activity_logs
  ADD COLUMN mood_before integer,    -- 0-10 om användaren skattar
  ADD COLUMN mood_after integer,
  ADD COLUMN energy_before integer,
  ADD COLUMN energy_after integer,
  ADD COLUMN actual_duration_minutes integer; -- den planerade ligger i duration_minutes
-- mood_delta blir då en derived: COALESCE(mood_after-mood_before, mood_delta)
```

**5. Ny tabell `daily_summaries` — cache för trender**
```sql
CREATE TABLE daily_summaries (
  user_id uuid NOT NULL,
  date date NOT NULL,
  burden numeric,        -- 0-100, från metrics.ts
  function numeric,
  recovery numeric,
  stability numeric,
  activities_count int,
  exercises_count int,
  exercises_actual_minutes int,
  medications_taken int,
  medications_missed int,
  side_effect_severity int,
  computed_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, date)
);
-- RLS: user läser/skriver egna rader
-- Skrivs av en edge function `recompute-day` som triggas vid relevanta inserts
```

**6. Ny tabell `recommendations_log` — vad föreslogs och vad funkade**
```sql
CREATE TABLE recommendations_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  source text NOT NULL,        -- 'pattern:lifter_delayed' | 'forecast:high_anxiety' | 'priority:sleep'
  payload jsonb NOT NULL,      -- {kind, headline, suggested_exercise_id, suggested_activity_slug}
  shown_at timestamptz DEFAULT now(),
  acted_on boolean DEFAULT false,
  acted_at timestamptz,
  outcome jsonb                 -- {mood_after, anxiety_after} ifyllt nästa dag
);
-- Möjliggör "vi föreslog promenad → du gick → måendet steg 1.5p" feedback-loop
```

---

### Fas B — Datainsamling i UI (komponenter)

**B1. Övningstimer som faktiskt mäter** — `src/pages/ExerciseDetail.tsx`
- `performance.now()` startar när "Börja" trycks, stannar vid "Klart"
- Render baseras på `exercises.timer_mode`:
  - `silent`: ingen klocka under övning, visa bara "Avsluta" — efteråt: *"Det tog 12 min av planerade 15."*
  - `breathing`: pulserande cirkel 4-2-6 + diskret minutvisare
  - `none`: ingen tidskomponent (för läsning)
- Spara `actual_duration_seconds`, `planned_duration_seconds`, `timer_mode` + `sequence_slug/step` om i rutin

**B2. MedicationQuickSheet** — ny komponent
- Bottom-sheet öppnas från:
  - Ny `MedicationsTodayCard` på Idag (visar ologgade aktiva mediciner)
  - FAB-action "Logga medicin"
- Per medicin: knappar `Tagit / Delvis / Missat` (1 tap → klar)
- "Biverkningar?" expanderar chips: Trötthet, Illamående, Yrsel, Sexuella, Sömnpåverkan, Annat + 0–10 slider för totalbesvär
- Skriver `medication_logs` med `taken_at`, `side_effects_json` (strukturerat), `severity`

**B3. Aktivitet med valbar för/efter-skattning** — `QuickLogPills.tsx` + `Checkin.tsx`
- Standard: 1 tap = loggat (som idag, ingen friktion)
- Long-press eller "Skatta effekt" → mini-skattning av mood/energy före, popup efter slut → fyller `mood_before/after`
- För meningsfulla aktiviteter ≥ 20 min visas en mjuk prompt efteråt: *"Hur känns det nu?"*

**B4. Auto-journal från sessioner** — ny edge-trigger eller client-side i `ExerciseDetail.complete()`
- När `exercise_sessions` skrivs: skapa `journal_entries` med `template_type='exercise_session'`, `body_json` = strukturerad data, `free_text` = användarens not (om finns), `include_in_report=true`
- Samma för medication-loggar med biverkningar (severity ≥ 4 → auto-journal som flagga till veckorapport)

---

### Fas C — Analys & dynamiska råd

**C1. `recompute-day` edge function**
- Triggas efter check-in/aktivitet/övning/medicin → räknar om `daily_summaries` för dagen
- Använder befintlig `metrics.ts`-logik server-side (port:a TS-funktionerna till Deno)
- Idempotent: kör om = samma resultat

**C2. Personlig forecast använder mönster aktivt** — `src/lib/recommend.ts`
- Idag: statiska prioriteringar
- Nytt: läs `patterns.ts`-output → om "promenad lyfter dig nästa dag" är ett detekterat mönster med sample ≥ 5 → föreslå promenad när morgon-burden är hög
- Logga förslaget i `recommendations_log` när det visas
- När nästa check-in kommer: matcha → fyll `outcome` → "Förra gången du följde detta råd: −1.5p tyngd"

**C3. Trend-aggregat för Vecka/Månad/3-mån vyer**
- `Week.tsx` läser från `daily_summaries` istället för on-demand-räkning
- Lägg till **MånadsTrend**-vy (4-veckors burden/function/recovery linjer)
- Sparkline-trender på Idag baseras på cache → snabbare

---

### Fas D — Skriv data till journal & rapport

**D1. Auto-journal-rader** (från B4):
- Övningar: *"Andning 4-2-6 — 12 min (planerat 15). Mood före 4 → efter 6. Anteckning: …"*
- Aktivitet med skattning: *"Promenad — 25 min faktiskt (planerat 30). Mood +2."*
- Medicin med biverkning: *"Sertralin 50mg — tagit. Biverkningar: trötthet (6/10), illamående (3/10)."*

**D2. WeeklyReport-utökning** — `src/pages/WeeklyReport.tsx` + `get_weekly_report`-funktion
- Lägg in: faktisk vs planerad övningstid, biverkningsindex per medicin, top-3 detekterade mönster, top-3 effektiva råd
- AI-prompten i `weekly-insight/index.ts` får denna data → nyanserade insikter på riktiga siffror

**D3. PDF-export** — utöka `pdfWidgets.ts` med biverkningstabell + mönster-summering så vården får en komplett bild

---

## Leveransordning

| Steg | Innehåll | Effekt direkt |
|------|----------|---------------|
| 1 | Fas A migrations (schema) | Inget UI-brott; nya kolumner är nullable |
| 2 | B1 timer + B2 medication sheet | Kvalitativ datakvalitet ↑ direkt |
| 3 | B3 för/efter-skattning + B4 auto-journal | Kausalitet kan börja mätas |
| 4 | C1 daily_summaries + C3 cache | Snabbare app, längre trender |
| 5 | C2 personliga råd + recommendations_log | Dynamiska, personliga råd |
| 6 | D2/D3 WeeklyReport + PDF utökning | Vård får djupare bild |

## Designprinciper som gäller hela vägen
- **Friktionsfritt först**: 1 tap räcker alltid. Skattning är opt-in (long-press / "Skatta effekt").
- **Aldrig prestationskrav**: Faktisk tid används för insikt, aldrig för att skämma ("du klarade bara 8 av 15 min"). Copy: *"Det tog den tid du behövde."*
- **Allt som skrivs till databasen visas senare**: ingen "tyst" data — användaren ser sin egen historik och kan radera.
- **Mönster behöver evidens**: minst 5 observationer + effektstorlek ≥ 1 skalsteg innan vi visar/föreslår (regeln finns redan i `patterns.ts`).
