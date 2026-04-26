# Loggbara vardagsaktiviteter + smartare aktivitetslogg

## Mål
Gör om "Rört på dig / Meningsfull aktivitet" från ja/nej-val till en **rik, sökbar lista av vardagsaktiviteter** med kategori, tidsåtgång och hur det kändes. Allt skrivet med samma värme som resten av appen — inga pekpinnar.

## 1. Databas — `activity_logs` + katalog
- `activity_logs`: `user_id`, `date`, `activity_slug`, `category`, `duration_minutes` (nullable), `mood_delta` (-2..+2, nullable), `note`, `created_at`. RLS: bara egna rader. Index på `(user_id, date)`.
- `activity_catalog` (read-only för authenticated): `slug`, `label`, `category`, `icon`, `color`, `tags_json`, `default_minutes`. Seedas med ~60 aktiviteter i 7 kategorier: Rörelse & kropp · Utomhus & natur · Villa & trädgård · Familj & nära · Social kontakt · Mästring & mening · Lugn glädje.

## 2. Ny komponent `ActivityPicker`
Halvskärms-Drawer (shadcn):
- Kategori-chips i samma färgspråk som övningar
- Sökfält ("trädgård", "kaffe", "barn"…)
- Grid med `AbstractIcon` + label
- Vid val: tid (15/30/60/anpassad) + "kändes så här"-skala (-2..+2 med smileys i abstrakt stil)
- Flera aktiviteter per dag

## 3. Refaktor av `Checkin.tsx`
Ersätter `movement_today` och `meaningful_activity` med:
- Rubrik "Vad gjorde du idag?"
- Valda aktiviteter som färgglada pills (ikon, tid, mood-delta)
- Knapp "+ Lägg till aktivitet" → `ActivityPicker`
- Bakåtkompatibilitet: räkna antal loggade aktiviteter och fyll `movement_today`/`meaningful_activity` automatiskt så befintlig logik (recommend, week-trend) inte bryts

## 4. Smartare rekommendationer
Utöka `src/lib/recommend.ts` att läsa senaste 14 dagars `activity_logs`:
- Aktiviteter med positiv `mood_delta` får "favoriter"-boost i `ForYouCarousel` ("Trädgårdsarbete brukar lyfta dig")
- Lågt humör + bra väder + helg → föreslå en av dina egna mästrings-/utomhusfavoriter
- Ny slot-variant `joy` ersätter `land` på helger när data finns

## 5. Week-vy
- Ny sektion "Vad lyfte dig?" — top 3 aktiviteter senaste 7 dagar sorterat efter snitt-`mood_delta`
- Färgkodning matchar checkin-kategorierna

## 6. Innehåll — seed-katalog
Migration som seedar ~60 aktiviteter med svensk label, kategori, default-tid, AbstractIcon (återanvänd + 4–6 nya: `tree`, `house`, `family`, `coffee-cup`, `tools`, `book`), `tags_json` för matchning (t.ex. trädgårdsarbete → `["outdoor","weekend","mastery"]`).

## 7. Polish
- 4–6 nya `AbstractIcon`-varianter i samma platta stil
- Pop-in-animation när aktivitet läggs till
- Tom-state i picker: "Skriv in din egen" → custom-aktivitet utanför katalogen
- Ingen aktivitet är "bättre" än en annan — kaffe i solen jämställs med löprunda i copyn

## Inte i denna iteration
- Påminnelser/notiser
- Delning av aktivitetslogg med vården (bra nästa steg om du vill)