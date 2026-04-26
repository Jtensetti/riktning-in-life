## Mål
Automatisk **natt-läge** som slår på sig själv när `partOfDay === "night"` (22:00–05:00). Inget manuellt reglage. Följer befintlig palett — vi använder bara mörka HSL-värden som redan finns i `.dark`-blocket i `src/index.css` plus de befintliga kategori-färgerna. Ingen ny färg uppfinns.

## Trigger
- I `src/App.tsx` läggs en `useEffect` som:
  - läser `getTimeContext()` från `src/lib/timeContext.ts`
  - togglar klassen `dark` på `<html>` när `partOfDay === "night"`
  - re-evaluerar varje hel timme + vid `visibilitychange`
- Ingen localStorage, ingen toggle i Settings.

## Färgpalett — ingen ändring av kategori-tokens
Vi rör **inte** `--orange-start`, `--blue-calm`, etc. Däremot finjusteras `.dark`-värdena i `src/index.css` så de matchar Riktnings ton bättre (idag är de generiskt grå):
- `--background`: djup `purple-sleep`-ton (`261 35% 9%`) — knyter an till befintliga `--purple-sleep` som redan är vår "natt-färg".
- `--surface` / `--surface-alt`: två steg ljusare av samma ton.
- `--cream-card`: mörk variant `261 25% 16%` så `.card-cream` också mörknar.
- `--border-soft`: aning ljusare variant.
- `--foreground`: behåller cream — redan rätt.

## HeroBanner i natt-läge
`HeroBanner` blandar idag tonen mot `hsl(var(--background))` i botten. Det följer automatiskt med när `--background` byts. Liten justering: gradient-slutfärgen sätts till `hsl(var(--background) / 0.9)` för mjukare övergång mot natt-bakgrunden (funkar lika bra i ljust läge).

## Nya ikoner (efterfrågat: "kanske några nya ikoner")
Två nya cases i `AbstractIcon.tsx`, båda enligt det strikta blob+accent-receptet:
- `moon-stars` — fylld måne i `color` + 3 stjärnor i `accent`. Används som hero-ikon på kvällen/natten.
- `night-cloud` — molnsilhuett i `color` med liten måne bakom i `accent`. För wind-down-kort.

`moon-soft` och `weather-moon` lämnas — fungerar fortfarande för väder/sömn.

## Auto-byte av hero-ikoner på kvällen
På `Today.tsx` och `Vard.tsx` (de två sidor med stora hero-banners): om `partOfDay === "evening"` eller `"night"`, byt hero-ikonen till `moon-stars` och tonen till `var(--purple-sleep)`. Andra sidor lämnas oförändrade — de hänger ändå med via dark-mode-tokens.

## Filer som ändras
1. `src/index.css` — finjustera `.dark`-blockets bas-tokens (`--background`, `--surface`, `--surface-alt`, `--cream-card`, `--border-soft`) till purple-sleep-toner. Inga nya CSS-variabler.
2. `src/App.tsx` — `useEffect` som togglar `document.documentElement.classList` baserat på `getTimeContext()`. Re-check varje hel timme + vid `visibilitychange`.
3. `src/components/AbstractIcon.tsx` — två nya cases: `moon-stars`, `night-cloud`.
4. `src/components/HeroBanner.tsx` — gradient slutar på `hsl(var(--background) / 0.9)`.
5. `src/pages/Today.tsx` & `src/pages/Vard.tsx` — välj hero-ikon/ton baserat på `getTimeContext().partOfDay`.

## Vad vi medvetet INTE gör
- Ingen toggle/reglage i Settings.
- Ingen `prefers-color-scheme`-koppling — bara klocktid styr.
- Inga nya färgvariabler.
- Rör inte shadcn-komponenter eller `next-themes`.

## Saker att vara medveten om
- Recharts-tooltips läser redan `hsl(var(--surface))` via `chartTokens` → följer med automatiskt.
- `WeatherChip` använder `bg-surface/90` → följer med automatiskt.
- Användare som öppnar appen 21:59 hamnar i ljust läge; bytet sker 22:00 (eller direkt vid `visibilitychange`).

## QA
- Mocka `Date` i devtools (`new Date('2025-04-26T23:00')`) och bekräfta att `dark`-klassen läggs på `<html>`.
- Snabbcheck `Today`, `Vard`, `Week`, `Checkin`, `Journal` i mörkt läge — speciellt `card-cream`-bakgrunden.