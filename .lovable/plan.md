# Iterationsplan — Riktning

Inget ombyggt från grunden. Visuell riktning, modulnamn, navigering och datalager behålls. Detta är en **kurerings- och polishpass** som gör Today dynamisk-men-lugn, fyller i några saknade fält, och städar några påtagliga svagheter i Vård/medicin/krisplan.

Brief:en täcker nästan hela appen. Jag har grupperat förslagen i tydliga vågor så du kan stryka det du inte vill ha. Jag rekommenderar att vi kör **Våg 1 + Våg 2** i en omgång och låter Våg 3 + 4 vänta tills vi sett resultatet.

---

## Våg 1 — Today som kuraterad startsida (kärnan i briefen)

**Mål:** "max 5 synliga block innan scroll, en primär handling, max 2 sekundära." Idag visar `Today.tsx` typiskt 8–10 block (state, quick log, ForYou-karusell, evening prediction, forecast + evidence, klinisk veckorapport-genväg, rec, dagens rutin, learn, veckans riktning, senaste aktivitet). Allt finns kvar — men vi sätter en **synlig prioriteringsmotor** ovanför alla optional moduler.

### 1.1 Ny `src/lib/todayLayout.ts` — modulväljare
Ren funktion (testbar) som tar `{ checkin, time, weather, recent7, picks, forecast, eveningPrediction, baselineDays, hasReport, daysSinceLastSeen, safetyFlag }` och returnerar en ordnad lista av `ModuleId`:
- `header`, `safety`, `weatherPermission`, `streak`, `eveningWindDown`, `state`, `quickLog`, `primary`, `forYou`, `eveningPrediction`, `forecast`, `reportShortcut`, `todayRoutine`, `learn`, `weekDirection`, `latestActivity`.

Regler (deterministiska, dokumenterade i kommentarer):
- **Säkerhetsläge** ⇒ `safety` + `state` + `quickLog` only. Allt annat döljs.
- **Frånvaro 3+ dagar** (`lastSeen`) ⇒ Header-greeting redan klar; lägg till compact "Välkommen tillbaka"-mikrokort ovanför state. Hide forecast/learn.
- **Inget check-in idag** ⇒ Primary = "Logga dagen" (tona som idag), häng på en *enda* sekundär (time-of-day mikrohandling). Hide weekDirection, learn, todayRoutine.
- **Check-in finns** ⇒ Primary = från `recommend()` (befintlig). Tillåt max 2 sekundära av: `forYou`, `eveningPrediction|forecast`, `todayRoutine`, `learn`, `reportShortcut` — vald av prioritet nedan.
- **Sekundär-prioritet** (välj topp 2 i ordning): `eveningPrediction` > `forecast` > `todayRoutine` (om matchar partOfDay) > `forYou` > `reportShortcut` (bara om PHQ/GAD due eller ≥7d sedan export) > `learn`.
- **Baseline < 14 dgr** ⇒ Hide `weekDirection`, visa istället en kompakt baseline-rad ("Dag X av 14") under state.
- **`reportShortcut`** visas inte dagligen — bara: (a) inga export senaste 14 dagarna OCH ≥7 dagar med data, eller (b) PHQ-9/GAD-7 förfallen (>14 dgr), eller (c) `safety_status` ≠ none senaste 7d. Annars dolt.
- **`learn`** högst 1, aldrig ovanför primary. Roteras (befintlig logik), men endast om vi har plats kvar i sekundär-budgeten.

### 1.2 `Today.tsx` — refaktor mot module map
- Behåll all rendering-JSX för varje modul, men flytta dem till en `MODULE_RENDERERS: Record<ModuleId, () => JSX>` map.
- Rendera bara det som `todayLayout` returnerar.
- Resultat: filen blir mindre, dynamiken blir explicit och testbar, inga visuella ändringar för det som faktiskt visas.

### 1.3 Tydligare *time-of-day primary* när check-in saknas
Idag väljer `recommend()` även när `checkin == null`. Vi:
- Behåller `recommend()` för "rekommenderat-just-nu"-kortet.
- Lägger till **"Välj en liten start"** mikro-band (3 chips) under state-kortet bara när `!checkin`, mappad mot partOfDay (morgon: 3 min upp / 8 min start / dagsljus 15; dag: snabblogg / rörelse 10 / bryt ältande; kväll: tre rader / kvällslandning / spara dagen; natt: andning 4 / imorgon-lista). Chipsen länkar redan rätt — bara ny copy + filtrering på partOfDay i en hjälpare `src/lib/quickStarts.ts`.

### 1.4 Test
Lägg till `src/test/todayLayout.test.ts` med 8–10 fall (safety, no-checkin morning, evening with low sleep, returnee 3+d, baseline-not-ready, etc.). Snabba enhetstester.

**Filer:** `src/lib/todayLayout.ts` (ny), `src/lib/quickStarts.ts` (ny), `src/pages/Today.tsx` (refaktor), `src/test/todayLayout.test.ts` (ny).

---

## Våg 2 — Klinisk integritet (snabba vinster)

### 2.1 Medicinduplikatskydd
Briefen: "Prevent duplicate active medication with same name + dose."
- I `Vard.tsx` `addMed`: innan insert, kör `select` på `(user_id, name ILIKE ?, coalesce(dose,'') = ?, active = true)`. Om träff: visa toast "Den här medicinen finns redan aktiv." och avbryt.
- Lägg också på en **partial unique index** i migration: `CREATE UNIQUE INDEX medications_user_active_namedose_uq ON public.medications (user_id, lower(name), coalesce(lower(dose),'')) WHERE active = true;`
- I daglig medicinlogg: bara visa aktiva mediciner (det görs redan? — verifiera och fix om inte).

### 2.2 Krisplan: kollapsbara sektioner + akut alltid öppen
- Använd existerande `components/ui/collapsible.tsx`. Wrappa varje sektion (varningssignaler, vad hjälper, undvik, stödpersoner, professionella, säkra platser, skäl att fortsätta) i `Collapsible`. **Akut/professionella kontakter** är defaultöppen.
- Lägg till statiskt mikro-block överst med 112 / 1177 / Mind 90101 / Jourhavande medmänniska 08-702 16 80 (klickbara `tel:`-länkar).
- Liten varningsremsa: "Kontrollera att telefonnummer och kontakter stämmer."

### 2.3 Rapport — ärligare tomt läge
- I `WeeklyReport.tsx` och `Vard.tsx` rapport-fliken: om `daysWithData < 3` eller ingen weekly_form senaste 30 dgr ⇒ visa block:
  > "För lite data ännu. Rapporten blir mer användbar efter några dagars loggning och minst en veckoskattning."
  Och inaktivera "Generera PDF" med tooltip-text (men tillåt alltid manuell override-knapp "Generera ändå").

### 2.4 PHQ-9 fråga 9 follow-up
- Efter spara av PHQ-9 där svar #9 > 0: visa modal/sheet med tre val (Öppna krisplan / Lägg till anteckning till rapport / Fortsätt). Anteckning sparas som `journal_entries` med `template_type = "report_note"` och `include_in_report = true`.

**Filer:** `src/pages/Vard.tsx`, `src/pages/CrisisPlan.tsx`, `src/pages/WeeklyReport.tsx`, ny migration `add_medications_unique_active`, ev. liten `<SafetyFollowUpSheet/>`.

---

## Våg 3 — Väder som data (inte bara dekor)

Briefen ber om explicit fältset. Idag finns bara `weather_kind` + `weather_temp_c`. Förslag:

### 3.1 Migration — utöka `daily_checkins`
```sql
ALTER TABLE public.daily_checkins
  ADD COLUMN IF NOT EXISTS daylight_level text,         -- low|medium|high
  ADD COLUMN IF NOT EXISTS precipitation text,          -- none|light|heavy
  ADD COLUMN IF NOT EXISTS weather_source text,         -- automatic|manual|none
  ADD COLUMN IF NOT EXISTS weather_location_label text;
```
(Vi mappar Open-Meteo: `daylight_level` från `is_day` + month/UV-proxy; `precipitation` från weather_code-buckets.)

### 3.2 `lib/weather.ts` — utökad `Weather` + en hjälpare `toCheckinFields(w, source)`.

### 3.3 `Checkin.tsx` — skriver de nya fälten vid spara.

### 3.4 (Senare, inte nu) Veckans väder-insikt
Bara om ≥10 dagar med både weather + checkin: snäll insikt på Vecka-tabben ("Dagar med lågt dagsljus sammanfaller ofta med lägre energi"). Märkt explicit som "preliminärt" — ingen kausalitet.

**Filer:** ny migration, `src/lib/weather.ts`, `src/pages/Checkin.tsx`. Inget UI-byte i Today (`WeatherChip` förblir).

---

## Våg 4 — Polish som väntar (inte nu om vi inte hinner)

Listas så du vet att jag sett dem; lägg till med en kommentar om du vill ha med dem nu istället för senare.
- **Quick log Mood-modal** — finns redan i Pills, ingen åtgärd om vi inte vill bygga ut SömnQuick / RörelseQuick / MedicinQuick som dedikerade bottom sheets med chips (5/6/7/8/9 timmar etc.). Stor i scope.
- **Activity picker — gruppering + "Senast använda" + "Skapa egen"** — meningsfullt men ~en halv dag ensamt.
- **Checkin: kollapsbara sektioner** (Mående / Vardag / Säkerhet+Anteckning) — låg risk men skiftar layout märkbart, vill helst göra som egen runda.
- **Typografi: Nunito Sans** — kräver byte av font-stack i `tailwind.config.ts` + verifiera kontrast/vikt på alla kort. Egen runda.
- **Vecka-tabben: tomma chart-skeletons med förklarande text** istället för dotted blanka diagram — verifiera först vad som faktiskt visas vid 0 datapunkter.
- **Journal: "markera för vårdrapport"-toggle direkt i listan** — finns delvis (`include_in_report`-fält). Kan göra om brieferna prioriterar.

---

## Vad som *inte* görs i den här rundan (medvetet)
- Ingen ombyggnad av navigationen — 5 tabs är redan rätt.
- Ingen ny `weather_logs`-tabell. Vädret bor på `daily_checkins` (en rad per dag räcker tills vi vet att vi behöver tidsserier per timme).
- Ingen ändring av baseline-algoritm eller recommend-scoring — de fungerar.

---

## Leverans
**Föreslagen scope för kommande implementation: Våg 1 + Våg 2 + Våg 3.** Ger den största upplevelsemässiga effekten ("Today väljer åt mig") plus stänger två tydliga kliniska luckor (medicin-dedupe, ärligt rapport-tomtläge) och fyller i väderfälten utan UI-skifte.

Säg till om du vill stryka något, eller dra in delar av Våg 4.
