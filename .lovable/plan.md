
## Mål
Använda data du redan samlar (check-ins, activity_logs, exercise_sessions, weekly_forms, journal, medication_logs, väder) på ett mer ändamålsenligt sätt — utan att bygga nya fluffiga ytor. Fokus: **rätt signal vid rätt tillfälle, förklarad i din egen data**.

Det finns redan stark logik (`buildForecast`, `buildEveningPrediction`, `buildLiftSummary`, `buildDayHighlights`, `recommendForToday`, personlig baslinje). Mycket är dock antingen **inte ihopkopplat**, **bara visat på en yta**, eller **saknar en feedback-loop** som gör det smartare över tid. Det här åtgärdar det.

---

## Spår 1 — Mönsterdetektor (ny `lib/patterns.ts`)
Deterministisk korrelations-/sekvensdetektor över rullande 28 dagar.

Letar efter sex klassiska mönster och ger varje en *evidensnivå* (obs-antal + effektstorlek):

1. **"X följs ofta av tyngre dag"** — koppla `activity_logs` / fritext-tags / sömntimmar / koffein-loggar till nästa dags `mood_heaviness` & `anxiety`.
2. **"Y lyfter konsekvent"** — utvidga `buildLiftSummary` till att även titta på *nästa dag* (fördröjd effekt), inte bara samma session.
3. **"Sömn under Z h ger oro nästa dag"** — personlig tröskel via `baseline.ts`.
4. **"Veckodag-mönster"** — söndag/måndag-dippar, fredag-uppgångar.
5. **"Stillasittande > N min korrelerar med tyngd"** — använder `daytime_bed_sofa_time_minutes`.
6. **"Medicin-missar följs av X"** — `medication_logs.taken_status`.

Tröskel för att alls visas: **n ≥ 5 observationer** och **|effekt| ≥ 1 skalsteg** (= aldrig spekulativa "AI tror"-påståenden).

Surfas på två ytor:
- **Vecka → ny sektion "Mönster vi sett"** (max 3 st, sorterat efter evidens).
- **Today → integreras i `forYou`** ("Du loggade kort sömn igår — det brukar ge oro idag").

Inget AI-anrop, allt körs lokalt → snabbt och förklarbart.

---

## Spår 2 — AI-veckosammanfattning (ny edge function `weekly-insight`)
Kör Lovable AI (`google/gemini-3-flash-preview`) **en gång per vecka** mot `get_weekly_report`-RPC:n som redan finns. Returnerar ett JSON-objekt via tool-calling:

```
{
  headline: string,           // "En lugnare vecka — sömnen lyfte tisdag"
  trend_summary: string,      // 2-3 meningar, 2:a person, varm ton
  bright_spot: string,        // 1 mening om något som gick bra
  one_thing_to_try: string,   // konkret förslag nästa vecka
  flags: string[]             // valfri lista, t.ex. "möjlig sömnskuld"
}
```

- Cachas i ny tabell `weekly_insights(user_id, week_start, payload jsonb, created_at)` med RLS `auth.uid() = user_id`.
- Visas på `/vecka` *och* i `WeeklyReport.tsx`-PDF-flödet.
- Strikt prompt: får aldrig diagnostisera, får aldrig vara alarmerande, måste citera siffror från payloaden.
- 402/429 fångas och visas som mjuk toast — appen fungerar utan.

---

## Spår 3 — Smartare rekommendationer (utöka `lib/recommend.ts`)
Lägg till tre signaler som redan finns men inte används i scoring:

1. **Effekt-bias från historik** — om en övning har `avgDelta ≥ +1` för dig (från `buildLiftSummary`), boosta den med +15 poäng. Om `≤ -0.5`, dra av 20.
2. **Bryt mönster vid trigger** — när `forecast.kind === "anxiety"` och tid = morgon, tvinga `calm`-slot till en kort andning (≤5 min) oavsett standard sweet-spot.
3. **Continuity** — om användaren startade en sequence igår men inte slutförde, föreslå nästa steg i den (read från `exercise_sessions`).

Alla tre är additiva — bryter inte befintlig logik, fångas av befintliga tester.

---

## Spår 4 — Adaptiva check-in-frågor
Idag visar `Checkin.tsx` samma uppsättning frågor varje gång. Gör så här:

- **Kärnfrågor alltid**: tyngd, oro, energi, funktion, sömn (4 st sliders, ~30s).
- **Roterande "djupfrågor"** (1–2 st per check-in) baserat på vad baslinjen visar är *mest variabelt för dig*:
  - Hög varians på sömn → fråga kvalitet + sänggåendetid.
  - Hög varians på oro → fråga "vad triggade?" (taggar).
  - Stillasittande hög → fråga `daytime_bed_sofa_time_minutes`.
- Ingen ny tabell — använd `daily_checkins` befintliga kolumner; det vi inte har plats för läggs i `note` som JSON-tags.

---

## Spår 5 — Daglig auto-baseline-refresh
Idag triggas `refreshBaseline()` bara på Today-mount. Lägg till:
- Kör om i `Checkin.tsx` direkt efter sparad check-in.
- Trigger via `riktning:settings-hydrated`-eventet på nya enheter så baslinjen rekomputeras med serverdata, inte bara cache.

Liten ändring, men säkrar att alla tröskelvärden alltid är färska.

---

## Vad som **inte** ändras
- Ingen ny tabell utöver `weekly_insights`.
- Ingen ny route, inga nya sidor.
- Ingen ändring av `daily_checkins`-schemat.
- Inga nya stora UI-block — befintliga `forYou`, Vecka, WeeklyReport återanvänds.
- Säkerhetsmodellen (RLS) är oförändrad.

---

## Leveranser per filtyp

**Nya filer**
- `src/lib/patterns.ts` — mönsterdetektor + tester.
- `src/components/PatternsSection.tsx` — UI på Vecka.
- `src/components/WeeklyAIInsight.tsx` — kortet på Vecka + i rapport.
- `supabase/functions/weekly-insight/index.ts` — Lovable AI-anrop med tool calling.
- `supabase/migrations/<ts>_weekly_insights.sql` — ny tabell + RLS.

**Ändrade filer**
- `src/lib/recommend.ts` — tre nya scoring-signaler.
- `src/lib/baseline.ts` — exporta varianskvot per fält (för adaptiva frågor).
- `src/pages/Checkin.tsx` — adaptiv frågerotation.
- `src/pages/Today.tsx` — koppla in mönstersignaler i `TodayContext`.
- `src/pages/Week.tsx` — `<PatternsSection>` + `<WeeklyAIInsight>`.
- `src/pages/WeeklyReport.tsx` — visa AI-sammanfattning i PDF-flödet.

---

## Ungefärlig storlek
~6 nya filer, ~7 ändrade filer. Inga schema-ändringar utöver `weekly_insights`. Lovable AI används bara på en yta (en funktion, batch-vänlig, billig modell) — exponering minimal, värde högt.
