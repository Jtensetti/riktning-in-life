## Helhetsutvärdering — Riktning idag

**Vad appen är bra på redan**
- Varm, icke-prestationsdriven copy ("Det här räcker idag") — en tydlig kontrast mot Strava/Headspace där "performance" annars dominerar.
- Smart kontext: tid på dygnet + väder + checkin styr rekommendationer.
- Säkerhetslogik (krisplan, safety_status) är genomtänkt och unik.
- Aktivitetskatalog + favoriter + mood_delta är en stark grund för personalisering.
- Klinisk export → läkare är ett konkret värde få konkurrenter har.

**Vad som hindrar appen från att kännas som Headspace × Strava**
1. **Inget momentum/streak-känsla.** Strava lever på "du gjorde det igen". Headspace på "Day 7 of your journey". Idag belönas inte återkomst alls. Risk: appen känns som ett verktyg snarare än en följeslagare.
2. **Loggning kräver fortfarande full check-in (7+ slidrar).** En enskild aktivitet kan inte loggas på 5 sek från Idag-skärmen — det borde gå.
3. **"Övningar" och "Aktiviteter" är två separata världar** (övningar = guidade sessions; aktiviteter = vardagsloggning). Användaren förstår inte alltid skillnaden.
4. **Insikter visas bara på Vecka.** De når inte fram i flödet ("Du sover bättre när du promenerar före 11" hör hemma där beslut tas).
5. **Ingen "Vägar"/program-känsla.** Sequences finns i datamodellen men är knappt synligt — det är där Headspaces "Basics", "Sleep", "Focus" lever.
6. **Inget delat eller socialt** — inte ens minimalt (t.ex. dela en "good week"-bild med en närstående). Strava-effekten saknas helt.
7. **Exercise-detaljvyn är binär** (gjord/ej gjord). Saknar ljud/röst-guidning för andning, vilket är Headspace kärna.

---

## Föreslagna förbättringar — prioriterade i tre lager

### LAGER 1 — Momentum & vana (bygger återkomst)

**1.1 Streak & "kedjor", men på Riktnings sätt**
- Inte "X dagar i rad" (skapar ångest om man missar). Istället **"X av senaste 7 dagar"** — en mjuk ring som fylls. Kan inte gå sönder, bara fyllas på.
- Visas som liten ring runt "Idag"-ikonen i BottomNav + stor på Today-hero.
- Tre nivåer av kedjor: *check-in*, *aktivitet loggad*, *övning gjord*. Användaren ser vilken som är starkast just nu.
- Copy: "Du har varit här 5 av 7 dagar. Det räcker." (aldrig "du missade 2 dagar").

**1.2 Snabbloggning från Idag**
- Ny floating action: **"+"-knapp** på Today som öppnar `ActivityPicker` direkt — utan att gå via Checkin.
- Favoritaktiviteter visas som **3 stora "tap-to-log" pills** högt upp på Today ("Promenad · 30m", "Kaffe i solen · 15m", "Trädgård · 60m"). Ett klick → loggad, mood-delta-fråga som mini-toast efteråt.
- Resultat: vardagsloggning går från 60 sek till 3 sek.

**1.3 Kvällsnotis-knapp ("Stäng dagen")**
- En enda knapp på Today efter kl 20 som öppnar en **mikro-checkin** (3 slidrar: tyngd, oro, sömn-prognos). Resten av check-in-formuläret flyttas till "valfritt mer".
- Sänker tröskeln drastiskt utan att förlora data.

### LAGER 2 — Vägar & guidning (Headspace-DNA)

**2.1 "Vägar" som första-klass-feature**
- Ny tab/sektion: **Vägar** (eller integrera i Övningar som översta block).
- Färdiga 7- och 14-dagarsprogram: *"Tillbaka till sömn"*, *"Kom ut i ljuset"*, *"Mjuk start efter en tung period"*, *"Bygg rörelse-vana"*.
- Varje dag i en väg = 1 övning + 1 mikro-uppgift (t.ex. "Logga vad du åt till frukost"). Progressring visar dag 3/7.
- Datamodellen finns redan (`exercise_sequences`) — behöver utökas med `progression_steps` (ordnad lista med dag → exercise + prompt) och en `sequence_enrollments`-tabell.

**2.2 Guidad andning med röst/ljud**
- Andningsövningar idag är text. Lägg till en **visuell pulserande cirkel** (in 4s / håll 4s / ut 6s) + valfri svensk röst (Web Speech API, gratis, utan API-nyckel).
- Detta är Headspaces #1-stickiness-faktor. Låg teknisk kostnad, hög upplevd kvalitet.

**2.3 "Mekanism-förklaring" som mikrolärande efter övning**
- Idag: övning klar → tillbaka till listan. Förslag: efter en övning visas ett **30-sekunders kort** som förklarar *varför den hjälper* (kopplas till `mechanism`-fältet som redan finns på `exercises`). Kort, tecknat, vänligt.
- Bygger förtroende och pedagogiskt djup.

### LAGER 3 — Insikter, socialt & polish

**3.1 Insikter där besluten fattas**
- Flytta in 1–2 insikter från Vecka direkt på Today, under For You-carousellen: *"När du går ut före kl 11 är din kväll lugnare. Solen är uppe nu."*
- Reglerna finns redan i `generateInsights` — behöver bara extraheras till en "actionable insight"-variant som kan kopplas till en konkret knapp.

**3.2 "Dela med någon nära" (social-light, helt frivilligt)**
- En knapp i Vecka: **"Skicka veckans bild till någon"** → genererar en snygg sammanfattningsbild (canvas, ingen backend) med "Riktning denna vecka: ↑ funktion, stabil sömn" — ingen data, bara mjuka former och ord.
- Användaren kan dela via systemets share-sheet (`navigator.share`).
- Bygger ansvarighet utan tävlan — Stravas anda men anpassad för psykisk hälsa.

**3.3 Plats- och tidskontextuella förslag på Today**
- Använd redan-insamlat väder + tid + favoritaktiviteter: *"Solen är ute i 2 timmar till. 'Trädgård' brukar lyfta dig — 30 min nu?"*
- En ny `contextualNudge`-modul i `src/lib/recommend.ts` som kombinerar väder, klockslag, favoriter och senaste mood_delta.

**3.4 Visuell & haptisk polish**
- Mjukt haptiskt feedback (`navigator.vibrate(10)`) vid loggning på mobil.
- "Pop-in"-celebration när en kedja fylls (konfetti är fel — istället en stilla blob-animation som expanderar).
- Onboarding: lägg till **"Välj 3 favoritaktiviteter"** redan första dagen — då är snabbloggningen meningsfull från sekund 1.

---

## Vad jag rekommenderar att vi bygger NU (denna iteration)

För att få maximal effekt av en sprint föreslår jag att vi börjar med **Lager 1 i sin helhet** — momentum + snabbloggning är det som förvandlar appen från "verktyg" till "följeslagare":

1. **Streak/kedja-system** (frontend-only, beräknas från befintlig data — ingen migration)
2. **Snabbloggnings-pills på Today** för favoritaktiviteter (läser `activity_favorites` + `activity_catalog`)
3. **FAB "+"-knapp på Today** som öppnar `ActivityPicker` direkt
4. **Kvällsläge på Today** efter kl 20: byter ut For You-carousellen mot "Stäng dagen mjukt" + mikro-checkin-genväg

Konkret påverkade filer:
- `src/lib/streaks.ts` (ny — ren beräkning)
- `src/components/StreakRing.tsx` (ny)
- `src/components/QuickLogPills.tsx` (ny)
- `src/pages/Today.tsx` (utbyggnad)
- `src/components/BottomNav.tsx` (mini-ring runt Idag)
- Mindre justering i `src/components/ActivityPicker.tsx` för "snabbläge" (hoppa över stor formulär, default 30 min, mood-fråga som toast)

**Inget i denna iteration:**
- Vägar-systemet (Lager 2.1) — separat sprint, kräver ny tabell + designarbete
- Röstguidad andning (2.2) — egen sprint, vill testa ljuddesign separat
- Delningsbild (3.2) — egen sprint, behöver visuell komp först

Vill du att jag kör Lager 1 nu, eller ska vi prioritera om — t.ex. börja med Vägar (Lager 2.1) eftersom det är mest unikt? Säg till så justerar jag.