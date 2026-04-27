## Desktop-flöde — genomtänkt, ärligt mot varje sida

**Premiss:** Mobilen rörs inte. Allt nedan aktiveras endast vid `lg:` (≥1024px). Under det breakpointet är appen pixel-identisk med idag.

### Designfilosofin bakom valet

Jag övervägde fyra olika riktningar (fast sidebar+kontextpanel, master-detail, parallella handlingar, eller en *adaptiv* layout per sida). Den som faktiskt respekterar både Riktnings karaktär *och* desktop som medium är den fjärde — för en enkel anledning:

> **Vissa sidor i Riktning blir bättre när de får luft. Andra blir sämre.**

Idag och Krisplan är *rofyllda läs-strömmar* — designade för att man ska andas mellan korten. Att tvinga in dem i en bred grid skulle förstöra rytmen. Insikter och Vård är däremot *översikter med flera lager* — de tjänar verkligen på att visa graf och lista samtidigt, eller skattningar och mediciner sida vid sida.

Så istället för en universal layout som behandlar alla sidor lika, gör vi det här:

```text
┌──────────────────────────────────────────────────────────────────┐
│ Riktning                                       [konto] [logga ut]│  topbar 56px
├──────────┬───────────────────────────────────────────────────────┤
│          │                                                       │
│ SIDEBAR  │   INNEHÅLL  (varierar per sida — se nedan)            │
│ 240px    │                                                       │
│          │                                                       │
│ Idag     │                                                       │
│ Utforska │                                                       │
│ ⊕ Logga  │                                                       │
│ Insikter │                                                       │
│ Vård     │                                                       │
│ ─────    │                                                       │
│ Journal  │                                                       │
│ Krisplan │                                                       │
│ Inställ. │                                                       │
└──────────┴───────────────────────────────────────────────────────┘
```

### Två innehållslägen — sidan väljer själv

**Läge 1: "Lugn ström" (max-w-md, centrerad)**
Sidan renderas exakt som på mobil — 448px-kolumn, samma kort, samma rytm. Bara centrerad i det tillgängliga utrymmet med generös cream-bakgrund runt.

Används för: **Idag, Krisplan, Journal-editor, Checkin (wizard), Onboarding, Auth, ExerciseDetail (övningsspelare), LearnArticle.**

Varför: Dessa är *fokustillstånd*. När du gör en check-in eller läser en artikel ska resten av världen falla bort. På desktop blir det en lugn, läsbar bok mitt på skärmen — inte ett dashboard.

**Läge 2: "Arbetsyta" (bred, två-kolumns inom sidan)**
Sidan får använda hela bredden (max ~1200px). Vänster kolumn = primärt innehåll (graf/översikt). Höger kolumn = sekundärt (lista/detaljer). Båda kolumnerna är fortfarande *sidans egna sektioner* — vi flyttar inte in fjärrinnehåll.

Används för: **Insikter, Vård, Utforska, Övningar (lista), Sequences (lista), Learn (lista), Mer.**

Varför: Dessa sidor består redan av flera oberoende sektioner som staplas vertikalt på mobil. På desktop är det slöseri — sektionerna kan stå sida vid sida.

### Konkret per sida

| Sida | Desktop-läge | Vad ändras inuti |
|------|--------------|------------------|
| **Idag** | Lugn ström | Inget. Samma flöde, centrerat. |
| **Utforska** | Arbetsyta | Vänster: hjälte-kort + kategorier. Höger: "Senast" + "Föreslaget för dig". |
| **Insikter (Week)** | Arbetsyta | Vänster: trender + chart. Höger: prio-kort + senaste loggar. |
| **Vård** | Arbetsyta | Vänster: krisplan-kort + skattningar. Höger: läkemedel + rapport-export. |
| **Krisplan** | Lugn ström | Inget. Centrerad. |
| **Journal (lista)** | Arbetsyta | Vänster: mallar. Höger: tidigare anteckningar. |
| **Journal (editor)** | Lugn ström | Inget. Skrivande = fokus. |
| **Övningar / Sequences / Learn** | Arbetsyta | Vänster: sök + kategorier. Höger: lista. |
| **ExerciseDetail / LearnArticle** | Lugn ström | Inget. Läsa = fokus. |
| **Checkin (wizard)** | Lugn ström | Inget. Fyll i = fokus. |
| **Inställningar / Mer** | Arbetsyta | Vänster: sektioner. Höger: konto/data. |
| **Auth / Onboarding** | Lugn ström | Centrerad, mjuk bakgrund. |

### Sidebar i detalj

- 240px bred, fast vänster, full höjd, cream-bakgrund med tunn border höger.
- 8 rader: Idag, Utforska, **Logga (orange knapp, sticker ut)**, Insikter, Vård · separator · Journal, Krisplan, Inställningar.
- Aktiv rad får färgad vänsterkant + bakgrund i tabbens identitet (samma `screenIdentity`-färg som mobil-tabben har).
- "Logga"-knappen öppnar samma `ActivityPicker` som FAB:en.
- **Ingen kollaps.** Riktning är inte ett produktivitetsverktyg där man behöver dölja navigation. Lugn och förutsägbar.

### Topbar i detalj

- 56px hög, full bredd, samma cream som resten.
- Vänster: ordmärket "Riktning" (text, ingen ny logo-fil).
- Höger: e-post + en liten utloggningsikon. Det är allt.
- Ingen sökruta, ingen avisering, ingen notifikations-bjällra. Inte den sortens app.

### Vad jag medvetet INTE gör

- **Ingen kontextpanel som visar "annan info".** Alla data på en sida hör hemma på den sidan. Vi blandar inte.
- **Ingen modal-stack eller flytande paneler.** Lugnt, statiskt, förutsägbart.
- **Inga nya komponenter för datapresentation.** Återanvänder `InsightCard`, `ListCard`, `ActionCard`, `ColorCard` rakt av — bara i grid istället för stack.
- **Ingen "förstoring" av mobilkort.** Korten har samma storlek på desktop som mobil. Vi sätter bara två bredvid varandra istället för en under en.
- **Inga route-ändringar.** Samma URL:er, samma djuplänkar, samma back-knappar.

### Implementationen i kod

**Nya filer:**
- `src/components/desktop/DesktopShell.tsx` — wrappar `AppShell`s innehåll på `lg:`. Innehåller sidebar + topbar + slot för sidans innehåll.
- `src/components/desktop/SideNav.tsx` — 8-radig sidebar med screenIdentity-färger.
- `src/components/desktop/DesktopTopbar.tsx` — 56px topbar.
- `src/components/desktop/WideLayout.tsx` — enkel wrapper: `<WideLayout left={...} right={...} />`. Renderar two-column på `lg:`, stack på mobil. Sidor som vill ha "arbetsyta" använder den.

**Ändrade filer:**
- `src/components/AppShell.tsx` — på `lg:` rendera `DesktopShell` runt `<main>`. Mobil-rendering oförändrad (samma `max-w-md`).
- `src/components/BottomNav.tsx` — `lg:hidden`.
- `src/pages/Week.tsx`, `Vard.tsx`, `Explore.tsx`, `Exercises.tsx`, `Sequences.tsx`, `Learn.tsx`, `Journal.tsx`, `More.tsx`, `Settings.tsx` — wrappa innehållssektionerna i `<WideLayout left right>`. På mobil renderas `WideLayout` som vanlig stack — så ingen visuell förändring där.
- `src/pages/Auth.tsx`, `Onboarding.tsx`, `Checkin.tsx`, `ExerciseDetail.tsx`, `LearnArticle.tsx` — ingen ändring i innehållet, bara en `lg:`-bakgrund som säkerställer att det centrerade `max-w-md`-innehållet ser lugnt ut på en stor skärm.

**Alla ändringar är `lg:`-prefixade eller villkorade på breakpoint.** På mobil = noll diff i renderat DOM-träd.

### Resultat — för riktiga användare

- **På mobil:** Inget har hänt. Pixel-identiskt.
- **På laptop (1366×768) eller större:**
  - Ingen bottom-nav, en lugn vänster-sidebar istället. Logga-knappen är direkt synlig.
  - Idag, Krisplan och alla wizards/läs-vyer känns som en boksida mitt på skärmen — inbjudande, inte tomma.
  - Insikter, Vård, Utforska blir riktiga översikter där du ser allt på en skärm utan att scrolla — *utan att informationen ändras*.
  - Riktnings karaktär (cream, runda hörn, bokstavstung typografi, en handling i taget) är intakt. Det känns inte som en mobilapp i en ram, men inte heller som en främmande dashboard.

Inga schema-ändringar. Inga nya beroenden. Endast en ny `lg:`-lager ovanpå nuvarande kod.
