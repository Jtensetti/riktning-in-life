## Mål
Göra Riktning 100 % spec-trogen och produktionsredo. Inga nya features utöver specen.

---

## 1. Onboarding (4 skärmar) — `src/pages/Onboarding.tsx` + route `/onboarding`
- Skärm 1: "Det här är Riktning" — kort syfte, "inte diagnostisk", spårar riktning/funktion/återhämtning
- Skärm 2: "Första 14 dagarna bygger baslinje" — ingen bedömning under baslinje
- Skärm 3: Lägg till läkemedel (valfritt) — `name`, `dose`, `date_started` → skriver till `medications`
- Skärm 4: Välj påminnelse (valfritt) — morgon-checkin / kvällsjournal / veckoformulär (sparas i localStorage `riktning_reminders`, ingen push i v1)
- Lagra `onboarded_at` i localStorage. `Today` redirectar till `/onboarding` om inte satt och användaren är inloggad.
- Hoppa över-knapp på alla steg.

## 2. Inställningar — `src/pages/Settings.tsx` + route `/installningar`
- Liten kugghjuls-knapp i `Today`-headern (ersätter/komplement till logout)
- Innehåll:
  - Konto: e-post, "Logga ut"
  - Påminnelser (samma toggle-set som onboarding step 4)
  - **Exportera all data**: hämtar alla rader (checkins, exercise_sessions, journal_entries, weekly_forms, medications, medication_logs) → laddar ner som JSON-fil
  - **Radera all data**: bekräftelsedialog (skriv `RADERA`) → `delete().eq("user_id", user.id)` på alla användartabeller, sedan `auth.signOut()`
  - Länk till "Om Riktning" (kort text om att appen inte är diagnostisk)

## 3. PDF-export — `src/pages/Vard.tsx` (ReportView)
- Lägg till `jspdf` (`bun add jspdf`)
- Tre knappar efter generering: **Kopiera**, **Ladda ner text**, **Ladda ner PDF**
- PDF-layout: A4, Nunito Sans-fallback (Helvetica), rubriker, sektioner — samma innehåll som textrapporten, men med radbrytning och sidnumrering
- Filnamn: `riktning-rapport-YYYY-MM-DD.pdf`

## 4. Markera journal-anteckningar för rapport — `src/pages/Journal.tsx`
- I historik-listan: liten toggle-pill "Inkludera i rapport" (skriver `include_in_report` till DB)
- I detaljvy efter spara visa kort förklaring: "Du kan markera anteckningar för export i Vård."
- Lägg till räknare i Vård-rapportvyn: "X markerade tillgängliga"

## 5. Idag — Senaste aktivitet (mini-timeline) — `src/pages/Today.tsx`
- Hämta senaste 3 `exercise_sessions` med joinad `exercises.title`
- Visa under rekommendationen som timeline (vertikal stipplad linje #D7D0C9, datum, titel, typ, duration, chevron)
- Om tom: dölj sektionen (ingen tom-text)

## 6. Komplett metrik-formel — `src/lib/metrics.ts` + `src/pages/Week.tsx`
- `burdenScore` accepterar valfri `phq9` & `gad7` veckoskatt + returnerar `{ value, withWeekly: boolean }`. Vikta enligt spec när tillgängliga, annars nuvarande dagliga vikter.
- `Week.tsx` hämtar senaste PHQ-9/GAD-7 inom de 7 dagarna och skickar in. Visa etiketten `"utan veckoskattning"` på Belastning-kortet om `withWeekly === false`.
- Lägg till två insikter:
  - "Sömn under 5 h följs ofta av högre oro" — jämför nästa dags `anxiety` efter dag med `sleep_hours < 5`
  - "Säng/sofftid över 120 min sammanfaller med lägre funktion" — korrelation samma dag
- `Stabilitet`-kortet: visa kort etikett "Mer stabil" / "Mindre stabil" / "Stabil" baserat på score och förändring jämfört med förra veckan, snarare än bara siffra.
- 14-dagars baseline-gate: om `total < 14`, gråa ut metric-värden och visa "Baslinje byggs" istället för %-jmf.

## 7. Auth & säkerhet
- `Auth.tsx`: `emailRedirectTo: \`${window.location.origin}/\`` (explicit slash)
- Kör `supabase--linter` efteråt och fixa eventuella varningar

## 8. PWA-polish
- Verifiera att `manifest.webmanifest` länkas korrekt i `index.html`
- Säkerställ att meta `theme-color` matchar app_bg `#FAF7F2`

---

## Filer som kommer skapas
- `src/pages/Onboarding.tsx`
- `src/pages/Settings.tsx`

## Filer som kommer ändras
- `src/App.tsx` (rutter `/onboarding`, `/installningar`)
- `src/pages/Today.tsx` (kugghjul, redirect till onboarding, mini-timeline)
- `src/pages/Auth.tsx` (redirect URL)
- `src/pages/Journal.tsx` (include_in_report toggle)
- `src/pages/Vard.tsx` (PDF-export, räknare för markerade journal)
- `src/lib/metrics.ts` (burden med PHQ/GAD, stabilitetsetikett, fler insikter)
- `src/pages/Week.tsx` (förbrukar nya formler + insikter, baseline-gate, "utan veckoskattning"-etikett)

## Beroenden
- `bun add jspdf`

## Acceptans
- Ny användare: ser onboarding 1 gång, kan hoppa över
- Inställningar: kan exportera all sin data som JSON och radera allt
- Vård: PDF-knapp finns och fungerar; rapport innehåller exakt det specen listar
- Journal: kan markera anteckningar för rapport
- Idag: visar 4 status-pills + senaste 3 aktiviteter
- Vecka: Belastning visar "utan veckoskattning" när PHQ/GAD saknas; stabilitet visar etikett; alla 4 insikter kan triggas av rätt data
- Inga lint-varningar från Supabase-lintern