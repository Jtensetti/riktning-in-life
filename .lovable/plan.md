
# Förfina visuellt formspråk — animationer, abstrakta ikoner & polerade kort

## Mål
Förstärka Headspace-känslan: stilrent, luftigt, lekfullt, abstrakta ikoner, mjuka animationer (subtila — inte överdrivna), platt med endast lätta skuggor.

## 1. Animationsbibliotek (`tailwind.config.ts` + `src/index.css`)
Lägg till mjuka, korta keyframes (250–500ms, ease-out):
- `fade-in-up` — innehåll glider in 8px (sidor och kortlistor)
- `pop-in` — scale 0.96→1 + fade (CTA och insight-kort)
- `float` — subtil 2px upp/ner-loop på header-illustration (4s)
- `wiggle-soft` — engångs 3° tilt på illustration vid klick
- Stagger via inline-delay för listor (60ms mellan items)

Wrapping i `@media (prefers-reduced-motion: no-preference)` för tillgänglighet.
Behåll existerande `breathe` på andningskort.

## 2. Nya abstrakta SVG-ikoner (`src/components/AbstractIcon.tsx`)
Inline SVG-ikonbibliotek i samma platta, geometriska stil som existerande illustrationer (referens: bilden med flagga, play-knapp, öga, paj, cykel, blob-faces). Variants:
- `flag`, `play-soft`, `eye-closed`, `pie`, `bike`
- `blob-smile` (blå/orange/rosa)
- `moon-soft`, `spark`, `pencil-soft`, `heart-pulse`, `bookmark-soft`, `house-soft`

Används som accenter på kort, chips och i bottom-nav (ersätter Lucide där det passar).

## 3. Today-skärm (`src/pages/Today.tsx`)
- **Header**: mjuk gradient-banner (orange→cream halvcirkel) med flytande blob-smile (`float`), settings i vit FAB-cirkel ovanpå (likt referensbild).
- **State-card**: kompaktare layout — blob-illustration till höger, text till vänster.
- **Insight-kort**: liten abstrakt blob-ikon i hörnet + `pop-in` med stagger.
- **Recommended card**: behålls, lägg till `pop-in` + spark-ikon i hörnet.
- **Senaste aktivitet**: färgad mini-blob (24px) istället för bara prick.
- **Stagger-in** för hela sidan vid mount.

## 4. Övningar-skärm (`src/pages/Exercises.tsx`)
- **Sökfält**: rundare (radius 18px), mjukare border, ikon i liten cirkel.
- **Kategorigrid → single-column horisontella kort** (likt referensbilden "Beginning meditation / Focus at work"): full bredd, höjd ~88px, illustration till höger, stor titel vänster, radius 28px, mer luft.
- **Övningskort**: större thumbnail (80×64), scale-on-press, `fade-in-up` med stagger.
- Liten "Featured"-rad överst med ett stort orange kort.

## 5. Bottom-nav (`src/components/BottomNav.tsx`)
- Ersätt Lucide-ikoner med `AbstractIcon` (Home→house-soft, Sparkles→spark, BarChart3→pie, BookOpen→pencil-soft, Stethoscope→heart-pulse).
- Aktiv tab: ikonfärg + mjuk pill-bakgrund bakom + liten `pop-in` vid byte.

## 6. Globala polish
- `AppShell`: `animate-fade-in-up` på main vid route-change.
- Knappar: active scale 0.97 (120ms).
- Klickbara kort: `active:scale-[0.98] transition-transform`.
- Endast `shadow-card` (mjuk) på interaktiva kort.

## 7. Gör INTE
- Inga laddningsspinners överallt
- Inga bouncing/parallax-effekter
- Inga Lottie-filer
- Inga photoreal-bilder

## Filer som påverkas
- `tailwind.config.ts` (nya keyframes/animations)
- `src/index.css` (motion-safe wrapper, små utilities)
- `src/components/AbstractIcon.tsx` (NY)
- `src/components/BottomNav.tsx`
- `src/components/AppShell.tsx`
- `src/pages/Today.tsx`
- `src/pages/Exercises.tsx`

Vecka, Journal, Vård och Settings rörs inte denna runda — vi börjar med Idag + Övningar + nav (där användaren spenderar mest tid). Säg till om resten ska få samma behandling sen.
