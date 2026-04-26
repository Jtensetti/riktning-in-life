
## Mål
Mer konsekvent abstrakt ikon-system (Headspace-aktigt: platt, fyllt, vänligt) och starkare visuell rytm i färgade kort/knappar — utan att rucka på den platta, varma grundtonen.

## Del 1 — Utöka & städa ikon-setet (`AbstractIcon.tsx`)

### Stilregler (gäller alla nya ikoner)
- 32×32 viewBox, **fylld form** som primär (currentColor), valfri `accent` för 1 kontrast-detalj.
- Inga linjer-only ikoner för "objekt" — linje används bara för **rörelse/riktning** (pilar, vind, andning).
- Mjuka hörn (radie ≥ 2), aldrig vassa spetsar.
- Ansikten (när relevant): två slutna ögon-bågar + ev. mun, samma uttryck som `blob-smile`.

### Nya ikoner (≈14 st, täcker dagens luckor)
**Hälsa & kropp:** `pill` (medicin), `glass-water`, `apple-bite`, `lungs-breathe`, `bed-soft` (alternativ till moon för sömn-logg)
**Aktivitet:** `walk-figure`, `stretch-figure`, `yoga-pose`, `weights`, `nature-tree`
**Vardag/social:** `chat-bubble`, `people-two`, `work-bag`, `coffee-cup`
**Kontroll/UI:** `plus-soft`, `check-soft`, `clock-soft`, `calendar-soft`, `lock-soft`, `info-soft`, `warning-soft`, `mic-soft`, `mute-soft`, `search-soft`, `filter-soft`

### Refaktor av befintliga
- **Dela upp `heart-pulse`:** byt namn till `heart-care` (Vård/krisplan) och skapa separat `pill` för medicin, `walk-figure` för rörelse-rader.
- **Ersätt default-`spark` på "tomma" platser** med kontextpassande ikoner (Journal-tom → `pencil-soft` med blad, Övningar → ny `compass-soft`).
- Säkerställ att alla ikoner har samma optiska vikt vid 22–24 px (justera stroke/fill-tjocklek).

### Mappnings-helper
Lägg till `iconForActivity(slug | category) → IconName` så vi inte längre castar `(a.icon as IconName)` på 7 ställen — central källa till sanning.

## Del 2 — Headspace-rytm i färgade kort

Skapa en återanvändbar **`ColorCard`**-komponent (variant av nuvarande inline-mönster i QuickLog/Week) med:
- **Bakgrundsblob** i en mörkare nyans av kortfärgen (absolut positionerad, opacity 0.25, runt 60% size, nere höger) — exakt det Headspace gör.
- **Lyfter ikonen** något (top-right eller bottom-right hörn, 32–48 px) med ev. accent-form bakom.
- Behåll platt fyllning, ingen gradient.

Refaktorera så att dessa använder `ColorCard`:
- `QuickLog.tsx` — fyra mall-knappar (sömn/rörelse/mående/medicin)
- `Week.tsx` — priority-kort
- `Today.tsx` — recommended-kort i carousel (om de är färgade)

## Del 3 — Knappstil (matcha Headspace)

- Lägg till variant `pill-strong` på `Button`: `rounded-full`, `h-12`, `px-8`, fet vikt, full färg — för primära CTA i drawers ("Spara sömn", "Tillåt plats", "Join in"-stil).
- Behåll nuvarande `rounded-2xl`-knappar för formulär-sparningar där de redan sitter — men byt drawer-bottom-CTA till pill för Headspace-ton.
- Lägg pressed-state med skuggsänkning (inte bara scale) för mer "tryckkänsla".

## Del 4 — Mikrojusteringar

- Cream-kort på vit bakgrund: lägg `border-border-soft` 1 px i ljust läge så kanten inte försvinner mot off-white.
- Ge `HeroBanner` valbar `pattern` (subtila cirklar i bakgrunden, opacity 0.1) för Today/Vård — matchar Headspace "Meditate"-bannerns lekfullhet.

## Vad jag INTE rör
- Färgpalett (orange/blå/lila/rosa/gul/grön) — den är redan rätt.
- Typografi (Nunito Sans) — perfekt match.
- Bottennav-mönstret.
- Inga gradienter införs. Inga 3D-effekter.

## Leverans
- ~14 nya ikoner + 1 omdöpning + 1 helper-funktion.
- 1 ny `ColorCard`-komponent + refaktor på 3 sidor.
- 1 ny knappvariant + uppdaterade drawer-CTAs.
- Ingen ny route, inga DB-ändringar, inga nya bilder/3D-assets.
