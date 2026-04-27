# Större sidebar + riktig desktop-disposition

Mobilvyn är fryst. Allt nedan triggas på `lg:`-breakpoint eller högre.

## 1. Sidebar — större, mer närvaro

Desktop-sidebaren känns som en mobil-meny smetad mot kanten. Den ska se ut som en riktig desktop-navigation.

| Aspekt | Idag | Nytt |
|---|---|---|
| Bredd | 240px | **272px** (mer luft, fler tecken får plats utan trunkering) |
| Ikonstorlek | 22px | **26px** |
| Radhöjd | 44px (h-11) | **48px** (h-12) |
| Textstorlek | 14px | **15px** |
| Snabblogg-chips | 4 i rad, ikon 20px | 4 i rad, ikon **24px**, något större tile (rounded-2xl behålls) |
| CTA "Skriv i journalen" | h-12, ikon 20px | **h-14**, ikon **24px**, text **15px** |
| Sektionsetiketter | 10px uppercase | **11px** uppercase med 2px mer avstånd |
| Padding | px-3 py-5 | **px-4 py-6** |
| Active-indikator | 4px stripe vänster | Behålls — höjd 28px istället för 24px |
| Topbar | 56px | **64px** (matchar sidebarens nya tonalitet, wordmark 20px) |

`SideNav` får också en hover-bakgrund (`hover:bg-surface-alt/60`) på item-raderna så det känns klickbart från större avstånd.

## 2. Desktop-disposition — sidor som idag är inklämda i 448px

Mobilen lämnas helt orörd. På `lg:` byggs varje sida om till en logisk grid.

### Sidor som blir `wide` + två kolumner via `WideLayout`

**Today** — primär hemsida som idag är en lång enkel-kolumn på desktop. Bygg om till:
- **Vänster (1.4fr)**: Header med dag/datum + dagens hero-banner + "Steg-av-dagen" + EveningPredictionCard + TomorrowForecastCard.
- **Höger (1fr)**: WeeklyAIInsight + ForYouCarousel (här blir det ett vertikalt staplat kort-grid istället för horisontell carousel) + WeatherChip + senaste loggar.

**Health** — idag enkolumn med stack av kort:
- **Vänster**: Översiktsmetrics (sömn, rörelse, mående) som **2x2 grid** av kort istället för stack.
- **Höger**: Trender / mönster / insikter.

**Analysis** — analys-/insiktsida:
- **Vänster (primary-heavy 1.7/1)**: Huvudchart större och bredare.
- **Höger**: Filter, period-väljare, kontextkort.

**Explore** — utforska/innehåll:
- Byt 1-kolumns-stack mot **3-kolumns kortgrid** (`lg:grid-cols-3 gap-6`) istället för WideLayout, eftersom det är en katalog.

**Sequences / Exercises** — kataloger:
- 1 kolumn → **3 kolumns kortgrid** på desktop, 2 kolumner på md.

**WeeklyReport** — rapport:
- **Vänster (primary-heavy)**: Rapport-renderingen.
- **Höger**: Periodval, exportknappar, sammanfattning.

**Settings / CrisisPlan / More / QuickLog / Checkin / LearnArticle / ExerciseDetail / SequenceDetail**:
- Behåll den centrerade 448–520px läs-kolumnen — det är "calm stream"-sidor där en fokuserad enkolumn är medvetet vald (formulär, lång läsning, krisplan-checklista). **Höj dock max-bredden på desktop från 448 → 560px** för läsbarhet vid längre rader.

### Sidor redan `wide` men utan grid

**Journal**, **Learn**, **Week** är `wide` men lägger ut innehållet fritt. Lägg `WideLayout` på dem så vänster/höger får tydlig roll:
- **Journal desktop**: vänster = editor + dagens entry, höger = mall-väljare + senaste journal-historik (idag ligger denna under editorn).
- **Learn desktop**: 3-kolumns artikelgrid (likt Explore) istället för WideLayout.
- **Week desktop**: vänster = hela vecko-charten större, höger = dagsdetaljer + insikter.

## 3. Charts — desktop-uppgradering

Mobilen är orörd. På `lg:` får charts mer höjd och tydligare läsbarhet.

- **MetricLine / TrendLine / Sparkline / WeekDirectionChart**: höj höjden från ~140–160px → **220–260px** på desktop. Visa Y-axel-etiketter och fler X-axel-tickar (idag är de gömda för utrymmesskäl).
- **ActivityBars / MetricBars / StackedRecovery**: bredare staplar, gap ökas, värdesetiketter på toppen av staplarna på desktop.
- **MetricDonut**: större (180px → 240px diameter) och visa centrum-text större.
- Lägg till **hover-tooltip** med exakta värden på desktop (recharts har det inbyggt — det är bara att aktivera).
- Charts som idag är "ensam komponent" i en 448px-kolumn på Health/Analysis flyttas in i grids där de delar yta med insikter.

## 4. Tekniska detaljer

**Filer som ändras:**
- `src/components/desktop/SideNav.tsx` — alla nya storlekar.
- `src/components/desktop/DesktopTopbar.tsx` — höjd 64px.
- `src/components/AppShell.tsx` — höj `top: 56` → `64` för SideNav offset, höj `max-w-md` → `lg:max-w-[560px]` för calm stream-sidor.
- `src/components/desktop/WideLayout.tsx` — oförändrad, används av fler sidor.
- `src/pages/Today.tsx`, `Health.tsx`, `Analysis.tsx`, `WeeklyReport.tsx`, `Journal.tsx`, `Week.tsx` — desktop-grid via `WideLayout` (lg-only).
- `src/pages/Explore.tsx`, `Learn.tsx`, `Sequences.tsx`, `Exercises.tsx` — `lg:grid-cols-3` katalog-grid.
- `src/components/charts/*` — höjdvariabler får desktop-overrides; tooltip aktiveras.

**Mönster för all sidlogik (mobil orörd):**
```tsx
// Mobil = stack (oförändrad), desktop = grid
<div className="space-y-5 lg:space-y-0">
  <WideLayout left={<…>} right={<…>} />
</div>
```

eller för kataloger:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">…</div>
```

**Inga DB-, RLS- eller routing-ändringar.**

## Out of scope
- Mobilvyn — orörd överallt.
- Onboarding, Auth — fullskärms-flöden, inte i scope.
- Nya features eller nytt innehåll — endast layout, storlekar och chart-polish.
- Tablet-breakpoint (md) — om det behövs separat behandling tas det i en senare iteration.
