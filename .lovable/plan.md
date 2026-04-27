## Vad jag fixar

### 1. Inga emojis i aktivitetsflödet — `src/components/ActivityPicker.tsx`
Skattningen "Hur kändes det efteråt?" använder idag 😔🙁😐🙂😊. Byter till **rena text-pillar** (tonas med färg + vikt så det fortfarande känns lekigt, inte kliniskt):
- Sämre · Lite sämre · Som vanligt · Lite bättre · Mycket bättre
- Aktiv pill = mörk fyllning (som idag), inaktiv = surface med border-soft.
- Tar också bort den lilla `Star`-fyllda emoji-känslan? Nej — `Star` är en lucide-ikon, inte emoji, den får vara kvar (du bad oss göra den mindre, det är gjort).

### 2. Aktivitetskort utan ellips — `PickerCard` i `ActivityPicker.tsx`
Nu: fast `height: 88px` + `line-clamp-2` → långa namn ("Skicka ett meddelande till …", "Lyssna på musik som …") trunkeras.
Ändring:
- Ta bort fast höjd. Sätt `minHeight: 88px` istället så kortet växer.
- Ta bort `line-clamp-2`. Texten får wrappa till 3 rader vid behov.
- Behåll padding 14/18 och radius 24 — visuellt likvärdigt för korta namn, men långa namn syns helt.
- Stjärnan ligger redan absolut top-right; rätt-padding (`paddingRight: 40`) räcker när texten wrappar.

### 3. "Frun" → könsneutralt — seed-data
Två rader i `supabase/migrations/20260426133127_…sql` har "frun":
- `('date-fru', 'Date-kväll med frun', …)`
- `('film-med-frun', 'Titta på en film med frun', …)`

Skapar **ny migration** som uppdaterar befintliga rader (UPDATE på `activity_catalog`):
- "Date-kväll med frun" → **"Date-kväll med partner"**
- "Titta på en film med frun" → **"Titta på en film med partner"**

(Slugs behålls för att inte tappa historik/favoriter.)

### 4. Vård-knappar — enhetlig färg, ingen 3D-accent — `src/pages/Vard.tsx`
Idag: vita kort med en `borderLeft: 4px solid <color>` accent som ser ut som en 3D-flik bredvid kortet.

Ändring (samma språk som ActionCard / Today): **hela kortet får tonen**, mjukt och färgglatt.
- Veckoskattningar (PHQ-9 / GAD-7 / WHO-5):
  - Bakgrund = `--yellow-journal` / `--pink-move` / `--green-recovery` (samma toner som idag, men hela ytan, ~85-100% mättnad).
  - Ikon-tile = vit/22 % opacitet (som ActionCard).
  - Text = vit på pink/green, mörk på yellow (samma `isLightTone`-regel som ActionCard).
  - Tar bort `borderLeft`-accenten helt.
- "Läkemedel & biverkningar":
  - Bakgrund = `--pink-move` (eller `--orange-start` för värme — jag väljer pink för att hålla läkemedels-pillerikonen tydlig).
  - Vit ikon-tile + vit text.
  - Tar bort `borderLeft`.
- "Min krisplan" lämnas i sin lugna röd-tinted-cream-stil — den är tänkt att vara dämpad, inte signal-röd.
- "Rapport"-kortet (blå gradient med illustration) lämnas — det är redan enhetligt med appens språk.

Resultat: Vård-listan får samma färgglada Headspace-känsla som Idag/Utforska, utan att tappa identitet.

## Vad som INTE ändras
- Ingen ändring i mood-emojis i `QuickLogPills` eller `QuickLog.tsx` (du sa "aktivitet ska inte ha emojis" — det gäller aktivitetspickern). Säg till om du vill ta bort dem där också.
- Ingen ändring i datamodell, navigering, eller header.
- Stjärn-favorit-ikonen (lucide `Star`) behålls — det är en ikon, inte emoji.

## QA
Efter ändringen kollar jag i preview:
- Aktivitetspicker: långa labels visas helt utan "…".
- Skattningssteget visar text-pillar istället för emojis.
- "Date-kväll med partner" / "Titta på en film med partner" finns i listan.
- Vård-sidan: alla tre skattningskort + läkemedelskortet är fullfärgade utan 3D-accent.
