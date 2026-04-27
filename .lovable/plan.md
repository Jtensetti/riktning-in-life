
# Riktning polish pass

Ten focused tweaks. No redesigns. Existing strengths kept (cream bg, large rounded cards, abstract icons, friendly typography, center plus button, calm Swedish copy).

---

## 1. Vård — warmer but more clinical

**File:** `src/pages/Vard.tsx`

- Keep crisis plan card as-is (red-tinted, prominent at top).
- Replace the saturated yellow/pink/green PHQ-9, GAD-7, WHO-5 cards (lines 110–158) with neutral white/cream `ListCard`-style rows:
  - cream surface, 28px radius, soft border
  - small 44px **colored icon tile** on the left (yellow / pink / green) using `IconTile` tone — color stays only inside the tile
  - black title, secondary text for "Senast: …" meta
  - chevron right
- Convert "Läkemedel & biverkningar" pink card the same way — neutral cream surface, pink icon tile.
- **Keep** the blue gradient export report card (already trustworthy).
- Add a soft section subtitle "Skattningar görs en gång i veckan" under the Veckoskattningar heading.

Result: page reads as a clinical care surface, not a playful menu — but the crisis card and export card still pop.

---

## 2. Exercise flow — spacing fix

**File:** `src/pages/ExerciseDetail.tsx`

- The hero (line 152) ends with `rounded-b-[40px]` and the inner content uses `-mt-6` (line 172) which causes the "Hur är det nu?" / "Hur är det innan?" headings (lines 203, 246) to visually crash into the orange hero on small viewports.
- Remove `-mt-6` and replace with `pt-8` on the inner container (≈ 32px gap below hero curve).
- Add `mt-2` removal and ensure the first heading inside each phase block has a clear top margin (`mt-0` after the new container padding).
- Same treatment for `phase === "doing"` and `phase === "after"` so headings never overlap.

---

## 3. Copy fix — "Slidrarna" → "Reglagen"

**File:** `src/pages/ExerciseDetail.tsx` line 248

Replace `Slidrarna börjar där du var innan. Dra dit du är nu.`
with `Reglagen börjar där du var innan. Dra dit du är nu.`

---

## 4. Latest activity badges — clear labels

**File:** `src/pages/Today.tsx` lines 924–960 (`latestActivity` module)

- Replace single-letter abbreviations (`M`, `Å`, `E`) with full words: **Mående**, **Ångest**, **Energi**.
- Format: `Mående +1`, `Ångest -1`, `Energi +1` (delta keeps tabular-nums).
- Show **max 2** badges inline; if a third exists, render a neutral `+ fler` chip. The full list is still announced via `title=` attribute for accessibility.
- Slightly larger badge text (`text-[11px]`) for readability now that they're words.

---

## 5. Learn — less medical certainty

**Migration:** `supabase/migrations/...polish_learn_copy.sql`

Update `learn_articles` titles (and tighten excerpts to use cautious language: "kan hjälpa", "för många", "över tid", "kan göra det lättare"):

| slug | new title |
|---|---|
| `rorelse-som-antidepressivum` | Rörelse som stöd |
| `rorelse-som-medicin-mer` | Rörelse som stöd — även 10 minuter räknas |
| `somn-hjarnans-stadning` | Sömn och återhämtning |
| `oro-i-kroppen` | Oro börjar ofta i kroppen |
| `beteendeaktivering-2min` | Låg ribba fungerar |

Excerpts updated in the same migration to drop absolute claims ("är medicin", "starkaste medicinen", "antidepressivum") in favor of practical/cautious phrasing. Article body text (`learn_articles.content`) left untouched in this pass — only titles + excerpts (the surfaces shown on Today and Lär dig list).

---

## 6. Activity categories — semantic, not "active time"

Today the catalog uses thematic categories ("Familj & nära", "Lugn glädje", …) and Week aggregates everything as `active time`. We add a stable **semantic axis** without breaking the current picker.

**Migration:** add column `activity_catalog.semantic_kind text` (enum-like check: `rorelse | aterhamtning | socialt | fokus | vardag | somn | journal`).

Mapping examples:
- Rörelse: promenad, jogg, cykla, simma, styrketräning, gym, padel, bollsport, stretch-yoga, långpromenad-skog, snöskottning, vedhuggning
- Återhämtning: långt-bad, hängmatta, bara-vara, bastu, kaffe-i-solen, sitta-altan, **film-med-frun**, podd, läsa-bok
- Socialt: ringa-vän, fika-granne, hjälpa-någon, match, föreningsmöte, skicka-meddelande, date-fru, lek-barn, godnattsaga, fika-utan-skärmar, brädspel, bygga-lego, bada-barnen
- Fokus: lära-nytt, instrument, slutföra-småsak, reparera, bygga-snickra, måla-om
- Vardag: matlaga-barn, laga-middag, trädgårdsarbete, klippa-gräs, plantera, meka-bil, bilresa-ett-barn
- Sömn: (reserved — used by future sleep-only logs)
- Journal: skriva-dagbok, musik-betyder

**Week.tsx (`src/pages/Week.tsx` lines 670–696):** rename the "activeTime" filter chip to **Rörelse + återhämtning** and group bars by `semantic_kind` instead of lumping all activities. Other filters unchanged.

**Picker (`ActivityPicker.tsx`):** category chips along the top stay (familj, lugn glädje, …) — they're great for finding things — but each draft also writes `semantic_kind` so reports and charts categorize correctly.

**Per-activity log fields (lightweight):** add an optional `intensity` (lätt / medel / hård) for `rorelse` activities and an optional `with_who` (ensam / partner / barn / vän / kollega) for `socialt` activities, both nullable in `activity_logs`. The picker shows the extra control only when relevant — no extra steps for everything else.

---

## 7. Weather — proportional presence

**File:** `src/pages/Today.tsx` (around lines 660–685, `weatherPermission` module + ScreenHeader `topRight`)

Behavior is mostly correct already; tighten the rules:

- Big `WeatherPermissionCard` shows **only** while `!hasAskedWeatherPermission && !permissionGranted && !dismissed`. Once user responds (allow/deny/dismiss), it disappears for good.
- After response, weather lives **only** as the small `WeatherChip` pill in the screen header (`topRight` — already wired).
- Larger weather-aware insight cards inside `recommend()` / forecast strip stay, but only when there's enough data — gate by `recent7.length >= 7 AND a clear weather-correlated pattern in baseline`. We add a small helper `hasWeatherPattern(recent7, weather)` in `src/lib/weather.ts` returning true only when at least 3 same-condition days exist with a measurable mood/energy delta.

---

## 8. Activity picker polish

**File:** `src/components/ActivityPicker.tsx`

Already mostly there. Small refinements:

- Title `line-clamp-2` confirmed (line 78). Keep.
- Star: inactive opacity already 0.4 — keep, but bump active size to 22 with `fill-current` (already correct). No change needed.
- Reorder sections so order is: **Senast använda → Dina favoriter → All / category grid**. Currently recents render before favorites only when no filter is active — confirm the order under no-filter (lines 251–290) and ensure both blocks have the same card style.
- Use `IconTile` from `ui-kit` for the small icon shown in the confirm screen (line 273) instead of the ad-hoc `bg-white/25` circle — keeps icon styling consistent across the app.

---

## 9. Today screen — keep current structure

No new modules. Confirm hierarchy (already enforced in `decideTodayLayout`):

1. ScreenHeader (date + weather chip)
2. Check-in status (state)
3. Current state messaging (state.title/sub)
4. Baseline progress / quickLog
5. One primary recommendation (`primary` or `forecast` or `eveningWindDown`)
6. Max two secondary cards (`forYou`, `todayRoutine`)
7. Latest activity

Action: audit `src/lib/todayLayout.ts` to ensure `decideTodayLayout` never returns more than two of `{forYou, todayRoutine, weekDirection, learn, reportShortcut}`. Cap with a `secondaryBudget = 2` slice. No visual change in normal cases — guards future regressions.

---

## 10. Design consistency — guardrails

- Add a tiny lint script entry in `scripts/check-tone.sh` to flag native emoji in user-facing strings under `src/` (extends existing tone checker). Catches future regressions like the recent quick-log emoji issue.
- Confirm no remaining native emoji in `src/pages/*` and `src/components/*` (one known: line 441 of `Today.tsx` has `🌙` in a toast description — replace with plain text "En liten sak räknas. Sov gott.").

---

## Technical summary

**Edited files:**
- `src/pages/Vard.tsx` — neutral list cards for forms + meds, keep crisis & report
- `src/pages/ExerciseDetail.tsx` — spacing fix + Reglagen copy
- `src/pages/Today.tsx` — full-word activity badges, max 2 + "fler", remove emoji
- `src/pages/Week.tsx` — rename activeTime label, group by semantic_kind
- `src/components/ActivityPicker.tsx` — confirm-screen IconTile, write semantic_kind on save, optional intensity/with_who controls
- `src/lib/weather.ts` — add `hasWeatherPattern()`
- `src/lib/todayLayout.ts` — cap secondary modules at 2
- `scripts/check-tone.sh` — emoji lint

**New migrations:**
- Add `activity_catalog.semantic_kind` column + backfill mapping for all 55 slugs
- Add `activity_logs.semantic_kind`, `activity_logs.intensity`, `activity_logs.with_who` (all nullable)
- Update `learn_articles` titles + excerpts (5 rows) with cautious language

**No backend secrets, no auth changes, no destructive drops.**
