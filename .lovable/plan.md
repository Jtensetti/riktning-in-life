## Mål

Diagram som är **logiska** (rätt typ till rätt fråga), **ändamålsenliga** (visar förändring, inte bara siffror) och **konsekvent designade** (samma färgtokens, typografi, hörnradier och mjuka animationer som resten av appen). Inga 3D, inga gradienter, inga linjediagram med skarpa hörn — allt är platt, rundat och färgglatt i Riktning-stilen.

## Designprinciper för alla diagram

- **Färger** kommer alltid från befintliga CSS-variabler: `--orange-start`, `--blue-calm`, `--purple-sleep`, `--green-recovery`, `--pink-move`, `--yellow-journal`. En färg per dataserie, ingen gradient.
- **Form**: staplar med `radius={[12,12,0,0]}`, linjer med `type="monotone"` (mjuka kurvor), areor med 12 % opacitet i samma färg.
- **Typografi**: Nunito Sans 700, axeltext `--text-secondary` 11 px. Inga rutnät förutom horisontella streckade `--border-soft`.
- **Tooltip**: vit `card-soft`, rundade hörn 16 px, samma skugga som övriga kort, ingen pil.
- **Animation**:
  - Recharts `isAnimationActive` på, `animationDuration={650}`, `animationEasing="ease-out"`.
  - Stapel- och linjeritning sker en gång vid mount, inte vid varje re-render.
  - Hela diagramkortet använder `animate-pop-in` med `var(--stagger-*)` precis som övriga kort.
  - Respekterar `prefers-reduced-motion` (sätter `isAnimationActive={false}`).

## Nya komponenter

### `src/components/charts/ChartCard.tsx`
Wrapper som ger alla diagram samma ram: titel, undertitel, valfri "Se mer"-länk, `card-cream` bakgrund, padding och `animate-pop-in`. Tar `tone` (samma palett som `ColorCard`) för en liten färgad accentprick bredvid titeln så att man känner igen kategorin.

### `src/components/charts/TrendLine.tsx`
Recharts `AreaChart` för 7- och 14-dagarstrender (humör, sömn, funktion). Mjuk monotone-linje 3 px + area 12 % i samma färg, prickar 4 px på sista punkten, dold X/Y-axel som default men valfritt kompakt X (M T O T F L S). Tooltip visar datum + värde + delta mot baslinje.

### `src/components/charts/ActivityBars.tsx`
Recharts `BarChart` för aktiv tid per dag (ersätter de handritade staplarna i `Week.tsx`). Staplar med `radius={[12,12,0,0]}`, färg per dag tas från dominant aktivitetsfärg via befintlig `colorHsl`-helper som flyttas till `src/lib/chartColors.ts`. Tom dag visas som ljus `--border-soft`-stapel med min-höjd 6 px så raden alltid har rytm.

### `src/components/charts/Sparkline.tsx`
Liten 60 × 24 px Recharts `LineChart` utan axlar/tooltip för `InsightCard` på Idag-sidan. Visar 7-dagars mönster i samma färg som kortets `colorClass`. Animeras in efter siffran så att blicken landar på siffran först.

### `src/components/charts/StackedRecovery.tsx` (lager 3 i Vecka)
Stacked `BarChart` per dag som visar minuter fördelat på kategori (Sömn / Rörelse / Mående / Återhämtning). Ger en Strava-känsla utan att vara overkill. Legend som pills i samma stil som `QuickLogPills`.

### `src/lib/chartColors.ts`
Centraliserar mappning `category | tone → hsl(var(--…))` så att `Week.tsx`, `Today.tsx` och nya diagram aldrig duplicerar färglogik. Återanvänder samma nycklar som `ColorCard`.

## Refaktor av befintliga sidor

### `src/pages/Week.tsx`
- Byt ut det handgjorda div-stapeldiagrammet (rad 288–316) mot `<ActivityBars data={timeline} />` inuti en `<ChartCard title="Aktiv tid" subtitle="Senaste 7 dagar" tone="green">`.
- Ovanför "Per-dag rader" lägger vi till `<ChartCard tone="orange" title="Belastning vs återhämtning"><StackedRecovery … /></ChartCard>` som ger en snabb visuell summering av veckan.
- "Jämfört med förra veckan"-blocket får en liten `<Sparkline />` i varje `MetricCard` så att siffran får kontext.

### `src/pages/Today.tsx`
- `InsightCard` (humör, sömn, funktion) får en `<Sparkline />` under siffran. Pilen behålls men flyttas bredvid sparklinjen så delta + form syns ihop.
- Lägger till en ny sektion **"Veckans riktning"** strax under "Nya insikter" med `<ChartCard><TrendLine series={[mood, sleep, function]} /></ChartCard>` när `trendData.length >= 4`. Tre tunna linjer i kategorifärgerna med toggle-pills för att visa/dölja serie (samma stil som befintliga pills).

### `src/pages/Checkin.tsx`
- Efter att check-in sparats visar vi en kort confirm-vy med `<Sparkline />` för det reglage användaren just rörde, så hen ser hur dagens värde landar i 7-dagarsmönstret. Ren motivationspuff, ingen ny dataquery — använder den `trendData` som redan hämtas av Today via en delad hook `useRecentCheckins(days)` som flyttas till `src/hooks/useRecentCheckins.ts`.

## Tillgänglighet & prestanda

- Varje diagram får `role="img"` + `aria-label` med en mening som sammanfattar trenden ("Humör har lyft från 6 till 7 senaste veckan").
- Under diagrammet finns en visuellt dold `<table>` med samma data för skärmläsare.
- All Recharts-import går via `chart.tsx`-wrappern så bundeln inte växer per sida.
- `prefers-reduced-motion` kollas i `ChartCard` och skickar ner `animate={false}` till barnet.

## Filer som skapas/ändras

**Skapas**
- `src/components/charts/ChartCard.tsx`
- `src/components/charts/TrendLine.tsx`
- `src/components/charts/ActivityBars.tsx`
- `src/components/charts/Sparkline.tsx`
- `src/components/charts/StackedRecovery.tsx`
- `src/lib/chartColors.ts`
- `src/hooks/useRecentCheckins.ts`

**Ändras**
- `src/pages/Week.tsx` — ersätter handgjorda staplar, lägger stacked recovery + sparklines i metric-korten.
- `src/pages/Today.tsx` — sparkline i `InsightCard`, ny "Veckans riktning"-sektion.
- `src/pages/Checkin.tsx` — sparkline i bekräftelsevyn.

Inga DB-migrationer, inga nya beroenden (Recharts finns redan).
