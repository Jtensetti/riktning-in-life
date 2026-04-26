
## Mål

Polera hela appen så varje yta — kort, listor, charts, pills, knappar — talar samma visuella språk: **flat, abstrakt, färgglatt, kul, enkelt, snyggt.** Vi fortsätter på den nuvarande designen (samma palett, samma radie, samma sticker-ikonpaket), men rensar bort visuella avvikelser och låter ikonpaketet vara stjärnan.

Inga nya features, inga nya databaskolumner. Bara konsekvens.

## Vad jag hittade vid genomgången

**Två konkurrerande illustrationsspråk.** Det nya sticker-paketet (AbstractIcon, 96×96, platta klistermärken med inbakad färg) lever sida vid sida med det gamla "poster"-paketet i `src/assets/illustrations/*.svg` (handritade ansikten med strokes, viewBox 320×180). Posters används i:
- `Exercises.tsx` — lista-tumnaglar (80×64) och kategori-knappar (96×64)
- `Journal.tsx` — i mall-vyn (full-width header)
- `ExerciseDetail.tsx` — header-illustration

Det är inkonsekvent mot referensbilderna (Headspace) där allt är samma flata sticker. Lösning: byt över dessa ytor till sticker-ikoner som dominerande visuellt element.

**Mall-kort i Journal är för små.** Referensbilden (`IMG_3565.jpeg`) visar Journal-mallar som **2-kolumns färgade rutor** med stort plus-ikon uppe och titel/undertitel nere. Idag är det en lista med 84px höga rader och en pytteliten 48×48 ikon-bricka. Layout-byte gör det direkt mer "Headspace".

**Övning-listan ser tung och inkonsekvent ut.** Referensbilden (`IMG_3561.jpeg`) visar listrader som färgade pills med en kompakt sticker till höger — exakt det `ColorCard sm` är byggt för. Idag används en grå `bg-surface`-rad med en illustration-poster i en liten färgad ruta = annan visuell rytm än kategori-knapparna ovanför.

**Kategori-knapparna i Exercises** är redan i rätt riktning men har en illustration-poster (320×180) inklippt i en 96×64 ruta — det blir en miniatyr med text inuti. Sticker-ikonen är gjord för exakt detta — byt till `AbstractIcon` 56–64px så får vi den karakteristiska Headspace-rytmen ("titel till vänster, sticker till höger").

**HeroBanner** har en linear-gradient (3 stop) som faller mot bakgrunden. Referensens header är platt färg + våg-separator. Lätt att platta gradienten till en färg + våg.

**Knappar.** Vi har redan en bra `Button` med `pill-strong` (svart) och `pill-brand` (orange). Men `pill-brand` används nästan ingenstans — primärknappar är överallt svarta. Referensen ("Join in" från `IMG_3547`) använder **brand-färgad** primary för positiva actions, och svart för dämpade/destruktiva. Vi behöver inte ändra varje anrop, bara höja `pill-brand` till en faktiskt använd default på de mest synliga CTA-platserna.

**MechanismCard** använder en liten `bg-orange-start/15` ruta med en 20px ikon — svag mot resten av sticker-paketet. Lätt att höja ikonen till 36px och släppa wash-bakgrunden (samma princip som i AbstractIcon-tröskeln 22px).

**Charts** är redan visuellt eniga (samma palett via `chartColors.ts`, samma marginaler via `chartTheme.ts`). De behöver bara två små polish-grepp för att kännas mer "sticker": tjockare stapel-radius (`radiusTop` 8 → 10) och tjockare linjer (3 → 3.5). Allt går via `chartBarLayout`/`chartLineDot`-tokens, inga komponentändringar.

## Detaljerade ändringar

### 1. Journal — mall-grid i Headspace-stil

`src/pages/Journal.tsx`:
- Byt mall-listan från `space-y-3` med 84px-rader till **`grid grid-cols-2 gap-3`** med stora "sticker-kort" (≈148px höga).
- Plus-ikon (`Plus` från lucide eller `plus-soft` AbstractIcon) uppe i vänstra hörnet, titel + undertitel längst ner — exakt som `IMG_3565.jpeg`.
- Använd befintliga klassnamn (`bg-yellow-journal`, `bg-orange-start` etc.) så färgerna matchar den uppladdade designen.
- Behåll `Fri text` (femte mallen) på en egen rad (col-span-1, högerställd) eller låt den ta vänsterspalten på rad 3 — referensen visar vänsterställd, så vi gör det.
- Drop poster-illustrationen i mall-vyn (`active === templateKey`) — ersätt med en `HeroBanner` med tonen + AbstractIcon, så Journal-mallens redigeringsvy får samma header som Today/Vard.

### 2. Exercises — sticker-konsekvens i alla listor

`src/pages/Exercises.tsx`:
- **Kategori-knappar** (idag rad 113–129): ersätt `<Illustration .../>` (96×64 poster) med `<AbstractIcon name={categoryIcon(name)} size={64} />`. Bygg en liten `categoryIcon()` mapper i samma fil (eller i `src/lib/icons.ts` bredvid existerande mappar) som returnerar ett IconName per kategori — t.ex. "Kom igång" → `play-soft`, "Lugna kroppen" → `lungs-breathe`, "Bryt ältande" → `chat-bubble`, "Sov bättre" → `moon-soft`, "Rör dig mjukt" → `walk-figure`, "Skriv av dig" → `pencil-soft`, "Förbered vårdkontakt" → `stethoscope`.
- **Lista-rader** (rad 144–169): byt från grå `bg-surface` rad till en färgad pill-rad i kategorins ton, identiskt mönster med referensbilden (`IMG_3561.jpeg`). Återanvänd `ColorCard size="sm"` med `metaLeft={ex.duration_minutes + " min"}`, `showChevron`, `eyebrow={fitsNow ? { label: "PASSAR NU", variant: "strong" } : undefined}`. Gör att hela listan får samma rytm som kategori-knapparna.
- Sökresultat och filter-vy använder samma rad-komponent.

### 3. ExerciseDetail — header med sticker, inte poster

`src/pages/ExerciseDetail.tsx`:
- Byt header-illustrationen (poster `Illustration name={categoryIll(ex.category)}`) mot en `HeroBanner` med tonen `var(--{color})` och samma `categoryIcon()` som ovan, så detail-vyn matchar listan visuellt.
- Inga andra ändringar — flow (intro → before → doing → after → done) intakt.

### 4. ColorCard — låt sticker-ikonen växa

`src/components/ColorCard.tsx`:
- Höj icon-storlekarna en pinne: `sm` 36→44, `md` 44→56, `lg` 56→72. Det gör att kortet faktiskt känns som ett klistermärke med en stor figur, inte ett färgat kort med en pyttig ikon i hörnet (matchar IMG_3548, IMG_3543).
- Flytta `iconPosition="top-right"` 8px nedåt och 4px utåt så stickern överlappar den nedre högra blob-cirkeln och får mer tyngd.

### 5. Bottom-nav — extra höjd när aktiv

`src/components/BottomNav.tsx`:
- Den aktiva ikonen får `size={26}` istället för 22, och cirkelbakgrunden görs en aning tjockare (`opacity 0.18` istället för 0.14). Liten polish, ingen logikändring.

### 6. MechanismCard — sticker, inte tile-ikon

`src/components/MechanismCard.tsx`:
- Ta bort `bg-orange-start/15`-rutan. Visa `<AbstractIcon name="spark" size={40} />` direkt — den nya stickern har egen bakgrundsplatta inbyggd, så vi behöver inte dubblera. Konsekvens med resten av paketet.

### 7. HeroBanner — flatare topp

`src/components/HeroBanner.tsx`:
- Byt `linear-gradient(180deg, hsl(${tone}) 0%, hsl(${tone} / 0.5) 55%, hsl(var(--background) / 0.92) 100%)` mot **flat** `hsl(${tone})`. Vågseparatorn längst ner gör övergången till bakgrunden mjuk, så vi behöver ingen gradient. Resultat: mer Headspace-affischigt, mindre webby.

### 8. Knappar — primary CTA = brand-färg

Inga ändringar i `button.tsx` (varianterna finns redan). Punktade ändringar:
- `Today.tsx`: ev. CTA "Gör check-in" → `variant="pill-brand"`.
- `Checkin.tsx`: spara-knappen → `pill-brand`.
- `Journal.tsx`: spara-knappen (rad 191) → `pill-brand`.
- `ExerciseDetail.tsx`: "Starta"/"Klar"-knappar → `pill-brand`.
- Destruktiva och navigations-CTAs (cancel, "Tillbaka") förblir `pill-strong` eller textlänk.
Liten uppstädning som ger appen en tydlig hierarki: orange = framåt, svart = bekräfta/dämpat.

### 9. Charts — tjockare, mer "sticker"

`src/lib/chartTheme.ts`:
- `chartBarLayout.radiusTop` 8 → 10 (rundare staplar).
- `chartBarLayout.categoryGap` ev. justerad så staplarna blir lite tjockare.
- `chartLineDot` & `chartLineActiveDot` får större radie (4 → 5 / 6 → 7) så hover-prickar känns lika fasta som stickers.

`src/components/charts/MetricLine.tsx`:
- `strokeWidth={3}` → `strokeWidth={3.5}`.

Allt går via tokens — ingen rör direkt en chart-komponent utan via theme-filen, så förändringen syns i alla 6 chart-primitiver samtidigt.

### 10. Borttag av oanvända poster-illustrationer

När Exercises/Journal/ExerciseDetail inte längre använder `Illustration`-komponenten på de byta ytorna, gå igenom resten av kodbasen (`rg "Illustration name="`) och se vilka som faktiskt används kvar. Sannolikt:
- `Onboarding.tsx`, `WeeklyReport.tsx`, `Vard.tsx` (PDF-export?) — där är posters fortfarande lämpliga (storyboard-känsla, full-width). Lämna intakt.
- Övriga: säkerhetsradera oanvända imports.

Inga SVG-filer raderas i denna runda — vi behåller dem för PDF/storyboard. Bara komponentanrop städas.

### 11. AbstractIcon — säkerställ att färg är konsekvent med temat

`src/components/abstractIconData.ts` har inbakade hex-färger (orange/blå/etc.). Vid en snabb verifiering ser de ut att vara nära men inte exakt på våra HSL-tokens. Det är OK — sticker-paketet är *avsiktligt* en fast palett. Men vi gör ett dev-warning: lägg en kort kommentar överst i filen som påminner om att färgerna är inbakade och att man inte ska försöka theme:a dem.

## Verifiering

1. `tsc` passerar — vi rör inga typer.
2. Visuell smoke-test: öppna Today, Journal, Exercises, ExerciseDetail, Vård. Allt ska kännas som *en familj* — samma sticker-rytm, samma färgade pills, samma rundade hörn, samma chunky-knappar.
3. Ingen poster-illustration ska längre dyka upp som litet thumbnail — bara som hero på Onboarding/WeeklyReport/Vård.
4. Befintliga tester (`todayLayout.test.ts`, `illustrations.test.ts`) ska fortfarande passera. Ingen ny test krävs — vi gör layoutskift, inte logikskift.

## Det jag *inte* gör

- Inga nya färger i paletten.
- Inga nya animationer (befintliga `pop-in`/`float`/`fade-in-up` räcker).
- Inga schemamigreringar.
- Ingen icon-pack revision — vi använder de 63 ikoner vi redan har.
- Ingen grafik genereras — vi använder bara den nya sticker-stilen + befintliga poster-SVGs där de fortfarande passar (Onboarding, rapporter).

Säg till om du vill att jag begränsar scope (t.ex. bara Journal + Exercises) eller kör hela paketet.
