## Mål
Sänka headern (känns för hög just nu) och skapa mer "andningsrum" mellan kort, utan att tappa den färgglada/lekfulla Headspace-känslan.

## Ändringar

### 1. Headerhöjd & ikon — `src/index.css` + `src/components/ui-kit/ScreenHeader.tsx`
- `--header-h-min`: 150px → **118px**
- `--header-h-max`: 190px → **150px**
- `--header-curve`: 36px → **40px** (något mjukare båge när headern är lägre — bevarar lekfullheten)
- `ScreenHeader`:
  - Ikonstorlek 56 → **44**
  - `paddingTop`: `max(28px, env(safe-area-inset-top))` → `max(16px, env(safe-area-inset-top))`
  - `paddingBottom`: 20 → **16**
  - Gap mellan ikon och titel `gap-3` → **`gap-2`**
  - Behåll färgad bakgrund, kurva och centrerad abstrakt ikon — bara mer kompakt.

### 2. Mer luft i layout — `src/components/AppShell.tsx`
- `pt-8` → **`pt-5`** (headern hanterar sin egen topp-padding nu)
- `mb-6` på header → **`mb-8`** (mer separation mot första kortet)

### 3. Vertikal rytm mellan kort
Uppdatera lista-spacing från `space-y-3` (12px) → **`space-y-4`** (16px) på:
- `src/pages/Today.tsx`
- `src/pages/Vard.tsx`
- `src/pages/Sequences.tsx`
- `src/pages/Exercises.tsx`
- `src/pages/Explore.tsx`
- `src/pages/Week.tsx`
- `src/pages/Health.tsx`
- `src/pages/Journal.tsx`
- `src/pages/More.tsx`

### 4. Sektionsrubriker
Justera marginal under H2/sektionstitlar från `mb-3`/`mb-4` → **`mb-5`** för tydligare gruppering. Söks och uppdateras endast där det är sektionsrubriker (inte korttitlar).

## Visuell QA
Efter ändringarna kollar jag Today, Vård, Rutiner och Övningar i preview för att bekräfta att:
- Headern känns lättare men fortfarande färgstark.
- Kort har tydligt luftutrymme utan att sidan känns gles.
- Inget kort hamnar bakom safe-area eller bottennav.

## Vad som INTE ändras
- Färgpalett, kurvor, ikoner och animation behålls — fortfarande Headspace-lekfullt.
- Inga komponenter tas bort eller döps om.
- Ingen påverkan på data/migrationer.
