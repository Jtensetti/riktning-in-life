## Vad vi redan har (bra grund)

Appen räknar redan på rätt saker — men siffrorna lever lite isolerat:

- **Veckomått**: `burdenScore`, `functionScore`, `recoveryScore`, `stabilityScore` (i `src/lib/metrics.ts`) — alla normaliserade 0–100 med PHQ-9/GAD-7-vikter när veckoformulär finns.
- **Riktning per dag**: `100 − burden` visas i `WeekDirectionChart`.
- **Mönster**: `generateInsights` letar enkla samband (rörelse → nästa dags oro, sömn <5h → oro, säng/soffa >120min → funktion).
- **Prioriteringar**: `buildPriorities` rankar 1–3 fokusområden från senaste 7 dagar.
- **Rekommendationer**: `recommendForToday` + `suggestedActions` gör tid-, väder-, energi-, längd- och repetitionsmedvetna val.

## Vad som saknas (det som faktiskt skulle hjälpa)

Det vi inte gör idag — och som datan redan tillåter:

1. **Vi mäter aldrig effekten av handling.** `exercise_sessions` har `mood_before/after`, `anxiety_before/after`, `energy_before/after` — men ingen vy summerar "vad som faktiskt lyfter dig". `topActivities` på Week tittar bara på `mood_delta` från `activity_logs`, inte på sessions.
2. **Veckoriktning saknar kontext.** Linjen visas, men användaren får inte veta *varför* en dag var bra/tung. Vi har all data per dag (sömn, rörelse, oro, mening, säng/soffa) — vi kan automatiskt peka på "bästa" och "tyngsta" dag och förklara skillnaden.
3. **Vi förutsäger inte morgondagen.** Vi vet att kort sömn → högre oro nästa dag, men vi använder det bara i efterhand i "Mönster vi ser". Vi skulle kunna säga **ikväll**: "Med 4h sömn igår är morgondagens oro ofta högre — här är en kvällsbuffert."
4. **Streak-data finns men kopplas inte till mående.** `countDaysInWindow` räknar dagar — men vi visar aldrig: "Veckor då du loggat ≥5 dagar har högre Riktning." Det skulle göra själva loggandet meningsfullt.
5. **Personlig baslinje saknas.** Alla tröskelvärden är hårdkodade (oro ≥6, sömn <5h, säng >120min). När baslinjen ≥14 dagar finns kan vi använda *användarens* median istället, så "hög oro" betyder "högt för dig".
6. **Lagrad insikts-rörelse.** `topActivities` visar 3 favoriter — men inte den motsatta sidan: "Dagar med >120min skärmtid sammanfaller med tyngre kvällar." (vi har inte skärmtid, men vi har säng/soffa, koffein-vana via aktiviteter, sociala mikrosteg etc.)

## Förslag — fyra spår, allt i bakgrunden, allt visas i befintlig stil

### Spår A — "Vad lyfter dig" (utöka, inte bygga om)
**Mattan:** Slå ihop `activity_logs.mood_delta` + uträknad delta från `exercise_sessions` (`mood_after − mood_before`, `anxiety_before − anxiety_after`). Vikta efter antal observationer (t-test-light: kräv minst 3 instanser innan en aktivitet räknas som "bevisad lyftare/sänkare"). 

**UI:** "Vad lyfte dig?" på Week visar redan top 3. Lägg till:
- En liten "evidence-chip": *"5 ggr · +1.8 humör"* (vi har redan datan, bara inte siffrorna).
- En lågmäld rad **under** topplistan: "Drog ner: …" (max 1 — bara om det är statistiskt tydligt). Aldrig skuldbeläggande copy: "Den här verkar ta mer än den ger."

### Spår B — "Veckans bästa & tyngsta dag" (förklarande riktning)
**Mattan:** Per-dag burden finns redan (`directionSeries` på Week). Plocka högsta och lägsta. För varje, jämför med veckosnittet på de 6 daglig-fält vi har — peka ut de 1–2 fält som avvek mest (t.ex. "sömn 8.2h vs snitt 6.1", "rörelse: ja vs sällan"). 

**UI:** Två små kort under `WeekDirectionChart`:
- 🟢 **Tisdag — bästa dagen** *"Du sov 8h och rörde på dig. Det syns."*
- 🟠 **Lördag — tyngst** *"Kort sömn + 180min stillasittande. Inget konstigt att det blev tungt."*

Konsekvent med "vi observerar, vi skuldbelägger inte"-tonen.

### Spår C — "Riktning ikväll" (prediktiv mikronudge)
**Mattan:** En enkel 3-dagars rolling regression (vi har redan korrelations-logiken i `generateInsights`). Räkna ut **förväntad oro/funktion imorgon** baserat på dagens loggade signaler:
- Sömn <5h igår → +1.4 oro imorgon (om sambandet finns i användarens data, annars genomsnitt).
- Rörelse idag → −1.0 oro imorgon.
- Säng/soffa >120min → −1.2 funktion imorgon.

**UI:** Ett nytt litet kort på **Today** efter klockan 19:00 (vi har `timeContext`):
> 💡 **Tipset till imorgon:** *"Du har sovit kort två nätter — ikväll skulle en kvällsritual göra mest skillnad."*

Bara om vi har minst 7 dagars data. Aldrig som larm — alltid som ett mjukt förslag som länkar till en konkret övning från `recommend.ts`.

### Spår D — "Personlig baslinje" (gradvis kalibrering)
**Mattan:** När `checkins.length >= 14`, beräkna användarens **median + IQR** för varje fält och spara i `localStorage` (eller en ny `user_baselines`-tabell — fråga om preferens). Trösklarna i `buildPriorities` och `recommend.ts` byts från hårdkodade till `median + 0.5 * IQR`.

**UI:** Ingen ny vy. Bara att "hög oro" plötsligt betyder "högt för dig". Ett litet bevis-band i Settings: *"Din baslinje är kalibrerad — förslagen är nu personliga."*

### Spår E (bonus) — "Logg-konsekvens × Riktning" 
**Mattan:** Korrelera `streakCounts.checkin` per vecka mot veckans `burdenScore`. Om r > 0.3 över 4+ veckor → en mjuk insikt.

**UI:** Lägg till i `generateInsights`: *"Veckor då du loggar ofta tenderar att kännas lättare."* Gör loggandet självmotiverande utan att tjata.

## Vad jag inte föreslår

- **Ingen AI-text-generering** av insikter. All copy är deterministisk, granskad, svensk, varm. (Vi har Lovable AI tillgängligt men risken för svajig ton är för hög här.)
- **Inga nya diagram-typer.** Vi använder befintliga `MetricBars`, `Sparkline`, `WeekDirectionChart`, `ChartCard`.
- **Ingen ny tabell** om vi inte måste — `localStorage` räcker för baslinjen i steg ett.
- **Inga procent-precisioner** ut till användaren ("47% bättre"). Allt formuleras som "tendens", "ofta", "verkar" — det är så vi pratar i appen idag.

## Frågor till dig innan vi bygger

Vill jag att vi kör **alla fem spår på en gång** (stort men sammanhållet), eller börjar med **Spår A + B + C** (det som ger mest synlig nytta direkt)? Ska personlig baslinje (Spår D) lagras i `localStorage` eller i en ny `user_baselines`-tabell i databasen så det följer med över enheter?
