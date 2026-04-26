## Sammanfattning av jämförelse

Din spec är mer komplett än min tidigare plan på alla visuella punkter (tokens, korttaxonomi, header-regler, copy, screen purpose). Min plan tillförde fyra strukturella saker som din inte beskriver i detalj och som vi behåller: **(1) Rutiner som paket**, **(2) Smart back-navigering**, **(3) Kontextuell FAB**, **(4) Avveckla `HeroBanner` till förmån för en regelstyrd `ScreenHeader`**. Allt annat följer din spec ordagrant.

Inget redesignas från scratch — vi polerar befintliga ytor mot regelboken nedan, en yta i taget.

---

## Fas 0 — Designkontrakt (token-lager, ingen UI ändras)

**`src/index.css`**
- Lås in semantiska färger som CSS-variabler (orange-action, yellow-journal, purple-sleep, blue-care, green-recovery, pink-move, red-risk) — uppdatera HSL-värden till exakt din palett: `#FF6B1A`, `#FFC928`, `#3B1B73`, `#1F7AF2`, `#07945B`, `#C6539A`, `#D64545`.
- Lägg till `--icon-tile-radius: 14px`, `--card-radius-hero: 32px`, `--card-radius-action: 28px`, `--card-radius-list: 28px`, `--card-radius-insight: 28px`.
- Lägg till `--header-h-min: 150px`, `--header-h-max: 190px`, `--header-curve: 36px`.

**`src/lib/typeScale.ts` (ny)**
- Exportera 5 storlekar (H1 40/44/800, H2 26/32/800, CardTitle 22/28/800, Body 16/24/600, Meta 12/16/800-uppercase). Skapa Tailwind-klasser `text-h1`, `text-h2`, `text-card-title`, `text-body`, `text-meta` via `@layer components` så vi slutar slänga ad-hoc-storlekar i sidor.

**`src/lib/screenIdentity.ts` (ny)**
- En enda källa för: tab → headerColor, tab → headerIcon, tab → screen-question. Importeras av `ScreenHeader`, `BottomNav`, sid-titlar.
- Idag = dynamisk (morgon/dag/kväll/natt), Utforska = pink, Logga = orange, Insikter = green, Journal = yellow, Vård = blue, Mer = beige.

---

## Fas 1 — Komponentbibliotek (5 kort, 1 header, 1 ikon-tile)

**Nya komponenter under `src/components/ui-kit/`:**
1. `IconTile.tsx` — 44–48px, radius 14–16px, mjuk tonad bakgrund, centrerad `AbstractIcon`. Ersätter alla ad-hoc emoji-rutor och inline ikon-bakgrunder.
2. `HeroCard.tsx` — radius 32px, padding 24, en titel + en mening + en CTA + ev. illustration. Används för dagens rekommendation, Idag-toppkort, "Starta dagens rutin".
3. `ActionCard.tsx` — radius 28px, padding 20, IconTile + titel + meta. Används för: övningar, rutiner, journalmallar, snabblogg-pillrar.
4. `ListCard.tsx` — vit/cream, radius 28, padding 20, IconTile vänster + titel/meta + chevron. Används för: vård, medicin, formulär, settings.
5. `InsightCard.tsx` — cream, radius 28, padding 22, **rubrik = mänsklig slutsats först** ("Veckan är stabil"), chart sekundärt.
6. `ClinicalCard.tsx` — vit/grå, kompakt, ingen illustration. Endast i WeeklyReport.
7. `ScreenHeader.tsx` — 150–190px böjd header, en centrerad abstrakt ikon, ärver färg från `screenIdentity`. Inga blobs/wave-svg. **Ersätter `HeroBanner` överallt utom CrisisPlan.**

**Avveckling:**
- `HeroBanner` flaggas `@deprecated` men finns kvar i 1 release.
- `ColorCard` blir intern wrapper som `ActionCard` använder; egen export tas bort.
- `card-quiet`-klassen avvecklas till förmån för `InsightCard`.

---

## Fas 2 — Rutiner som paket (struktur)

**Ny route `/rutiner/:slug` → `src/pages/SequenceDetail.tsx`**
- Visar rutinen som *ett* objekt: stor `HeroCard` med titel/syfte, sedan numrerad lista över alla steg (radius 28, IconTile per steg), CTA "Starta första steget".
- I dag länkar `Sequences.tsx` direkt till första övningen → orsaken till "tillbaka leder fel". Vi går via SequenceDetail först.

**`src/pages/ExerciseDetail.tsx`**
- Om `sessionStorage.riktning:sequence` är aktiv: visa en smal **rutin-bandet** högst upp ("Mjuk morgon · steg 2 av 3" + back-pil till SequenceDetail).
- "Klar"-knappen avancerar till nästa steg i rutinen (eller "Klart, du är genom rutinen").
- Tas illustrationerna inuti detail-vyn bort (per din regel: "less dashboard, fewer decorative colors" gäller även här).

**`src/hooks/useSmartBack.ts` (ny)**
- Läser `document.referrer` + intern history-stack (sessionStorage) och returnerar rätt back-target. Tillbakaknappen i ExerciseDetail går då till SequenceDetail när man kom därifrån, annars Exercises.

---

## Fas 3 — Sidor harmoniseras mot specen

För varje sida: byt `HeroBanner` → `ScreenHeader`, byt ad-hoc kort → kort-kit, kapa moduler som inte svarar på sidans fråga.

| Sida | Fråga | Plocka bort | Behåll/förbättra |
|---|---|---|---|
| `Today.tsx` | "Vilket litet steg nu?" | duplicerade widgets, gradient-hero, stagger-spam | 1 HeroCard (rekommendation) + max 3 ActionCards + 1 InsightCard |
| `Explore.tsx` | "Vilken sorts stöd?" | inget — **redan referensen** | bara byt header till ScreenHeader för konsistens |
| `Exercises.tsx` | (under Utforska) | egen header | Visa som tab inuti Utforska, inte separat sida |
| `Sequences.tsx` | (under Utforska) | direktlänk till första övning | navigerar till ny SequenceDetail |
| `Journal.tsx` | "Vad vill jag skriva?" | inget — referens | byt header, allt annat OK |
| `Week.tsx` (Insikter) | "Vad visar veckan?" | tomma chart-grid när baseline saknas | **baslinje-kort "Dag X av 14"** först, sedan 1 InsightCard med slutsats + chart |
| `Vard.tsx` | "Vad behöver vården veta?" | playful illustrationer i medicin/formulärlistor | ListCard överallt, blå header |
| `Health.tsx` | (slås ihop med Vård om innehåll överlappar) | utvärderas | — |
| `WeeklyReport.tsx` | klinisk export | färgad illustration, AI-sammanfattning högst upp i färg | ClinicalCard, "Underlaget är begränsat: X av 14"-banner när sparse |
| `Settings.tsx` / `More.tsx` | sekundär | färgad hero | beige ScreenHeader, ListCard-stack |
| `CrisisPlan.tsx` | nödläge | — | behåller sin röda framtoning, men radius/typografi från kit |
| `QuickLog.tsx` | snabblogg | dubblerar FAB-flow | utvärdera om route ska tas bort när FAB öppnar `ActivityPicker` direkt |

---

## Fas 4 — Activity picker enligt specen

`src/components/ActivityPicker.tsx`:
- 2-kol grid, kort 96px h, radius 24, padding 16, IconTile 44, titel 18–20/800, max 2 rader, ellipsis.
- Stjärna 28px, opacity 0.55 inactive, full opacity active.
- Sektioner i ordning: **Senast använda** (max 4), **Favoriter** (om finns), **Kategorier** (collapsible), **Skapa egen**.
- "Senast använda" hämtas från befintlig `useRecentCheckins`-mönster, ny `useRecentActivities` hook mot `activity_logs`.

---

## Fas 5 — Bottom nav + FAB

`src/components/BottomNav.tsx`:
- Höjd 82px + safe-area, center-FAB 68px cirkel `#FF6B1A` med shadow `0 8px 24px rgba(255,107,26,0.35)`.
- Ikoner 24px från samma `AbstractIcon`-familj. Inactive `#746E68`, active = tabbens identitetsfärg.
- **Beslut om femte tab:** behåll nuvarande 5 (Idag, Utforska, Logga, Insikter, Vård). Journal flyttar in som **prominent ActionCard överst i Utforska** — det matchar din spec ("Journal kan leva inuti Utforska").
- FAB blir **kontextuell**: på Idag öppnar den check-in om dagens check-in saknas, annars ActivityPicker. På övriga sidor: alltid ActivityPicker. Hanteras av `screenIdentity`.

---

## Fas 6 — Insikter-tomtillstånd + copy-pass

- `src/components/BaselineProgressCard.tsx` (ny): "Bygger baslinje · Dag 4 av 14", listar vad som dyker upp efter 14 dagar. Visas tills `baselineComplete=true`.
- Globalt copy-pass via `src/lib/tone.ts`: lägg in dina godkända fraser, blockera "streak", "perfekt", "missat mål", "optimera", "du borde". Lägg en lint-regel (rg-grep i CI/precheck) som varnar om något av de förbjudna orden återinförs.
- WeeklyReport får `<SparseDataNotice />` när < 7 av 14 dagar har check-in.

---

## Fas 7 — Verifiering

1. `tsc --noEmit` + befintliga vitest.
2. Visuell smoke: rendera varje route, screenshota mobile viewport (390x800), jämför mot din `IMG_3618` (Utforska) och `IMG_3565` (Journal) som referens.
3. Designregel-test (`src/test/design-system.test.ts`, ny): asserterar att inga sidor importerar `HeroBanner` (utom CrisisPlan-undantag), att alla `text-[NNpx]`-arbiträra storlekar utanför kit-komponenter ger varning.

---

## Leverans-ordning (rekommenderad)

1. **Fas 0 + 1** först (tokens + kit) — påverkar inget visuellt förrän nästa steg.
2. **Fas 2** (rutiner som paket) — löser ditt navigationsproblem direkt.
3. **Fas 3** sida för sida i ordningen: Today → Vard → Week → WeeklyReport → Settings/More → Sequences/Exercises → CrisisPlan/QuickLog.
4. **Fas 4 + 5** (picker + nav) sist så de bygger på det nya kit:et.
5. **Fas 6** copy/empty states som finishing-pass.

Säg till om du vill att jag drar igång — eller om något steg ska skjutas/strykas.