## What's already in place

I checked each of the 10 polish points against the current code. Most landed in the previous round:

- **Vård** — crisis card prominent; PHQ-9 / GAD-7 / WHO-5 are cream rows with small colored icon tiles; blue export card kept.
- **Exercise spacing** — hero uses `pt-8 pb-10 rounded-b-[40px]`, content wrapper uses `pt-10`. No collision.
- **Slider copy** — `ExerciseDetail.tsx` line 248 already says "Reglagen börjar där du var innan…".
- **Today badges** — already render full labels ("Mående +1", "Ångest -1", "Energi +1"), capped at 2 with `+ N fler` overflow.
- **Learn-articles** — DB titles now read "Rörelse som stöd", "Sömn och återhämtning", "Oro börjar ofta i kroppen", "Låg ribba fungerar" with cautious excerpts ("kan hjälpa", "för många", "över tid").
- **Activity picker** — "Senast använda" section above categories, "Dina favoriter" visually separate, consistent icon tiles.
- **Today screen hierarchy** — `decideTodayLayout` already caps secondary modules.
- **Weather** — large permission card only renders until granted/dismissed; otherwise `WeatherChip` sits as small header pill.

## What still needs work

### 1. Week — split "active time" into proper categories (point 6)

`src/pages/Week.tsx` still has a single `activeTime` filter that lumps every logged activity together. Now that `activity_logs.semantic_kind` exists, surface it.

Changes in `Week.tsx`:

- Replace the `historyFilter` union with: `"all" | "checkins" | "exercises" | "rorelse" | "aterhamtning" | "socialt" | "fokus" | "vardag" | "somn" | "journal"`.
- Filter pills: keep "Allt", "Check-ins", "Övningar", then add a horizontally-scrollable row of the 7 semantic-kind pills (only show a pill if at least one log in the 7-day window has that kind, to avoid empty filters).
- `minutesFor(d)`: for a semantic-kind filter, sum `d.acts.filter(a => a.semantic_kind === key).reduce(...)`. Sleep filter uses checkin sleep_hours (existing behaviour stays).
- Chart title/subtitle/total label maps: per-kind copy
  - rörelse → "Rörelse", "Minuter rörelse", `${n} min rörelse`
  - återhämtning → "Återhämtning", "Tid för återhämtning", `${n} min`
  - socialt → "Socialt", "Tid med andra", `${n} min`
  - fokus → "Fokus", "Tid i fokus", `${n} min`
  - vardag → "Vardag", "Vardagliga rutiner", `${n} min`
  - sömn → "Sömn", "Loggad sömn", `${n} min`
  - journal → "Journal", "Tid i journal", `${n} min`
- Tone/color per kind matches the design tokens already used (green for rörelse, purple for sömn, pink for socialt, blue for fokus, yellow for journal, orange for återhämtning, green for vardag).
- Per-day list filter logic (`showActs` / empty-state CTA): show acts whose `semantic_kind` matches; empty state → "Ingen [kategori]nktivitet" + "Logga aktivitet" CTA to `/snabblogg`.
- Chart aria-label / tooltip in `ActivityBars` and `MetricBars` "Aktiv tid" → pass through the `title` prop instead of hardcoding (already supports it; just stop hardcoding "Aktiv tid" in the tooltip formatter).

### 2. Tiny consistency sweeps

- `src/components/charts/ActivityBars.tsx` — replace hardcoded "Aktiv tid" in tooltip/aria with a `label` prop (defaults to "Aktivitet") so Week can pass the current filter's label.
- `src/components/charts/MetricBars.tsx` — comment-only mention of "Aktiv tid" can stay (it's a code comment, not visible UI).

### 3. No DB migration required

`semantic_kind` already exists on `activity_logs` and is being written by `ActivityPicker`. Backfill ran for the catalog. No new SQL needed.

## Out of scope (intentionally)

- No changes to Vård, Today badges, ExerciseDetail spacing, slider copy, learn-article copy, weather pill behaviour, picker structure — all confirmed correct in the current code.
- No new modules on Today.
- No visual redesign.

## Files touched

- `src/pages/Week.tsx` — filter union, pill row, per-kind copy + colors, filter logic.
- `src/components/charts/ActivityBars.tsx` — accept label prop for aria/tooltip.
