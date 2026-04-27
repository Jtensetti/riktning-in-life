
## Mål
1. **Förifyllt "efter"-värde**: I `ExerciseDetail.tsx` ska `after`-state initieras med `before`-värdena när användaren går från fas `before` → `doing`. Då börjar slidern på samma punkt och man kan medvetet dra ner (oro) eller upp (energi/mående).
2. **Valens-modell**: Inför en gemensam definition av vilka mått som är "bra att de minskar" (oro, tyngd, hopplöshet, skuld, säng/soffa-tid, biverkningar, missade meds) vs "bra att de ökar" (energi, mående, sömnkvalitet, funktion, WHO-5, faktisk övningstid, genomförda aktiviteter). Använd den överallt: i analys, deltavisning, dynamiska råd, journalsammanfattningar.

## Ändringar

### A. `src/pages/ExerciseDetail.tsx` — förifylld efter-skattning
- När knappen "Kör igång" trycks (övergång `before → doing`): `setAfter({ ...before })` så slidrarna startar där användaren var.
- Visa visuell hint i `after`-fasen: pilen/talet bredvid värdet visar delta jämfört med `before` med rätt valens-färg (grön = förbättring, neutral = oförändrad, mjuk röd = försämring) — inte värderande, bara informativt.
- `SliderRow` får valfri prop `before?: number` + `direction: "lower-better" | "higher-better"` för att rendera den lilla deltachippen.
- Spara även `delta` (after − before) i `note`-meta är inte nödvändigt — vi har redan både before/after-kolumner; deltat beräknas i analyslagret.

### B. Ny fil `src/lib/valence.ts` — central sanning
Exportera:
```ts
export type Direction = "lower-better" | "higher-better" | "neutral";
export const METRIC_DIRECTION: Record<string, Direction> = {
  // checkin / övning
  anxiety: "lower-better",
  mood_heaviness: "lower-better",
  hopelessness: "lower-better",
  guilt_selfcriticism: "lower-better",
  daytime_bed_sofa_time_minutes: "lower-better",
  // bra att öka
  mood: "higher-better",            // mood-after på övning (positiv skala)
  energy: "higher-better",
  sleep_hours: "higher-better",
  sleep_quality: "higher-better",
  function_score: "higher-better",
  getting_started: "higher-better",
  // medication / aktivitet
  side_effect_severity: "lower-better",
  medications_missed: "lower-better",
  medications_taken: "higher-better",
  exercises_actual_minutes: "higher-better",
  activities_count: "higher-better",
};
export const isImprovement = (metric: string, before: number, after: number): "better" | "worse" | "same";
export const improvementSign = (metric: string, delta: number): 1 | 0 | -1; // för färg/ikon
export const formatDelta = (metric: string, before: number, after: number): { text: string; tone: "good" | "bad" | "neutral" };
```

### C. `ExerciseDetail.tsx` + `ActivityPicker.tsx` — använd valens
- Övning: SliderRow renderar `formatDelta("anxiety", before, after)` för oro (lägre=bättre), för energi/mood (högre=bättre).
- ActivityPicker har redan `mood_delta` (-2..+2) — markera tydligt med samma färgsystem i bekräftelse-vyn att +1/+2 är "bra".

### D. `src/lib/metrics.ts` — exponera session-effekt
Lägg till hjälpare som aggregerar exercise_sessions:
- `sessionEffect(sessions)`: medel-delta per dimension med valens applicerad ⇒ % förbättring.
- Inkluderas i `daily_summaries`-beräkning (befintligt schema har redan `exercises_count`, `exercises_actual_minutes`; vi *läser* bara — ingen schemaändring).

### E. `src/lib/recommend.ts` + `dayInsights.ts` — dynamik baserat på valens
- "Vandring sänkte din oro med 2 i snitt senaste veckan" (lower-better förbättring).
- "Övningar du genomför längre än planerat ger större energi-lyft" (kombinerar `actual_duration_seconds > planned` med energi-delta).
- Logga visade rekommendationer i `recommendations_log` (tabellen finns).

### F. Patterns / Journal / WeeklyReport
- `PatternsSection` + `WeeklyReport` ska använda `formatDelta` så att alla pilar/färger blir konsekventa (grön = bra, oavsett om det är en upp- eller nedåtgående linje).
- Auto-journal från övningssessioner: skriv "Oro 6 → 4 (−2, bra)" i `body_json` med valens-tecknet bestämt av `valence.ts`.

### G. Tester
- `src/test/valence.test.ts`: enhetstest för `isImprovement` per metrik.
- Uppdatera `todayLayout.test.ts` om någon assertion påverkas.

## Resultat för användaren
- **Direkt**: efter-slidern startar på samma siffra som före — naturligt att dra ner oron.
- **På sikt**: alla deltavisningar (övningar, aktiviteter, vecka, journal, dynamiska tips) använder samma "bra/dåligt"-logik så appen känns konsekvent och datadriven.

## Inga schemaändringar
Allt detta använder befintliga kolumner (`*_before`, `*_after`, `mood_delta`, `actual_duration_seconds`, `severity`). Ingen migration behövs.
