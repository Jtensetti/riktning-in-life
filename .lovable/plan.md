## Problem

`deleteAll` i `src/pages/Settings.tsx` raderar bara 6 av 11 användarägda tabeller, och rör inte localStorage-cachen. Vid nästa inloggning återställs delar av datan från servern (om något lämnats kvar) eller från lokal cache.

### Saknas idag
**Tabeller som inte raderas:**
- `activity_logs` — alla snabbloggar
- `activity_favorites` — favoritmarkeringar
- `crisis_plans` — krisplanen
- `weekly_insights` — AI-genererade veckoinsikter
- `user_settings` — påminnelser, baslinje, action_prefs, doctor_email, weekly_questions

**Lokal cache som inte rensas:**
Alla `riktning_*`-nycklar i localStorage (reminders, baseline, action_prefs, doctor_email, weekly_questions, last_seen_at, onboarded).

**Felhantering:** Catch-blocket sväljer felet tyst utan att visa vilken tabell som fallerade. Om en delete failar avbryts resten.

## Åtgärd

### 1. `src/pages/Settings.tsx` — utöka `deleteAll`

- Lägg till delete för: `activity_logs`, `activity_favorites`, `crisis_plans`, `weekly_insights`, `user_settings`.
- Kör alla i `Promise.all` så att en miss inte stoppar resten, men kontrollera varje resultat.
- Logga felet och visa vilken tabell som strulade i toast (`Kunde inte radera: <tabell>`) istället för tyst svalt fel.
- Efter DB-rensning: rensa alla `riktning_*`-nycklar i localStorage (loopa `Object.keys(localStorage)` och ta bort allt med `riktning_`-prefix). Detta måste ske **före** `signOut` så att ingen rehydrering hinner skriva tillbaka något.

### 2. Bekräftelse

`hydrateUserSettings` skapar en ny `user_settings`-rad vid nästa inloggning från lokala värden — eftersom localStorage nu är tomt blir det rena defaults, vilket är önskat beteende.

### Inga schemaändringar
Ren frontend-fix. Inga migrations behövs. RLS-policies finns redan för alla berörda tabeller.
