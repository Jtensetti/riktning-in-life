## Nuläget — varför det känns spretigt

Jag har gått igenom alla routes och länkar. Tre konkreta problem:

1. **Innehåll bor på fel ställen.** "Lär dig", "Rutiner" och "Krisplan" länkas bara från **Inställningar** och delvis från Today/Vård. En användare som vill läsa en artikel hittar den inte via navbaren.
2. **Bottom-nav blandar verb och substantiv.** `Idag · Logga · Vecka · Journal · Vård` — "Logga" är en handling (FAB-jobb), "Journal" är en innehållstyp, "Vecka" är en tidsperiod. Det finns ingen plats för utforska/läsa.
3. **Carousellen är gömd.** `ForYouCarousel` renderas bara *efter* att man checkat in, och bara som en av många moduler i Today-flödet. Den var tänkt som primär ingång — den ska tillbaka, tydligare.

Dessutom finns 16 routes men bara 5 i navbaren — resten är beroende av att man råkar hitta knappar inne på sidor.

## Föreslagen sitemap (5 tabs + en hub)

```
┌─────────────────────────────────────────────────────────────────┐
│  IDAG          UTFORSKA       (FAB)        INSIKTER     VÅRD   │
│  house-soft    sparkles       Logga +      pie          stetho │
└─────────────────────────────────────────────────────────────────┘
```

### 1. **Idag** (`/`) — *oförändrad URL*
Dagens flöde + state. Carousellen flyttas hit som **alltid synlig** modul (inte gated bakom check-in) — det var det användaren saknade.
- Hero + hälsning + väder
- Streak / state-kort
- **"För dig just nu" carousel** (3 picks — alltid synlig så fort `picks.length > 0`)
- Dagens rutin / forecast / evening prediction
- Senaste aktivitet
- Bort: `reportShortcut` (flyttas till Insikter), `learn` (flyttas till Utforska)

### 2. **Utforska** (`/utforska`) — *NY route, ersätter "Logga"-tabben*
En äkta innehållsdestination. Tre sektioner i en sida:
- **Övningar** (`/ovningar` — befintlig) som horisontell carousell + "Se alla"
- **Rutiner** (`/rutiner` — befintlig) som carousell — *flyttas hit från Inställningar*
- **Lär dig** (`/lar-dig` — befintlig) som lista — *flyttas hit från Inställningar*

Detta löser direkt "artiklar i inställningar"-problemet. URL-arna `/ovningar`, `/rutiner`, `/lar-dig` finns kvar för djuplänkar.

### 3. **Logga (FAB i mitten)** — *behåll men gör om*
Mitten-pillen i navbaren blir en upphöjd FAB (likt Instagram/Strava). Den öppnar **`ActivityPicker`-sheet** direkt (samma som dagens `QuickLogFab`). Snabbare än att gå till `/snabblogg`-sidan, men `/snabblogg` finns kvar som djuplänk.

Konsekvens: `QuickLogFab` på Today blir överflödig och tas bort (en plats att logga är bättre än två).

### 4. **Insikter** (`/insikter`) — *byt namn från "Vecka"*
Routen `/vecka` aliasas till `/insikter` (båda funkar). Sidan är redan rätt innehåll (vecko­trender, baseline, top-aktiviteter). Lägger till en topp-sektion:
- **Veckorapport** (PDF-genvägen som idag bor på Today, rad 772-787) flyttas hit — det är där rapporter hör hemma.

### 5. **Vård** (`/vard`) — *oförändrad*
Skattningar, läkemedel, exportrapport, krisplan. Lägger till en **direktlänk till Krisplan** högst upp (finns redan på rad 96-110, behåller).

### Mer-hub (`/mer`) — *NY, nås via header-knapp på Today*
Settings-cogen i Today-headern leder till en **Mer-meny** istället för direkt till Inställningar. Den listar:
- Krisplan (med röd accent)
- Hälsoanslutning (`/health`)
- Inställningar (`/installningar`)
- Om Riktning / utlogg

Inställningar slimmas: kontot, påminnelser, plats, data-export, om-sektionen. **"Mer i appen"-blocket** (Lär dig / Rutiner / Krisplan) försvinner — det innehållet bor nu i Utforska + Mer.

## Komplett route-karta efter ändring

| Route | Tab | Källa |
|---|---|---|
| `/` | Idag | navbar |
| `/utforska` | Utforska | navbar (ny) |
| `/ovningar`, `/ovningar/:id` | (Utforska → Övningar) | djuplänk |
| `/rutiner` | (Utforska → Rutiner) | djuplänk |
| `/lar-dig`, `/lar-dig/:slug` | (Utforska → Lär dig) | djuplänk |
| `/snabblogg` | FAB-sheet | djuplänk + FAB |
| `/checkin` | (Idag CTA) | knapp |
| `/journal` | (Idag CTA + chip) | knapp |
| `/insikter` (alias `/vecka`) | Insikter | navbar |
| `/rapport/vecka` | (Insikter topp) | knapp |
| `/vard` | Vård | navbar |
| `/krisplan` | (Vård + Mer) | knapp |
| `/mer` | header-cog på Idag | knapp |
| `/installningar` | (Mer) | knapp |
| `/health` | (Mer) | knapp |
| `/auth`, `/onboarding` | systemflöden | redirect |

## Konkret jobb att göra

1. **`src/components/BottomNav.tsx`** — byt tabs till `Idag · Utforska · [FAB] · Insikter · Vård`. FAB:en är ett upphöjt mitten-element (rundad knapp som överlappar nav-kanten med `-translate-y-3`).
2. **`src/App.tsx`** — lägg till routes: `/utforska`, `/insikter` (alias för `/vecka`), `/mer`. Ta bort ingen befintlig route.
3. **`src/pages/Explore.tsx`** — NY sida. Tre sektioner: Övningar (carousell, hämtar från `exercises`), Rutiner (carousell, från `exercise_sequences`), Lär dig (lista, från `learn_articles`). Återanvänd `ColorCard` + `Illustration`.
4. **`src/pages/More.tsx`** — NY sida. Enkel länklista (krisplan, hälsa, inställningar, om).
5. **`src/pages/Today.tsx`** —
   - Ta bort `forYou`-gating på `hasCheckin` i `src/lib/todayLayout.ts` rad 142 så carousellen syns direkt när det finns picks.
   - Höj `forYou` i prioritetslistan så den visas tidigt.
   - Ta bort `reportShortcut`- och `learn`-modulerna (flyttade till Insikter resp. Utforska).
   - Cog-ikon i hero leder till `/mer` istället för `/installningar`.
   - Ta bort `QuickLogFab` (FAB:en finns nu i navbaren).
6. **`src/pages/Settings.tsx`** — ta bort "Mer i appen"-sektionen (rad 188–217). Behåll konto, påminnelser, plats, data, om.
7. **`src/pages/Week.tsx`** — döp `<h1>` till "Insikter" (URL `/vecka` finns kvar, men `/insikter` blir kanonisk). Lägg PDF-rapportgenväg överst.

## Frågor innan jag bygger

Vill du att jag bekräftar några val?