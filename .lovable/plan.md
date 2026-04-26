## Mål

Byt ut innehållet i `AbstractIcon` så att den nya, stickerstilade ikonpaketet (`riktning_headspace_icon_pack`) används överallt i appen — utan att något av de ~30 anropsstena (Today, Vard, Settings, QuickLog, Week, HeroBanner, ColorCard m.fl.) behöver röras.

## Vad som ingår i paketet

- 63 SVG-filer som **exakt matchar** alla namn i nuvarande `IconName`-union (inget mappingbyte behövs).
- Stilen: platta runda kvadrat-"klistermärken", `viewBox 0 0 96 96`, mjuka hörn (`rx=26`), inbakade färger (orange/blå/grön/lila/gul/rosa) — Headspace/Riktning-vibe.
- Färgerna är **inbakade** i varje SVG. Det betyder att `color`/`accent`-props inte längre styr utseendet — vilket är önskvärt eftersom hela poängen med paketet är en konsistent, illustrationslik look.

## Approach: inlined SVG, behåll API

Jag extraherar SVG-strängarna och bygger om `AbstractIcon.tsx` så att:

1. **`IconName`-union behålls oförändrad** → ingen import behöver uppdateras, `src/lib/icons.ts` (mappningen kategori/slug → IconName) fungerar som idag.
2. **Props behålls oförändrade** (`name`, `size`, `color`, `accent`, övriga SVG-props). `color`/`accent` blir no-ops för det nya paketet (logiskt, eftersom ikonerna är inbakade) men sprids fortfarande till `<svg>` så att `className`, `style`, `aria-*` etc. fungerar. Inga breaking changes.
3. **Switch-baserad rendering ersätts** av en enkel `ICONS` map: `Record<IconName, ReactElement>` med inlinade `<g>`-noder från det nya paketet. `<svg>`-wrappen sätts av komponenten själv (med rätt `viewBox 0 0 96 96`, `width`/`height` = `size`).
4. **Inline-läsbarhet vid små storlekar.** Eftersom de nya ikonerna har en färgad bakgrundsplatta blir de tunga vid `size ≤ 20` bredvid text (Week.tsx 12px, BottomNav, Settings 16–18px). Lösning: när `size < 22` renderar vi ikonen utan den fyllda bakgrundsrektangeln (vi droppar första `<rect ... rx=26 fill=...>` i SVG-strängen). Då blir små ikoner till "rena" symboler i sin huvudfärg, stora ikoner blir feta klistermärken — bästa av båda världar.
5. **`iconStyle.ts` justeras minimalt.** `ICON_VIEWBOX` byts till `"0 0 96 96"` så att framtida tillägg matchar. Övriga regler (linecap, stroke-tokens) lämnas men `validateIconStyle` får ingen ny ansvar; styling sker nu i den fasta SVG-källan.
6. **Filstorlek.** Totalt ca 35 KB SVG inline → ingenting för en React-bundle. Inga asset-imports, inga nätverksrequests, fungerar i SSR/print/PDF (viktigt för Vård-export).

Alternativ jag övervägde och valde bort:
- **Spara SVGs i `src/assets` och `<img src=...>`.** Funkar men ger nätverksrequest per ikon, sämre kontroll på tillgänglighet, och bryter PDF/SSR-renderingen som används i `pdfWidgets.ts`.
- **`<svg><use href=...>` med en sprite.** Mer komplext för noll vinst när vi ändå inte themar färgerna.

## Detaljerade ändringar

### 1. `src/components/AbstractIcon.tsx` (omskrivning)

- Behåll fil-headern, `IconName`-union (rad 20–90), `Props`-typen och komponentsignaturen.
- Ersätt switch-blocket (~rad 129–900) med:
  - En internal `ICON_BODIES: Record<IconName, ReactNode>` som innehåller de inlinade `<rect>`/`<circle>`/`<path>`/`<line>`-noderna från varje fil i `riktning_headspace_icon_pack/svg/`.
  - En internal `ICON_BG: Record<IconName, string>` som lagrar bakgrundsfärgen från första `<rect>` (för att kunna utelämnas vid små storlekar).
  - Renderlogik:
    ```tsx
    const showBg = size >= 22;
    return (
      <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden {...rest}>
        {showBg && <rect x="8" y="8" width="80" height="80" rx="26" fill={ICON_BG[name]} />}
        {ICON_BODIES[name]}
      </svg>
    );
    ```
- `color`/`accent` props accepteras men används inte (kommentar förklarar varför). `useEffect`+`validateIconStyle` behålls i dev för att fortsatt fånga konstiga storlekar.

### 2. `src/lib/iconStyle.ts`

- Uppdatera `ICON_VIEWBOX` från `"0 0 32 32"` → `"0 0 96 96"`.
- Justera kommentartexten kort ("Allt ritas i 96×96 viewBox, motiv centrerat runt 48,48").
- Ta bort regelraden som säger "currentColor som primär fyllnad" eller mjuka upp den till "Två-tons illustrationer i fast palett (se färglistan i README)".
- `ICON_STROKE`/`ICON_OPACITY` lämnas — referensvärden för framtida tillägg.

### 3. Tester

- Ingen testfil för AbstractIcon finns idag. Lägger ingen ny — `src/test/illustrations.test.ts` täcker redan att SVG-filer är välformade. Befintliga tester (`todayLayout.test.ts` m.fl.) påverkas inte.

### 4. Inget behov av att ändra

- `src/lib/icons.ts` (kategori-/slug-mappning): namn är identiska.
- `src/lib/heroVisuals.ts`, `HeroBanner.tsx`, `ColorCard.tsx`, `BottomNav.tsx`, `QuickLogPills.tsx`, `Today.tsx`, `Vard.tsx`, `Week.tsx`, `Settings.tsx`, `Checkin.tsx`, `Journal.tsx`, `Learn.tsx`, `LearnArticle.tsx`, `Exercises.tsx`, `Sequences.tsx`, `QuickLog.tsx`, `MechanismCard.tsx`, `WeatherChip.tsx`, `WeatherPermissionCard.tsx`, `TodayStepCard.tsx`, `TomorrowForecastCard.tsx`, `DayHighlightCards.tsx`, `CrisisPlan.tsx`: allt fortsätter fungera direkt.
- `src/lib/pdfWidgets.ts` om den serialiserar AbstractIcon — fungerar fortfarande (samma svg-element, andra inre noder).

### 5. Hantering av zip-arkivet

- Jag kopierar **inte** in zip-filen eller råa SVG-filerna i projektet. Allt innehåll inlinas direkt i `AbstractIcon.tsx`. Detta håller `src/assets`-mappen ren och undviker dubbla källor av sanning.

## Verifiering efter implementation

1. Bygg passerar (`tsc`/`vite`) — `IconName`-union och Props oförändrade.
2. Visuellt: större ikoner i Today (HeroBanner, ColorCard, hero-sized 56–72px) visas som färgade stickers. Små ikoner i Week-listor, Settings rader, BottomNav (12–20px) visas som rena symboler utan färgplatta.
3. Vård-PDF-export (om den serialiserar AbstractIcon) renderar fortfarande utan kraschar.

## Frågor jag inte ställer

- Bakgrundströskeln (22px) väljer jag pragmatiskt utifrån faktiska anropsstorlekar (12, 16, 18, 20 är "inline", 22+ är "kort/hero"). Om du vill ha annan brytpunkt — säg till efter implementation, det är en enradssändring.
