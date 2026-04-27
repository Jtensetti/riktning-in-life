## 1. Fix: "Mående +1" visas rött

**Buggen:** I `Senaste aktivitet`-listan på Idag-sidan markeras Mående med "lägre = bättre"-logik, samma som Ångest. Det betyder att Mående +1 (förbättring) får varningston (röd) istället för positiv ton (grön).

**Fix:** En rad i `src/pages/Today.tsx` (rad 935):
- Ändra `pushDelta("Mående", s.mood_before, s.mood_after, true)` → `false` (högre mående = bättre, precis som Energi).

Resultat: Mående +1 blir grön, Mående -1 blir röd. Ångest och Energi rörs inte.

## 2. Aktivitetsberoende kontextfält i loggning

Idag visar `ActivityPicker` redan två villkorliga fält efter `semantic_kind`:
- `rorelse` → Intensitet (Lätt/Medel/Hård)
- `socialt` → Med vem (Ensam/Partner/Barn/Vän/Kollega/Annan)

Förslag: lägg till **bara två till**, där det ger tydligt kliniskt värde utan att skapa rörighet. Allt valfritt, samma visuella mönster (chip-rad, "valfri"-etikett).

**a) `somn` → Sömnkvalitet (valfri)**
Chips: `Dålig` · `Okej` · `Bra`
*Varför:* Sömn loggas redan separat i check-in, men när användaren snabbloggar t.ex. "Tupplur" eller "Sov om" är upplevd kvalitet det enda som verkligen tillför något till mönsteranalysen.

**b) `aterhamtning` → Plats (valfri)**
Chips: `Inne` · `Ute`
*Varför:* "Ute"-återhämtning (promenad utan träningssyfte, sitta i parken) korrelerar tydligt annorlunda mot mående än inne. Två val, inga fler — en boolean-känsla, inte en formulär.

**Vi gör inte (för att undvika kaos):**
- `fokus`, `vardag`, `journal` får inga extra fält. Dessa är redan självförklarande och extra metadata skulle bara fördröja loggningen.
- Inga humörsspecifika frågor, inga fritextfält, inga "varför"-rutor.

### Datamodell
- Återanvänd befintliga kolumner där möjligt. `intensity` används idag bara av rörelse — vi kan återanvända den för sömnkvalitet (`latt`=dålig, `medel`=okej, `hard`=bra) **eller** lägga till ett nytt nullable `quality`-fält. Rekommendation: nytt fält `sleep_quality` + `location` (text, nullable) i `activity_logs`, för att hålla semantiken ren. Migration skriver bara nya nullable-kolumner — påverkar ingen befintlig data.

### Filer som ändras
- `src/pages/Today.tsx` — en rad (bugfix punkt 1)
- `src/components/ActivityPicker.tsx` — två nya villkorliga block efter rad 517, plus state + insert-payload
- `supabase/migrations/...sql` — `ALTER TABLE activity_logs ADD COLUMN sleep_quality text, ADD COLUMN location text;`
- `src/integrations/supabase/types.ts` — regenereras automatiskt

Om du tycker att även (a) eller (b) är överflödigt — säg till så hoppar vi det och kör bara bugfixen.
