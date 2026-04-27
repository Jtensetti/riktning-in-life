## Mål
En lugn, läsvänlig **analysvy** som svarar på frågan "Vad rör sig åt rätt håll den här veckan?" — inte ännu en dashboard. Bygger vidare på `valence.ts`, `metrics.ts` och `Sparkline`-primitiven som redan finns.

## 1. Ny route: `/analys`
- Rendera ny sida `src/pages/Analysis.tsx`.
- Lägg in route i `src/App.tsx` (`/analys` → `<Analysis />`).
- Behåll `/insikter` → `Week.tsx` som det rikare dashboard-läget. Lägg till en länk-knapp överst i `Week.tsx` ("Öppna analysvy") och en motsvarande tillbaka-länk i `Analysis.tsx`. Inga ändringar i bottom-navigationen — vi vill inte trycka in en sjätte flik.

## 2. Ny komponent: `MetricTrendCard`
Fil: `src/components/MetricTrendCard.tsx`. En `InsightCard`-baserad rad per mått:

- **Vänster:** ikon + svenskt mått-namn ("Oro", "Sömn", "Rörelse", "Energi", "Tyngd", "Funktion").
- **Mitten:** `Sparkline` (7-dagars värden, tone följer mått-färg).
- **Höger:** delta-chip via `formatDelta(metric, prevWeekMean, currWeekMean)` — grön när det går åt rätt håll, mjuk röd när det går åt fel håll, neutral annars. Använder befintlig `deltaChipClass`.
- **Under:** en mening: *"Lite mindre oro än förra veckan."* / *"Sömnen är ganska stabil."* / *"Du har rört på dig fler dagar."* Genereras av en ny `verdictFor(metric, before, after)` i `src/lib/analysis.ts`.

## 3. Ny modul: `src/lib/analysis.ts`
Ren, testbar logik (ingen UI):

- `weeklyMeans(checkins, metric)` → `{ current: number|null, previous: number|null }` baserat på `splitWeeks` (redan i `metrics.ts`).
- `movementWeeklyCount(checkins)` → andel dagar med rörelse (yes räknas 1.0, little 0.5) — så vi kan visa rörelse även fast det inte är en 0–10-skala.
- `verdictFor(metric, before, after)` → kort svensk mening, väljer ton via `improvementSign`. Tröskel ±0.5 räknas som "ganska stabil". Returnerar samma sats oavsett om värdet stiger eller sjunker — det är `improvementSign` som avgör om det är bra eller dåligt.
- `overallVerdict(deltas)` → räknar hur många mått som rör sig åt rätt håll och returnerar t.ex. *"3 av 5 mått pekar uppåt — främst sömn och oro."* Används som hjältetext överst på sidan.

Tester läggs i `src/test/analysis.test.ts` (verdict-strängar, riktning för lower/higher-better, gränsfall med < 3 datapunkter → "för lite data").

## 4. Innehåll i Analysis-sidan
Layout (mobil-first, samma `space-y-4`-rytm som övriga sidor):

1. **Header** via `ScreenHeader` ("Analys", grön ton, ikon `pie`).
2. **HeroCard** med `overallVerdict` + en mening om datatäckning ("baserat på X loggade dagar").
3. **`SparseDataNotice`** om < 4 dagar med data senaste veckan — då döljs delta-chipsen och vi visar bara sparklines med texten "Logga några dagar till så kan vi jämföra".
4. **Sektion "Vad förändras"** — lista av `MetricTrendCard` för:
   - Oro (`anxiety`, lower-better, blå)
   - Tyngd (`mood_heaviness`, lower-better, lila)
   - Sömn (`sleep_hours`, higher-better, lila)
   - Energi (`energy`, higher-better, gul)
   - Funktion (`function_score`, higher-better, grön)
   - Rörelse (egen kalkyl via `movementWeeklyCount`, higher-better, rosa)
5. **Sektion "Det här verkar hjälpa"** — återanvänder befintlig `buildLiftSummary` (från `lib/dayInsights.ts`) för att lista upp till 3 aktiviteter/övningar med störst genomsnittligt humörlyft, formaterat med samma valens-färger.
6. **Footer-länk** "Se hela veckodashboarden" → `/insikter`.

## 5. Datahämtning
- En `useEffect` som hämtar 14 dagars `daily_checkins` (för att kunna jämföra denna vecka mot förra), 30 dagars `activity_logs` + `exercise_sessions` (för lift-summary) — exakt samma queries som `Week.tsx` redan kör. Återanvänd typerna `Checkin` från `metrics.ts`.
- Inga schemaändringar, ingen migration, ingen ny edge function. Allt körs klient-sidan på data som redan loggas.

## 6. Testning
- `src/test/analysis.test.ts`: verdict-formuleringar, splitWeeks-integration, sparse-data-fallback.
- Kör `vitest` och `tsc --noEmit` innan jag rapporterar klart.

## Vad jag *inte* gör (för att hålla scopet)
- Ingen ny tabell, ingen RPC, ingen AI-call. Vi kan koppla på `weekly-insight`-edge-funktionen senare om du vill ha en LLM-skriven sammanfattning ovanpå.
- Ingen ändring av `BottomNav` — analysvyn nås från `Insikter`-fliken.
- `WeeklyReport` (PDF) lämnas orörd; den är klinikversionen.