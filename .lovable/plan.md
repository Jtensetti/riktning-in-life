## Navigation audit — vad fungerar och vad skaver

Jag gick igenom alla `navigate(...)` och `<NavLink>`-anrop i appen. Strukturen är i grunden bra: 5 tabbar (Idag, Utforska, Logga, Insikter, Vård), tydliga djupsidor (krisplan, övning, rutin, artikel), och en "Mer"-flik bakom kugghjulet. Det finns dock sex specifika ställen där destinationen känns fel eller saknas.

### Issue 1 — "Senaste aktivitet" landar alltid på `/ovningar`-listan
**Var:** `Today.tsx` rad 951
**Problem:** Du loggar 15 min dagsljuspromenad, trycker på loggen, och hamnar på en *lista över alla övningar* — inte på den övning du nyss gjorde.
**Fix:** Navigera till `/ovningar/${ex.id}` när vi har ett exercise-id (vilket vi alltid har — `s.exercises` är källan).

### Issue 2 — `/snabblogg` har ingen tillbaka-knapp
**Var:** `QuickLog.tsx` rad 334
**Problem:** Sidan nås från Today (quick-starts som "Logga sömn", "Snabblogga mående") och från Insikter (tomma-state CTA). Väl där finns ingen väg tillbaka utom att trycka tabbar nere.
**Fix:** Lägg till `topLeft`-tillbakaknapp i `ScreenHeader` som går `navigate(-1)` (eller `/` som fallback).

### Issue 3 — `/ovningar` har ingen tillbaka-knapp eller header-stil
**Var:** `Exercises.tsx` rad 92–94
**Problem:** Sidan är inte en tab, men nås från ~6 ställen (Today rec, Today routine, Explore "Se alla", LearnArticle, etc.). Använder `<h1>` direkt istället för `ScreenHeader`, och har ingen back.
**Fix:** Byt till `ScreenHeader screen="explore" title="Övningar"` med `topLeft={<button onClick={() => navigate(-1)}>← Tillbaka</button>}`.

### Issue 4 — `/journal` saknar tillbaka-knapp i listvyn
**Var:** `Journal.tsx` rad 207
**Problem:** Nås via Today quick-starts ("Skriv tre rader", "Imorgon-lista"). I editor-läget finns en tillbaka, men listvyn saknar.
**Fix:** Lägg `topLeft` i `ScreenHeader` på listvyn → `navigate(-1)`.

### Issue 5 — `Mer` "Tillbaka" är `navigate(-1)`, men nås bara från Idag
**Var:** `More.tsx` rad 19
**Problem:** Funkar oftast, men om man landar i appen via push-länk eller delad URL direkt på `/mer` blir bakåt en historikbugg (kan ta dig ut ur appen).
**Fix:** Byt till `navigate("/", { replace: false })` med `-1` som fallback. Liten kanttill men mer förutsägbart.

### Issue 6 — `ExerciseDetail` "back" går alltid till `/ovningar` (eller rutinen)
**Var:** `ExerciseDetail.tsx` rad 148
**Problem:** Om du startade en övning från Today's "Rekommenderat just nu" eller från en artikel, kastas du till listsidan istället för dit du kom från. `useSmartBack`-hooken finns redan men används inte här.
**Fix:** Använd `useSmartBack({ defaultTo: "/" })` så sequence-kontext respekteras och övriga ingångar går tillbaka i historik. Eller enklare: använd `navigate(-1)` som default när ingen sequence finns.

### Det som *fungerar bra* (vi rör inte)
- Bottom nav: 5 tabbar, FAB är kontextuell (öppnar check-in om dagen inte är loggad, annars picker). Logiskt.
- Vård är en tab och behöver ingen tillbakaknapp. Sub-views (Formulär, Mediciner, Rapport) har lokal "Tillbaka" via state.
- Krisplan, Settings, LearnArticle, SequenceDetail har alla rimliga tillbaka-knappar.
- Checkin → "Tillbaka" till `/` är rätt (det är en wizard, ej en djuplänk).
- Auth/Onboarding använder `replace: true` korrekt.

### Filer som ändras
- `src/pages/Today.tsx` — 1 rad (issue 1)
- `src/pages/QuickLog.tsx` — lägg till topLeft (issue 2)
- `src/pages/Exercises.tsx` — byt h1 mot ScreenHeader med topLeft (issue 3)
- `src/pages/Journal.tsx` — lägg till topLeft (issue 4)
- `src/pages/More.tsx` — ändra back-target (issue 5)
- `src/pages/ExerciseDetail.tsx` — använd useSmartBack eller `navigate(-1)` (issue 6)

Inga schemaändringar, inga nya beroenden. Endast 6 små edits.
