# Granskning + förbättringsplan: smartare data, samma design

Designen rör vi inte. All förbättring sker i datalager, beräkningar, edge functions, vårdrapport och hur befintliga ytor *fylls* med innehåll.

## Vad appen redan gör bra

- **Insamling**: check-ins (oro, tyngd, energi, sömn, funktion, säkerhet, skuld, hopplöshet, läkemedel, rörelse, meningsfullt), aktivitetsloggar med före/efter-värden, övningssessioner med före/efter-värden, läkemedelsloggar med biverkningar, journaler, vecko-skattningar (PHQ-9, GAD-7, WHO-5, MADRS-S).
- **Bearbetning**: `daily_summaries`, `cached_insights`, `patterns.ts` (deterministiska mönster), `correlations.ts` (parvisa samband), `forecast.ts` (1–2 dagars risk), `baseline.ts` (personliga trösklar), `weekly-insight` edge function (AI-coach).
- **Externt**: Open-Meteo väder + plats, tid-på-dygnet, veckodag.
- **Rapport**: PDF-veckorapport (`WeeklyReport.tsx`).

## Vad som faktiskt är outnyttjat eller halvfärdigt

1. **Före/efter-data från övningar och aktiviteter används inte för personlig effekt.** Vi har `anxiety_before/after`, `mood_before/after`, `energy_before/after` på både `exercise_sessions` och `activity_logs`, men ingen ranking "det här verkar hjälpa **dig**".
2. **Korrelationer är ytliga.** Bara parvisa medelvärden mellan dagsmått. Vi missar: tidsförskjutna samband (sömn idag → oro imorgon), veckodag-effekter, väderkänslighet (lågt lufttryck/molnigt → tyngd), aktivitetstyp → outcome nästa dag.
3. **Läkemedelsföljsamhet och biverkningar** lagras men aggregeras inte: ingen adherence-%, ingen biverkningstidslinje, ingen "missad dos → mående nästa dag"-koppling.
4. **Skattningarna (PHQ-9 m.fl.) ligger som punkter, inte trend.** Ingen linje över tid, inget "förändring sedan senaste besök".
5. **Riskdetektion saknas.** Ingen flagga för stigande hopplöshet, upprepad `safety_status != "ok"`, biverkningssvårighet som ökar, eller långa hål i loggning.
6. **Väderdata är minimal** — bara nuläge. Vi snor inte sunrise/sunset (årstidsmörker), lufttryck (samband med oro/migrän), luftkvalitet eller pollen — allt finns gratis i Open-Meteo.
7. **Vårdrapporten är en snapshot, inte en berättelse.** Saknar fritt valbart tidsspann ("sedan senaste besök"), skattningstrend som linje, adherence-%, biverkningslista, AI-skriven sammanfattning på 5 rader, journalcitat användaren markerat för läkaren.
8. **Inget delningsflöde.** `doctor_email` finns i `user_settings` men ingen knapp som mailar/säkert delar rapport.
9. **Recommendations är kategori- och tid-baserade, inte personliga.** "Vad brukar fungera för dig" är inte i loopen.
10. **Progression visas inte tydligt över tid.** Streaks, "14 dagar in — din oro har gått från 6.2 till 4.8 i snitt", milstolpar — saknas eller är spritt.
11. **Adaptiv check-in saknas.** Alla frågor varje gång, även de som inte rör sig.

---

## Plan — 5 nya faser, samma ordning som värdet

Varje fas är leverabel separat. Inget designjobb — bara datapipeline, edge functions, beräkningar, och hur befintliga komponenter populeras.

### Fas A — Personlig effektmodell (vad funkar för DIG)

Mål: appen vet vilka övningar och aktiviteter som faktiskt sänker din oro / lyfter din energi.

1. `src/lib/personalEffect.ts` — beräknar per `activity_slug` och per `exercise_id`:
   - n (antal sessioner med både före och efter), genomsnittlig `Δanxiety`, `Δmood`, `Δenergy`, intervall för osäkerhet.
   - Filtrerar bort om n < 3 (för lite data).
2. Edge function `nightly-precompute` utökas: skriv resultatet som `cached_insights` med `kind="personal_effect"`.
3. `recommend.ts` viktar in personlig effekt: en övning med bevisad sänkning av oro hos *denna* användare rankas högre när dagens check-in visar hög oro.
4. Nytt litet datafält i rekommendationskorten: "Brukar sänka din oro med ~1.3 av 10 (8 ggr)". Ren text, samma kortdesign.

### Fas B — Djupare mönster och risksignaler

Mål: appen reagerar på *förändringar*, inte bara snittvärden.

1. `src/lib/patterns.ts` utökas med:
   - **Tidsförskjutna samband** (lag-1): sömn idag → oro imorgon, rörelse idag → energi imorgon.
   - **Veckodagseffekter**: "söndagskväll ligger tyngd 1.4 högre än ditt snitt".
   - **Väderkänslighet**: koppla `daily_summaries` mot väderhistorik (kräver att vi börjar logga väder per dag — se nedan).
   - **Trend-shift-detektor**: rullande 7d vs föregående 7d, larma vid Δ ≥ 1.0 på oro/tyngd eller Δ ≥ -1.0 på funktion/energi.
2. `src/lib/riskSignals.ts` (ny): deterministiska flaggor utan AI:
   - `hopelessness_rising` (3 dagar i rad ≥ baseline + 1).
   - `safety_concern_repeated` (`safety_status` ≠ "ok" två gånger på 7 dagar).
   - `side_effects_severe` (medel-severity senaste 7d ≥ 6).
   - `adherence_drop` (< 60 % registrerad adherence senaste 7 dagar mot tidigare 14).
   - `data_gap` (≥ 3 dagar utan check-in).
3. Risksignaler visas i befintliga ytor:
   - Idag-cockpit: existerande "MissingToday"-platsen tar emot dem.
   - Vård: hög-prio risksignaler hamnar i högerpanelens "Saknas inför nästa besök".
   - Krisplan: `safety_concern_repeated` lyfter krisplanens akutkontakter.
4. Adressera krisspråk i `weekly-insight` system-prompt: när `risk_signals` finns ska AI-coachen byta ton (existerar delvis, vi explicit-listar flaggor).

### Fas C — Mer extern data, fortfarande nyckelfritt

Mål: bredda kontexten utan att be om mer från användaren.

1. **Väderhistorik per dag**:
   - Ny tabell `daily_weather (user_id, date, kind, temp_c, pressure_hpa, daylight_minutes, uv_index_max)` (RLS som övriga `daily_*`).
   - Klienten skriver in dagens väder en gång när check-in sparas (vi har redan plats + Open-Meteo).
   - `nightly-precompute` backfill: hämtar sunrise/sunset + lufttryck för senaste 14 dagar för användare som saknar dem (Open-Meteo historik-endpoint är gratis).
2. **Open-Meteo utökat fetch** i `weather.ts`: lägg till `pressure_msl`, `uv_index_max`, `sunrise`, `sunset`, `daylight_duration`. Allt utan API-nyckel.
3. **Air quality + pollen** (opt-in, en knapp i Settings): Open-Meteo Air Quality. Bara hämta om användaren slår på "Inkludera luft & pollen". Skrivs in i `daily_weather` som extra fält.
4. **Säsong/dagsljus**: nytt fält `daylight_band` (kort/medium/lång) — används direkt i mönsterdetektorn för enkel SAD-indikation ("dina tunga dagar ligger främst när dagsljuset är < 9h").
5. Inget annat externt. **Skip**: HealthKit/Google Fit (kräver native), kalender (integritet), pushnotis (begränsat i web).

### Fas D — Vårdrapport som faktiskt berättar något

Mål: rapporten ska kunna ersätta en pärm med papper, inte bara visa siffror.

1. **Tidsspann-väljare**: 7d / 14d / 30d / "sedan senaste besök" (datumväljare). Påverkar både PDF och en ny on-screen-vy.
2. **Skattningstrend**: PHQ-9, GAD-7, WHO-5, MADRS-S som linje över valt spann + tolkad nivå (vi har `severity.ts` — använd den).
3. **Adherence-block**: per läkemedel: doser tagna / doser planerade, missade dagar listade, biverkningslista grupperad per typ med severity-medel.
4. **Berättelsesammanfattning**: en `doctor-summary` edge function (samma mönster som `weekly-insight`) producerar 5–8 rader klartext för läkaren: vad har förändrats, vad fungerar, vad oroar. Strikt instruktion att bara referera till siffror i payloaden.
5. **Markerade journaler**: `journal_entries.include_in_report = true` finns redan — visa dem som citat i rapporten.
6. **Risksignaler**: lista aktiva flaggor (Fas B) med datum.
7. **Delning**:
   - Generera PDF som idag.
   - Lägg till **mailto-knapp** mot `doctor_email`-fältet i `user_settings` (inget Resend-beroende i första iterationen — användaren skickar från sin egen mail med PDF bifogad lokalt + förifylld text).
   - Senare iteration: edge function `send-doctor-report` via Resend om användaren vill att appen mailar direkt (kräver Resend-API-nyckel — vi frågar då).

### Fas E — Progression, adaptiv check-in och förklaringar

Mål: användaren får tillbaka något när de loggar.

1. **Personlig progression-panel** (i Idag-cockpitens existerande höger-yta):
   - "21 dagar loggade i rad."
   - "Din oro har gått från 6.2 → 4.7 i snitt sedan första 14 dagarna."
   - "Du har provat 8 olika övningar — flest sänkningar av oro: Box-andning 4-4-4-4."
   - Allt härlett från `personalEffect` + `daily_summaries`.
2. **Adaptiv check-in** (`Checkin.tsx`):
   - Frågor som inte rört sig ± 1 senaste 7 dagarna komprimeras till "Samma som igår?" snabb-toggle. Använder befintlig form-design — bara villkorad rendering.
   - Räknar antal frågor som svarats på senaste 30 dagar för att inte trötta ut.
3. **"Varför ser jag det här"-länk** på risksignaler och rekommendationer: liten textöppning som listar de 2–3 datapunkter beräkningen vilar på. Skapar tillit.
4. **Veckans playbook**: en ny `cached_insights`-rad `kind="playbook"` som listar topp-3 lyftare och topp-3 dragare för veckan. Visas i Insikter-narrativ-kolumnen.

---

## Teknisk översikt

```text
Datakällor som finns                    Nytt vi adderar
──────────────────────                  ───────────────
daily_checkins        ──┐
activity_logs (Δ)     ──┤
exercise_sessions (Δ) ──┼──►  personalEffect.ts  ──►  cached_insights("personal_effect")
medication_logs       ──┤            │
weekly_forms          ──┘            ├──►  recommend.ts (viktar in personlig effekt)
                                     ├──►  Vård/Idag-kort (klartext)
daily_summaries  + lag ──►  patterns.ts utökad  ──►  cached_insights("patterns")
                                     │
daily_weather (NY)  ────►  riskSignals.ts  ──►  Idag, Vård, Krisplan
                                     │
Open-Meteo historik  ────►  nightly-precompute (backfill)

Edge functions
──────────────
nightly-precompute     (utökas: personalEffect + risk + weather-backfill)
weekly-insight         (utökas: får risk_signals + playbook i payload)
doctor-summary  (NY)   (genererar 5–8-raders berättelse för läkare)
send-doctor-report (senare, kräver Resend)
```

**Inga designändringar.** All ny information populeras i existerande komponenter: `MissingToday`, `DirectionMicroInsight`, `ContextPanel`, `WeeklyAIInsight`, `MetricTrendCard`, `RecommendationCard`, `WeeklyReport`.

**Nya filer (frontend)**
- `src/lib/personalEffect.ts`
- `src/lib/riskSignals.ts`
- `src/lib/dailyWeather.ts` (skrivhjälpare)
- `src/lib/reportRange.ts` (tidsspann-logik)

**Nya/utökade edge functions**
- `supabase/functions/doctor-summary/index.ts` (ny)
- `supabase/functions/nightly-precompute/index.ts` (utökas)
- `supabase/functions/weekly-insight/index.ts` (utökas)

**DB-migration**
- `daily_weather`-tabell + RLS (user_id-scoped).
- Eventuell `user_settings.report_range_default` (text).

---

## Föreslagen ordning

1. **Fas A** först — personlig effekt är den största "wow"-vinsten och låser upp bättre rekommendationer + bättre vårdrapport.
2. **Fas B** sen — risksignaler ger appen ett ansvar, inte bara siffror.
3. **Fas C** — väder/dagsljus berikar både B och E.
4. **Fas D** — vårdrapporten blir användbar på riktigt.
5. **Fas E** — progression och adaptiv check-in stänger loopen mot användaren.

Säg vilken fas vi börjar med, eller om du vill kasta om ordningen (t.ex. börja med D eftersom vårdrapporten är mest synlig nytta utåt).
