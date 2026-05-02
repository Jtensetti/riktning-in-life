## Problem

`/vård` har tre nya formulär (MADRS-S, KEDS, BBQ-12) men de sparas inte. Frontend-koden är korrekt — INSERT mot `weekly_forms` blockeras av en CHECK-constraint i databasen:

```
weekly_forms_type_check  CHECK ((type = ANY (ARRAY['phq9','gad7','who5'])))
```

Hela databasen verifierad: detta är den enda CHECK-constraint som hindrar de tre nya formulären. Allt annat sparas redan korrekt — `journal_entries.template_type`, `daily_checkins.*`, `medication_logs.*`, `activity_logs.*` är konsekventa med koden, inga andra "luckor" finns där frontend skickar data som blockeras.

## Åtgärd

En enradig migration som ersätter constraint:en med en uppdaterad lista, så att alla sex formulär kan sparas:

```sql
ALTER TABLE public.weekly_forms
  DROP CONSTRAINT weekly_forms_type_check;

ALTER TABLE public.weekly_forms
  ADD CONSTRAINT weekly_forms_type_check
  CHECK (type = ANY (ARRAY['phq9','gad7','who5','madrs','keds','bbq12']));
```

Inga datamigrationer behövs — befintliga rader är phq9/gad7/who5 och uppfyller redan villkoret.

## Inga andra ändringar

- Frontend-koden i `FormRunner` (`src/pages/Vard.tsx`) och definitionerna i `src/lib/forms.ts` är redan korrekta — sparlogiken (`supabase.from("weekly_forms").insert`) är gemensam för alla formulär.
- RLS är redan satt och fungerar (samma policies används av phq9-inserten som lyckas idag).
- Rapport/PDF läser redan `weekly_forms` generiskt så de tre nya kommer med automatiskt så snart sparningen fungerar.

## Verifiering efter migration

Öppna `/vård`, fyll i exempelvis MADRS-S, klicka "Klar" → toast "MADRS-S sparad" → kortet visar "Senast: X / 54 · etikett".
