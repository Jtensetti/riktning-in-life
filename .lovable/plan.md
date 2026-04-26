
# Dynamisk app: tid, datum & väder

## Mål
Appen ska känna av **tid på dygnet**, **veckodag**, **årstid** och **aktuellt väder** — och anpassa rekommendationer, hälsningar och loggning därefter. Inga "morgonrutiner kl 15" och inga "gå ut i solen" när det regnar. Vädret loggas dessutom automatiskt med varje check-in så vi senare kan korrelera humör mot väder.

---

## 1. Tidskontext (`src/lib/timeContext.ts` – NY)
Ren funktion utan beroenden. Returnerar:
```ts
type TimeContext = {
  partOfDay: "morning" | "midday" | "afternoon" | "evening" | "night"; // 5–10, 10–14, 14–17, 17–22, 22–5
  greeting: string;          // "God morgon", "God kväll" …
  isWeekend: boolean;
  season: "winter" | "spring" | "summer" | "autumn"; // svenskt: dec–feb / mar–maj / jun–aug / sep–nov
  hour: number;              // 0–23
};
```
Används överallt där vi idag hårdkodar formuleringar.

## 2. Väderkontext (`src/lib/weather.ts` – NY)
**Källa:** [Open-Meteo](https://open-meteo.com/) – gratis, ingen API-nyckel, GDPR-vänligt. Hämtas direkt från klienten.

Flow:
1. `navigator.geolocation.getCurrentPosition()` med tydlig in-app prompt först (egen `WeatherPermissionCard` — vi vill INTE skrämma användaren med browser-popupen direkt).
2. Vid avslag: fall tillbaka på **Stockholm** + visa "Plats avstängd – byt i Inställningar".
3. Cacha resultat i `localStorage` i 30 min (lat/lon + timestamp + payload). Inga onödiga API-anrop.
4. Mappa Open-Meteos `weather_code` → vår egen normaliserade typ:
```ts
type WeatherKind =
  | "clear"        // sol
  | "partly"       // delvis molnigt
  | "cloudy"
  | "rain"
  | "snow"
  | "fog"
  | "thunder"
  | "wind";        // härled från windspeed > 10 m/s
type Weather = {
  kind: WeatherKind;
  tempC: number;
  feelsLikeC: number;
  windMs: number;
  isDaylight: boolean; // från sunrise/sunset
  fetchedAt: string;
};
```
5. Exportera `useWeather()` hook som ger `{ weather, status, refresh }` (status: `idle | prompting | loading | ready | denied | error`).

## 3. Väderikoner (`src/components/AbstractIcon.tsx` – utöka)
Lägg till nya `IconName`:s i exakt samma platta, geometriska 32×32-stil och projektets palett:
- `weather-sun` — orange cirkel, korta strålar (orange-start)
- `weather-partly` — sol bakom blob-moln (orange + cream)
- `weather-cloud` — mjuk blob (cream-card / blue-calm tint)
- `weather-rain` — moln + 3 droppar (blue-calm)
- `weather-snow` — moln + 3 prickar (purple-sleep ljus)
- `weather-fog` — moln + 2 horisontella streck (text-secondary)
- `weather-thunder` — moln + blixt (yellow-journal)
- `weather-wind` — 3 svepande linjer (blue-calm)
- `weather-moon` — alias till befintlig `moon-soft` för natt-tillstånd

Helper: `weatherIcon(kind, isDaylight) → IconName` (sol byts mot moon-soft nattetid).

## 4. Auto-väder i check-in (`src/pages/Checkin.tsx`)
**Logik orörd, bara visuellt fält + sparning:**
- Längst upp i formuläret: ny mjuk `card-cream`-rad **"Väder just nu"** med väderikon + temp + plats — ingen slider, bara info. Liten "byt"-länk för manuell override (sol/moln/regn/snö/dimma).
- Sparas i kolumnen `weather_kind` + `weather_temp_c` på `daily_checkins`.
- **Kräver migration** (lägga till två nullable kolumner). Logik och RLS rörs inte.
- Om plats saknas: dölj kortet — vi tvingar inte användaren.

## 5. Tids- & väderkänsliga rekommendationer (`src/pages/Today.tsx`)
Skriv om `recommend(checkin)` → `recommend(checkin, time, weather)`:

| Situation | Rekommendation |
|---|---|
| `partOfDay === "morning"` + låg energi | "8 min morgonstart" |
| `partOfDay === "evening"` (efter 19) | **Aldrig** "morgonstart". Visa "Kvällslandning" eller "3 rader i journalen" |
| `partOfDay === "night"` (22–5) | "Andning för insomning" + dämpad ton |
| `weather.kind === "clear"` + dagsljus + funktion ≥ 4 | "15 min dagsljuspromenad — solen är uppe just nu" |
| `weather.kind in {rain, thunder, snow}` ELLER `!isDaylight` | **Aldrig** utomhus-promenad. Byt till "Mjuk rörelse inomhus" eller "Andning" |
| `tempC < -5` eller `windMs > 12` | Inga utomhusförslag — istället "Värm kroppen mjukt" |
| `weather.kind === "cloudy"` + morgon | "Dagsljus räknas även när det är molnigt — 10 min ute" |

Hero-bannern på Today får dessutom:
- Dynamisk **`tone`** baserat på partOfDay (orange morgon, blue-calm midday, purple-sleep kväll/natt).
- Dynamisk **ikon**: blob-smile dag, `weather-moon` natt, `weather-rain` om regn, etc.
- Liten väder-chip i `topRight` (ny prop på `HeroBanner`): t.ex. `☼ 4°` med korrekt AbstractIcon.
- Hälsning ovanför "Idag"-rubriken: "God morgon" / "God kväll" beroende på tid.

## 6. Övningsfiltrering (`src/pages/Exercises.tsx`)
- Sortera om så att tids- och väderlämpliga övningar dyker upp först (tagga med `recommended`-badge istället för att gömma).
- "Featured nu"-rad överst: 1 stort kort som matchar tid+väder (t.ex. "Andning för kvällslandning" kl 21).
- Lägg in små "Passar nu"-badge på kort vars `category` matchar kontext (Sov bättre på kvällen, Lugna kroppen vid regn, Rör dig mjukt vid bra väder).

## 7. HeroBanner-utökning (`src/components/HeroBanner.tsx`)
Lägg till valfri `topRight?: ReactNode` (matchar befintlig `topLeft`) så vi kan placera väder-chippet utan att bryta nuvarande layout. Padding/radius/timing oförändrade.

## 8. Inställningar (`src/pages/Settings.tsx`)
Ny rad: **"Plats & väder"** med toggle och status (Aktiv / Av / Nekad i webbläsaren). Förklarar varför (anpassade tips + automatisk vädersignal i loggen). Knapp "Hämta plats igen".

## 9. Databas (migration)
```sql
ALTER TABLE public.daily_checkins
  ADD COLUMN IF NOT EXISTS weather_kind text,
  ADD COLUMN IF NOT EXISTS weather_temp_c numeric;
```
Inga RLS-ändringar (befintliga policies täcker alla kolumner). Inga index behövs i denna runda.

## 10. Animationer (lätta)
- Väderikonen i hero får `animate-float` (befintlig keyframe).
- Regn/snö: små droppar/flingor med `translateY` 600ms loop, **endast** under `motion-safe`. Max 3 element — ingen partikelstorm.
- Hälsningstext (`God morgon`) får `animate-fade-in-up` med `--stagger-0`.

## 11. Gör INTE
- Ingen extern karttjänst, ingen Google Maps, ingen IP-geolocation-tjänst som kräver API-nyckel.
- Inga photoreal väderbilder.
- Ingen push-notisinfrastruktur i denna runda.
- Rör inte Checkins logikflöde (validering, safety dialog, save).

## Filer som påverkas
**Nya:**
- `src/lib/timeContext.ts`
- `src/lib/weather.ts` (inkl. `useWeather` hook)
- `src/components/WeatherChip.tsx` (kompakt visning)
- `src/components/WeatherPermissionCard.tsx` (mjuk in-app prompt)

**Ändras:**
- `src/components/AbstractIcon.tsx` (9 nya väderikoner)
- `src/components/HeroBanner.tsx` (`topRight` prop)
- `src/pages/Today.tsx` (kontextuell hero, hälsning, väder, ny `recommend`)
- `src/pages/Exercises.tsx` ("Passar nu"-logik + featured-kort)
- `src/pages/Checkin.tsx` (väderfält + spara — ej logik)
- `src/pages/Settings.tsx` (plats-toggle)
- `supabase/migrations/<ny>.sql` (två kolumner på `daily_checkins`)

Vecka, Journal och Vård rörs inte denna runda — säg till om du vill att 7-dagarsinsikterna också ska börja korrelera humör mot väder så snart vi har några dagars data.
