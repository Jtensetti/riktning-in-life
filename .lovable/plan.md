## Var vi står

Fas 1–4 i den ursprungliga planen är levererade. Det som återstår är dels saker som vi medvetet sköt på framtiden, dels delar av briefen som inte fanns med i fas 1–4. Här är en ärlig avstämning per område.

### Klart (✅)

- **Desktop-helpers**: `WideLayout` (4 splits) + `ContextPanel` finns i `src/components/desktop/`, dokumenterade i `mem://design/desktop-patterns`. CrisisPlan & Settings använder dem.
- **SideNav**: större ikonvikt, aktiv-state med sektionsfärg.
- **Idag som cockpit**: vänster huvudflöde + höger med `DayMat`, `DirectionMicroInsight`, `MissingToday`.
- **ActivityPicker**: 2-kol mobil → 4-kol desktop grid med kvadratiska tiles. Drawer breddad till 960 px.
- **QuickLog**: desktop dual-grid (1.4fr/1fr), sticky kontextpanel med "Idag" + historik utan flikar.
- **WeekMat**: 7-dagars matris för Riktning/Sömn/Rörelse/Loggar/Check-in. Integrerad i Insikter (`Week.tsx`) och Analys (`Analysis.tsx`).
- **Vård**: WideLayout + Vårdstatus-panel i höger med läkemedel + dagar-sen-skattning.
- **Journal**: WideLayout, list-läge med mallar + senaste i höger.
- **CrisisPlan**: WideLayout `aside` + ContextPanel med akutkontakter.
- **Settings**: WideLayout `even` split.

### Inte gjort eller halvgjort (🟡 / ⛔)

Mappade mot briefens nya krav:

| Brief-krav | Status | Var |
|---|---|---|
| `<ActivityTile>` som **återanvändbar komponent** | ⛔ inline `PickerCard` i picker, ingen delad primitive | nytt: `components/desktop/ActivityTile.tsx` |
| **5–6 tiles per rad** i picker på desktop | 🟡 idag max 4 | ActivityPicker, QuickLog |
| **Multi-select** "Spara X aktiviteter" | ⛔ saknas helt | ActivityPicker, QuickLog |
| **"Rekommenderat just nu"-sektion** i picker (tid på dygnet) | ⛔ | ActivityPicker |
| **Senaste idag som DayMat** i QuickLog (inte rader) | 🟡 fortfarande lista | QuickLog |
| **Historik per dag-kort** (datum · checkin · antal · brickor · journalstatus) | ⛔ | nytt: `components/history/DayCard.tsx` |
| **Insikter = mänsklig tolkning** (vänster narrativ, höger bevis) | 🟡 WeekMat finns, men inte "Vad verkar hjälpa / tynga" eller veckans-viktigaste-signal | Week.tsx (Insikter) |
| **Analys = samband-textkort** ("Dagar med rörelse sammanfaller oftare med lägre oro") | ⛔ samband-kolumn saknas | Analysis.tsx |
| **Veckans förändringar med trendlinje + vs förra veckan** | 🟡 vissa kort finns, ej i ny struktur | Analysis.tsx |
| **Vårdstatus med skattningsnivå** ("PHQ-9 senast 27 apr · Måttlig", "Saknas inför nästa besök") | 🟡 antal/datum finns, nivåtolkning + "saknas" saknas | Vard.tsx |
| **Krisplan: live sammanfattning i höger** (just nu bara akutkontakter) | 🟡 | CrisisPlan.tsx |
| **Krisplan: ta bort stor svart sticky-spar på desktop** | ⛔ | CrisisPlan.tsx |
| **Utforska som bibliotek**, situationsgrupperat ("När tankarna snurrar"…) | ⛔ orört | Explore.tsx |
| **Rekommendationer med "varför"** under titeln | ⛔ | RecommendationCard i Today |
| **Färglogik harmonisering** (grön=återhämtning, blå=vård/mätning, rosa=mående…) | 🟡 delvis följt, ej systemreviderat | tailwind.config.ts + chartColors.ts |
| **Tomma lägen — mjuk text överallt** ("Tre rader räcker…", "Lägg till en liten sak") | 🟡 spritt | tvärs över sidor |
| **Aktivitetsmetadata "typisk effekt" + standardtid** i katalog | ⛔ kräver schemaändring | DB-migration |

---

## Plan — fyra nya faser

Samma princip som tidigare: varje fas är leverabel separat. Fas 5–6 ger mest synlig kvalitet; 7 är vårdens/krisens noggrannhet; 8 är polering och datamodell.

### Fas 5 — ActivityTile + multi-select i picker och Snabblogg

Den största "appkänsla"-vinst som återstår.

1. Skapa `src/components/desktop/ActivityTile.tsx` — kvadratisk (~120×120), ikon centrerad, titel under, favoritstjärna i hörn, vald-state med kant + bock, hover. Tar `selected`, `onSelect`, `meta` (t.ex. "Senast igår", "+ energi") som props. Ersätter inline `PickerCard` i ActivityPicker.
2. ActivityPicker desktop: `lg:grid-cols-5` (eller `6` på `xl`). Mobil oförändrad 2-kol.
3. Lägg till sektion **"Rekommenderat just nu"** överst i picker, härlett från tid-på-dygnet + senaste loggar (återanvänd `recommend.ts`/`relevance.ts`).
4. Multi-select-läge: state i ActivityPicker, vald-tiles får bock, sticky bottom-bar på desktop ("Spara 3 aktiviteter") + "Avbryt". Behåll dagens single-select-flöde som default; multi togglas via en chip "Välj flera".
5. QuickLog: byt ActivityPicker-kallet så det öppnar multi-select-läget direkt. Byt "Senaste idag"-listan i högerpanelen till `DayMat`.

### Fas 6 — Insikter & Analys som "berättelse vs bevis"

1. **Insikter (`Week.tsx`)** — `WideLayout split="balanced"`:
   - Vänster (narrativ): Veckans-viktigaste-signal · "Vad verkar hjälpa" · "Vad verkar tynga" · liten rekommendation. Försiktigt språk ("verkar", "ofta", "kan vara värt att prova").
   - Höger (bevis): WeekMat (finns) · aktivitetsfördelning · check-in-frekvens · små diagram.
   - Tar bort dagens "Bygger baslinje"-kort härifrån på desktop (hör till Idag).
2. **Analys (`Analysis.tsx`)** — `WideLayout split="balanced"`:
   - Topp: veckans sammanfattning i en panel.
   - Vänster: 6 förändringskort (oro/tyngd/sömn/energi/funktion/rörelse) med trendlinje + "vs förra veckan" + texttolkning.
   - Höger: **samband-textkort**. Beräkning enkel: per dag-rad i `daily_summaries`, för varje par (Sömn↔Energi, Rörelse↔Oro, Social↔Tyngd, Återhämtning↔Funktion) jämför medelvärde på dagar-med vs dagar-utan, eller Pearson om båda är kontinuerliga. Visa bara samband med tillräcklig datatäckning (säg ≥5 dagar i båda grupper).
3. WeekMat får små förbättringar: idag-markering tydligare, journalprick per dag.

### Fas 7 — Vård, Krisplan, Historik per dag

1. **Vård**:
   - Skattningsrader visar nivåtolkning, inte bara poäng/datum (PHQ-9 0–4 minimal, 5–9 lätt, 10–14 måttlig, 15–19 medelsvår, 20+ svår; GAD-7 0–4/5–9/10–14/15+; MADRS-S motsvarande). Skapa `lib/assessmentLevels.ts` som mappar poäng → nivå + ton (grön/gul/orange/röd via semantiska tokens).
   - Höger-panel: lägg till "Saknas inför nästa besök" — formulär >14 dagar gammalt, läkemedel utan loggar senaste 7 dagar, krisplan ouppdaterad >90 dagar.
2. **Krisplan**:
   - Höger-panel utökas: live sammanfattning (antal kontakter, antal varningstecken ifyllda, "senast uppdaterad") under akutkontakterna.
   - På desktop: ta bort den svarta sticky-spar-knappen. Lägg slutknapp i form-flödet + diskret toppknapp bredvid "Ändra/Klar".
3. **Historik per dag-kort** (`components/history/DayCard.tsx`):
   - Datum · check-in-status · antal aktiviteter · `DayMat` med brickor · journalstatus · mood/energi/oro-pills om de finns · klick → expanderar dagen.
   - Använd den i Today-historik och i Snabblogg-historik på desktop.

### Fas 8 — Utforska, rekommendationer, färgsystem, tomlägen

1. **Utforska (`Explore.tsx`)** — bygg om till bibliotek:
   - Topp: "Rekommenderat just nu" · "Fortsätt där du var" · "Favoriter".
   - Sedan: Övningar (grupperade efter **situation**, inte typ — "När tankarna snurrar", "När kroppen är spänd", "När du behöver komma igång", "När kvällen behöver landa", "När du vill förstå dig själv") · Rutiner som större rektangulära kort · Lär dig som mindre kort med ämne/lästid/nytta.
   - Lägg situationsmappning i `lib/exerciseSituations.ts` som tagging — initialt kurerad lista, kan bli datadriven senare.
2. **Rekommendationer med "varför"**: utöka `RecommendationCard` i Today så titel + 1-rad härledning ("Du har lite rörelse loggad idag") + "Starta" + "Inte nu".
3. **Färglogik**: kort revision av `tailwind.config.ts` + `chartColors.ts` så att samma kategori använder samma färg överallt (grön=återhämtning/riktning, blå=vård/kropp/mätning, rosa=mående/socialt, gul=lärande, orange=igångsättning, lila=sömn). Skriv en `mem://design/color-roles` med tabellen.
4. **Tomlägen**: liten genomgång — Today, Snabblogg, Journal, Insikter, Analys får mjuka tomtexter med en nästa rimlig handling.

### Senare (inte i denna runda)

- **Aktivitetsmetadata "typisk effekt" + standardtid** i `activity_types` (DB-migration). Lyfter när vi vill att tiles ska visa "+ energi" automatiskt.
- **"Vanliga den här tiden på dagen"-sortering** i picker (kräver lite tidsstämpel-analys på loggar).
- **Rapport-export till vården** (separat spår).

---

## Förslag på ordning

Fas 5 (ActivityTile + multi-select) först — det är där användaren märker mest skillnad och det låser upp DayMat-användningen i flera vyer. Sedan 6 (Insikter/Analys-narrativ) eftersom det är den mest "smartare desktop"-kärnan i briefen. Därefter 7 (Vård/Krisplan/historikkort) och slutligen 8 (Utforska + polering).

Säg vilken fas vi börjar med — eller om du vill kasta om ordningen (t.ex. börja med Utforska eller färglogik).
