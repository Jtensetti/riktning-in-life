# Lägg till MADR-S, KEDS och BBQ-12 i /vård

Tre nya skattningar adderas som självständiga formulär i samma flöde som PHQ-9 / GAD-7 / WHO-5. Allt återanvänder befintlig `FormRunner`, `weekly_forms`-tabellen och PDF-rapporten — inga schemaändringar behövs (`type` är redan fri text, `total_score` är numerisk, `answers_json` är jsonb).

## Vad användaren får

I `/vård` får sektionen "Veckoskattningar" tre nya kort under PHQ-9 / GAD-7 / WHO-5:

- **MADR-S** — depression, senaste 3 dagarna, 9 frågor, 0–54 poäng
- **KEDS** — utmattning, senaste 2 veckorna, 9 frågor, 0–54 poäng (vi tar bara med de 9 första; den 10:e "Anteckningar" hanteras inte som poängfråga)
- **BBQ-12** — livskvalitet, 12 frågor i 6 par (nöjdhet × viktighet), 0–96 poäng

Varje kort visar samma layout som idag: ikonbricka i tonal färg + titel + "Senast: X / max · etikett".

## Form-design

### MADR-S och KEDS — 0–6-skalan
Skalan har officiellt sju steg där bara 0, 2, 4 och 6 har beskrivande text och 1, 3, 5 är "mellanlägen". Vi följer originalformatet och visar alla sju alternativ:

- 0 / 2 / 4 / 6 visas med sin fulla beskrivning
- 1 / 3 / 5 visas som "Mellanläge" (mindre, kursiv, sekundärfärg)

Detta kräver en liten utökning av `FormDef`: alternativen kan variera per fråga, så fältet `options` blir `options: Option[] | ((q: number) => Option[])` (eller så bygger vi MADR/KEDS-alternativen inline). Enklast: lägg till fältet `questionsWithOptions?: { text: string; help?: string; options: Option[] }[]` som har företräde över `questions` + `options` om det finns. `FormRunner` får ett tunt tillägg som plockar rätt set per steg samt renderar valfri "help"-text under frågetiteln (MADR/KEDS har en förklarande paragraf per fråga).

### BBQ-12 — par av nöjdhet × viktighet
Behåller samma 1-fråga-i-taget-flöde, en fråga per skärm, totalt 12. Skalan är gemensam ("Instämmer inte alls" 0 → "Instämmer fullständigt" 4). Total = summan, max 48. (Kan visas som 0–48 i kortet.)

### Etiketter (`scoreLabel`)
- **MADR-S**: 0–12 ingen/mycket lindrig · 13–19 lindrig · 20–34 måttlig · 35–54 svår
- **KEDS**: 0–18 låg risk · 19+ tecken på utmattning (klinisk gräns 19)
- **BBQ-12**: visa råpoäng + procent av max (t.ex. "32 / 48")

## Tekniska ändringar

### `src/lib/forms.ts`
- Utöka `FormType` till `"phq9" | "gad7" | "who5" | "madrs" | "keds" | "bbq12"`
- Utöka `FormDef` med valfritt `questionsWithOptions` och valfritt `help` per fråga
- Lägg till `MADRS`, `KEDS`, `BBQ12` enligt frågetexterna i requesten
- Lägg till dem i `FORMS`-mappen

### `src/pages/Vard.tsx`
- Lägg till de tre nya typerna i listan på rad 120 (`["phq9","gad7","who5","madrs","keds","bbq12"]`)
- Mappa toner: madrs → `blue-calm`, keds → `orange-start`, bbq12 → `green-recovery` (eller liknande som matchar designsystemet)
- `FormRunner`: rendera `def.questionsWithOptions[step].help` under titeln om den finns; använd `questionsWithOptions[step].options` om det finns, annars fall tillbaka på `def.options`
- Kortets "Senast"-rad: använder redan `f.toFinal ? "/100" : "/" + f.maxRaw` — fungerar direkt för MADR/KEDS/BBQ utan `toFinal`

### `src/lib/valence.ts`
Lägg till valens för de nya typerna så ev. trendvisning blir korrekt:
- `madrs: "lower-better"`
- `keds: "lower-better"`
- `bbq12: "higher-better"`

### Rapport / PDF
`weekly_forms` läses redan generiskt i Vard.tsx ReportView och WeeklyReport. Lägg till en rad för MADR-S, KEDS och BBQ-12 i `formStat`-utskriften (rad ~675 i Vard.tsx) så att de kommer med i text-/PDF-exporten. Vikterna i `burdenScore` (metrics.ts) lämnas oförändrade — MADR/KEDS/BBQ påverkar inte burden-formeln, de visas som egna kompletterande mått.

### Inga schemaändringar
`weekly_forms.type` är `text` utan check-constraint, `total_score` är `numeric`, `answers_json` är `jsonb`. Allt rymmer de nya formulären utan migration.

## Avgränsningar

- KEDS' 10:e "Anteckningar"-fråga utelämnas (fritextfält, ingår inte i totalpoäng). Kan läggas till senare som valfritt note-fält efter formuläret om önskat.
- Ingen ny startpunkt på Idag-sidan eller i påminnelser — dessa tre läggs in som veckoskattningar i /vård precis som de befintliga. Påminnelse-toggeln "Veckoformulär" täcker även dem.
- Inga nya designkomponenter — vi återanvänder kortmallen och `FormRunner` exakt som den ser ut idag.
