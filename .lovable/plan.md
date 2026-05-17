# Desktop-omdesign v2 — utifrån dina skärmdumpar

Skärmdumparna avslöjar fyra konkreta problem som planen behöver lösa direkt. Mobilen rörs inte i något steg.

## Vad funkar (behåller vi)

- **Topbar** med datum/vecka + check-in-CTA + e-post + logga ut är ren.
- **Utforska** är nästan i mål — 4-kolumns grid läser bra, situations-sektioner är tydliga.
- **Färger, typografi, tone-of-voice** — sitter. Inget formspråk ska ändras.
- **WeeklyPlaybook-, VeckansBild-, RiskSignals-kort** är välkomponerade i sig.

## Vad som inte funkar — diagnos per skärm

### 1. Today (Idag) — "smalt" mittsegment, lufthål till vänster
- Innehållet ligger i ~880 px mittkolumn med ~250 px tom luft mellan SideNav och första kortet.
- "För dig"-korten *skär av* till höger (sista kortet trunkeras).
- "Senaste aktivitet" hamnar i höger underkolumn där den knappt syns.

### 2. Insikter — vertikal lista som tvingar scroll, tom högerkolumn
- Veckomatta + Snabb-sammanfattning + Playbook + Veckans bild + (senare) Riktning-graf staplas i en kolumn på ~870 px.
- Högerkolumnen är **helt tom** efter "Detaljer / Återhämtningshistorik" — flera tusen px tomrum.
- Användaren ska inte behöva scrolla för att hitta sin riktning-graf.

### 3. Vård — mest tomma ytor
- Hela vänsterkolumnen är vit/tom; allt innehåll trängs i höger ~480 px.
- Worst-offender: 1575 px skärm visar ~480 px innehåll = ~30 % utnyttjande.

### 4. Snabblogg (Sömn/Kropp/Mående/Medicin) — sheets spränger skärmen
- Bottom-sheets renderas i **full skärmbredd 1920 px**. Sömn-skalan 0–10 blir 11 enorma rutor som är omöjliga att skanna.
- Mående har 33 rutor på en rad → meningslöst som UI.

### 5. SideNav — abstrakta stickers säger inget
- Items: små färgade klumpar utan semantik. "Idag", "Utforska", "Insikter", "Analys", "Vård" får ikoner som ser likadana ut.
- Snabblogg-chips är 4 små klotter ovanför "Logga aktivitet".

### 6. Övrigt
- Hero-bannern (grön/lila/orange) på varje sida tar 200 px höjd och säger bara sidans namn → bortkastat space på desktop.
- Topbar har "Skriv i journalen" som **gigantisk gul knapp** i sidomenyn, men på Today/Insikter syns ingen journal-genväg i toppen.

---

## Plan — i 5 fokuserade steg

### Steg 1 — Riv 560 px-cappen och fyll bredden korrekt

`AppShell`:
- Default desktop-bredd höjs till **`max-w-[1440px]`** (vi har 1575 px att jobba med).
- Inner-padding: `lg:px-8` (inte `px-10`) — varje pixel av läsyta räknas.
- Ta bort `wide`-propen helt; alla sidor blir "wide" på desktop. För renderingar som **vill** centrera (LearnArticle, Onboarding, Auth) införs `density="reader"` som cappar 760 px centrerat.

Effekt: Today/Insikter/Vård fyller ~1170 px innehåll bredvid 270 px SideNav. Inget hål till vänster.

### Steg 2 — Krymp hero, ge varje sida ett desktop-eget rutnät

Hero-bannern blir på desktop en **kompakt sidhuvud-rad** (56 px hög: ikon + titel + 1-rads subtitle), inte ett 200 px-block. Mobilen behåller stort hero.

Nya layouts per sida (mobilflöden orörda):

**Today** — 3-kolumns `DashboardGrid`:
```text
┌───── header (kompakt) ─────────────────┐
│ Greet · State · Baseline-progress · KPI│
├──────────┬──────────────┬───────────────┤
│ Primär   │ För dig      │ Risksignaler  │
│ rek-kort │ (4-grid, ej  │ Senaste akt   │
│ +State   │ overflow!)   │ (tidslinje)   │
│ +QuickLog│ Evening pred │ Väder         │
│          │ Dagens rutin │ Krisplan-länk │
└──────────┴──────────────┴───────────────┘
```
"För dig" går från `overflow-x-auto`-snap-carousel → `lg:grid lg:grid-cols-3` (inget klipps).

**Insikter** — break upp vertikala listan i ett verktygsbord:
```text
┌── Veckomatta (full bredd, +sparkline per rad) ──┐
├───────────────────────────┬─────────────────────┤
│ Riktning-graf (stor)      │ Veckans playbook    │
│                           │ (sticky)            │
├───────────────────────────┤                     │
│ Veckans bild (narrativ)   │                     │
├───────────────────────────┴─────────────────────┤
│ Rörelse+återhämtning · Vad gjorde dagen av ·    │
│ Dagslista (3-kol grid, inte stack)              │
└──────────────────────────────────────────────────┘
```
Resultat: Riktning-grafen är synlig **utan scroll**, playbook följer med som sticky aside.

**Vård** — flytta alla wizard-vyer in i ett `SplitWorkspace`:
- Vänster (60%): aktiv sektion (PHQ/GAD-status, mediciner, kontakter, rapport-byggare)
- Höger (40%): kontextpanel — kommande skattningar, risksignaler, senaste exporter
- Subvyer som idag pushar till nya routes blir **inline-paneler** i samma split.

### Steg 3 — Snabblogg-sheets blir centrerade desktop-modaler

På `lg+` byter Sheet-komponenten variant:
- Mobil: bottom-sheet som idag (oförändrat).
- Desktop: **centrerad modal**, `max-w-[720px]`, max-height 80vh, scrollbar inom modal.
- Skalan 0–10 renderas som **kompakta knappar** (40×40 px med tonad bakgrund för valt steg), inte feta rutor som tar 150 px höjd vardera.
- Mående-vyn: tre rader om 11 knappar = 720 px bredd · 3 × 56 px höjd, inte 1920 × 1000 px.

Implementeras genom att lägga `lg:` overrides i `sheet.tsx`/skapa `ResponsiveDialog`-wrapper.

### Steg 4 — Nya, tydliga ikoner i SideNav (desktop-only)

Ersätt `AbstractIcon`-stickers på desktop med **lucide-react line-icons + sektionsfärgad bakgrundsbricka**:

| Item | Ikon | Färg |
|---|---|---|
| Idag | `Home` | orange |
| Utforska | `Compass` | pink |
| Insikter | `LineChart` | green |
| Analys | `BarChart3` | purple |
| Vård | `Stethoscope` | blue |
| Snabblogg | `Zap` | orange |
| Krisplan | `ShieldAlert` | red |
| Inställningar | `Settings` | foreground |

- Ikonstorlek: 22 px, stroke 2.
- Aktivt läge: ikon i sektionsfärg + 14 % bg + 3 px vänsterstreck (behåll dagens mönster).
- Mobilens BottomNav rör vi inte (där fungerar AbstractIcon-stickers visuellt).

Snabblogg-chipsen ovanför "Logga aktivitet" byts från 4 små klotter till **4 rena ikon-knappar** (Moon, Activity, SmilePlus, Pill) med samma färgkodning, label i `title=`.

### Steg 5 — Desktop-finish

- **Hover-states** på alla kort: `hover:-translate-y-0.5 hover:shadow-lg`.
- **Tooltips** på chart-axlar och KPI-deltas (Radix Tooltip finns).
- **Command palette `⌘K`** med snabbnavigering + "logga aktivitet" + "starta check-in" + sök övning. Aktiveras endast `lg+`.
- **`⌘N` / `n`** → ny journal-anteckning, **`?`** → genvägshjälp.
- **Dölj FAB** på desktop (redan delvis gjort; verifiera).
- **Densitet**: body-text på desktop `text-[15px]` (mobil behåller `text-[17px]`).

---

## Teknik

- All ny chrome bor i `src/components/desktop/`. Mobil-JSX oförändrad.
- Per sida: `{<div className="lg:hidden">mobil</div>}{<div className="hidden lg:block">desktop</div>}` så mobilträden fryses bit-för-bit.
- Inga nya paket: `lucide-react`, `cmdk` (Command), `Tooltip`, `Dialog` finns alla redan.
- Memory: `mem://design/desktop-patterns` uppdateras med DashboardGrid + SplitWorkspace + ResponsiveDialog + ikon-mappningen. Core-regeln "skriv aldrig egna `lg:grid-cols`-rotlayouter" förstärks med exempel från Today/Insikter.

## Leveransordning

1. **Steg 1 + 2 (Today)** i en runda — direkt synlig effekt: ingen smal kolumn, "För dig" klipps inte längre.
2. **Steg 4 (ikoner)** — snabb vinst, kan göras parallellt.
3. **Steg 2 (Insikter + Vård)** — den största omfördelningen av yta.
4. **Steg 3 (sheets → modaler)**.
5. **Steg 5 (polish)**.

Säg till om jag ska köra hela kedjan eller bara börja med Steg 1+2+4 (största synliga vinsten).
