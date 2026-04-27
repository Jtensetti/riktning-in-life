## Premiss (icke förhandlingsbar)

**Mobilvyn rörs inte.** BottomNav, FAB, Journal-mallväljaren, ActivityPicker-drawers, Today-layouten — allt under `lg:`-breakpoint (1024px) är frusen. Varje ändring nedan är inhägnad bakom `hidden lg:…` eller `lg:`-prefix i Tailwind, eller villkor på viewport. Mobilanvändare ska se exakt samma pixlar efter som före.

## Insikt

Mobil = i farten, tummen, 5–20 sekunder → snabblogg vinner.
Desktop = sittande, tangentbord, längre stunder (kväll, terapiförberedelse) → skrivande och läsa tillbaka vinner.

Idag är desktop-navigationen en uppförstorad mobil. Det missar poängen med desktop.

## Tre desktop-only justeringar

### 1. SideNav (desktop): byt huvud-CTA till "Skriv i journalen"

Den orange "Logga aktivitet"-knappen i sidomenyn ersätts av en gul/journal-färgad **"✎ Skriv i journalen"** som primär CTA (öppnar `/journal`).

Snabbloggning försvinner inte — den blir en kompakt **chip-rad ovanför** CTA:n med fyra ikon-knappar (Sömn, Kropp, Mående, Medicin) som öppnar samma `ActivityPicker`-drawer som mobilens FAB använder.

```text
┌──────────────────┐
│ Idag             │
│ Utforska         │
│ ─────────────    │
│ [😴][🚶][🙂][💊]  ← snabblogg-chips (desktop-only)
│                  │
│ ┃ ✎ Skriv i      │  ← primär CTA (yellow-journal)
│ ┃   journalen    │
│                  │
│ Insikter         │
│ Vård             │
│ ─────────────    │
│ Krisplan         │
│ Inställningar    │
└──────────────────┘
```

Berör endast `src/components/desktop/SideNav.tsx` — filen är redan `hidden lg:flex`, så ingen mobilrisk.

### 2. Journal: split-pane på desktop (`lg:` only)

Journal-sidan får en grenad render:

- **Under `lg`**: 100% identisk med dagens flöde (mall-grid → full-page editor). Oförändrat.
- **Från `lg` och uppåt**: två-kolumns split-pane.
  - **Vänster (huvudkolumn, ~640px)**: skrivytan. Aktiv mall öppnas inline här istället för att ta över hela skärmen. Stor textyta. Cmd/Ctrl+Enter sparar.
  - **Höger (sidokolumn, ~320px)**: mall-väljare som vertikal lista + historik med sökfält. Klick på historikpost öppnar den read-only i vänsterkolumnen.

Implementeras genom att extrahera nuvarande editor-JSX till en intern `<JournalEditor>`-komponent och rendera olika layouter via `lg:`-klasser. Mobilgrenen är ren copy-paste av nuvarande markup.

### 3. Today: desktop-only reflektionsprompt

I `Today.tsx` läggs ett litet kort med `className="hidden lg:block"` i höger-kolumnen (som tillkommer i den redan godkända WideLayout-planen): *"Tre rader — 30 sekunder att fånga dagen"* → länkar till `/journal` med mallen `three_lines` förvald.

Mobilen ser aldrig detta kort.

## Vad som INTE ändras

- BottomNav, FAB, ActivityPicker triggers på mobil.
- Journals nuvarande mall-grid och full-page editor under `lg`.
- Today-layouten under `lg`.
- Inga routes, inga datamodeller, inga drawers, inga sparflöden.

## Filer som påverkas

- `src/components/desktop/SideNav.tsx` — byt CTA, lägg till chip-rad. (Filen är redan desktop-isolerad.)
- `src/pages/Journal.tsx` — lägg till `lg:`-grenad layout runt befintlig JSX. Mobilgren oförändrad.
- `src/pages/Today.tsx` — lägg till `<aside className="hidden lg:block">`-kort i höger-kolumnen.

## Teknisk detalj

- `ActivityPicker` får (om det inte redan finns) en `initialTemplate?: TemplateKey`-prop så chip-raden kan öppna rätt drawer direkt. Default-beteendet är oförändrat → mobilens FAB påverkas inte.
- Journal-extraktionen görs så att mobilgrenen renderar exakt samma JSX-träd som idag (inga nya wrappers, inga nya CSS-klasser på mobil).
- En enkel viewport-test (Playwright eller manuell) på 390px efter implementation för att verifiera pixel-paritet.
