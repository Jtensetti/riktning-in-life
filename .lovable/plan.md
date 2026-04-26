
# Enklare app, rakare språk, rena källor

Målet: appen ska kännas som någon som håller i din hand — inte ett formulär. Och varje referens vi visar ska gå att lita på.

---

## 1. Rakare språk genom hela appen

Idag blandas tre röster: klinisk ("Tyngd / nedstämdhet", "Funktion", "Säkerhet"), terapeutisk ("Spara dagen som den var") och teknisk ("Bygger baslinje", "PHQ-9, GAD-7, WHO-5"). Vi enar tonen runt **rak svenska — du-form, korta meningar, ingen jargong i UI**.

**Specifika ord vi byter ut (UI-strängar, ej databasfält):**

| Idag | Föreslås |
|---|---|
| "Logga dagen" / "Spara dagen som den var" | "Hur var idag?" |
| "Tyngd / nedstämdhet" | "Hur tungt känns det?" |
| "Oro / ångest" | "Hur orolig är du?" |
| "Skuld / självkritik" | "Är du hård mot dig själv?" |
| "Funktion" | "Hur mycket orkar du?" |
| "Komma igång" | "Hur lätt går det att starta?" |
| "Säkerhet" + 4 knappar | "Är du trygg just nu?" + Ja / Tunga tankar / Behöver hjälp nu |
| "Bygger baslinje" | "Lär känna dig — dag X av 14" |
| "PHQ-9, GAD-7, WHO-5" (i Onboarding/Mer) | "Korta veckoformulär från vården" |
| "Veckoformulär" toggle | "Påminn mig en gång i veckan" |
| "Aktiviteter loggat" | "Saker du gjort idag" |
| "Mående loggat" toast | "Sparat" |
| "Det här räcker idag" (Today whisper) | Behåller — den fungerar |

Ändringarna görs som ren copy-update i:
`Checkin.tsx`, `Onboarding.tsx`, `QuickLog.tsx` (mallarnas blurb), `More.tsx`, `Vard.tsx` (knappar mot formulär), `Today.tsx` (state-rubriker).

Inga schemafält byter namn — vi rör bara texten användaren ser.

## 2. Mer guidning, mindre formulär — Check-in delas i steg

Idag är `/checkin` **9 reglage + 4 segment + textfält + säkerhetspanel** på en lång sida. Det ÄR ett formulär. Vi gör om till en **3-stegs samtalston** med samma data men en fråga åt gången:

- **Steg 1 — "Hur är kroppen?"** sömn (timmar + kvalitet), rörelse, energi
- **Steg 2 — "Hur är huvudet?"** tyngd, oro, självkritik, hopplöshet
- **Steg 3 — "Hur går dagen?"** orka/komma igång, vad du gjort (ActivityPicker), trygghet, ev. anteckning

Stegen visar 2–3 reglage var, en stor rubrik på frågespråk, "Hoppa"-knapp om något inte är relevant, och en mjuk progressindikator. Spara sker först i sista steget — ingen risk för halva svar.

Snabbloggens 4-knappsläge på `/snabblogg` finns kvar oförändrat för dem som bara vill nudda en sak.

## 3. Onboarding blir kortare och varmare

Idag: 4 steg, varav steg 2 är en tung textbjölke om baslinje. Vi:
- Slår ihop intro (steg 0+1) → en sida: **"Det här är Riktning. En lugn plats för att se hur du har det över tid."**
- Gör steg 2 (medicin) helt valfritt, mindre formell — "Tar du någon medicin? Du kan lägga till senare."
- Gör steg 3 (påminnelser) till **en enda fråga**: "Vill du att jag pinglar dig en gång om dagen?" Ja/Nej/Senare.

3 steg istället för 4. Samma data sparas.

## 4. Källor: rensa svaga referenser, behåll de starka

Här gör jag konkret klinisk research. Av nuvarande källor:

**Behåller (peer-reviewed eller myndighet — håller kliniskt):**
- NICE NG222, NICE CG113, Socialstyrelsen, Folkhälsomyndigheten, AASM
- Cuijpers BA-meta (2007), Dimidjian BA (2006), Cooney Cochrane exercise (2013), Schuch (2018)
- Cochrane CBT-I, Irwin CBT-I (2017), Morin & Espie
- Zaccaro breathing review (2018), Brown & Gerbarg (2005), cyclic sighing Cell Reports (2022)
- Holt-Lunstad social meta (2010), Neff/Germer self-compassion, MacBeth & Gumley meta
- Stanley & Brown Safety Planning (2012)
- Borkovec worry-time (1983), Beck Cognitive Therapy (1979), Hayes ACT (2012)
- Kabat-Zinn MBSR, Hölzel mindfulness brain (2011)
- JAMA Psychiatry physical activity (Pearce et al. 2022), JAMA loneliness meta

**Tar bort (populärvetenskap / självhjälp / TED — inte klinisk källa):**
- Walker — *Why We Sleep* (boken, ej studierna bakom)
- *Atomic Habits* / James Clear, Fogg *Tiny Habits*
- *The Happiness Trap*, Russ Harris (intro-bok, inte studie)
- Emily Esfahani Smith TED-talk
- Wood & Neal habit research → ersätts med Lally et al. 2010 (faktisk peer-reviewed habit-studie) eller tas bort
- Wegner *ironic processes* → behåller (är peer-reviewed Psych Review)
- Beck Institute (organisation, inte källa) → tas bort, behåll Beck 1979

**Princip i koden:** Hellre **inga referenser** än en svag. `MechanismCard` ska inte rendera "Stöd i forskningen"-rubriken alls om listan är tom efter rensning. Samma för `LearnArticle` och `WeeklyReport` PDF.

Rensningen sker som **en migration** som uppdaterar `exercises.evidence_json` och `learn_articles.sources_json` enligt listan ovan. Inga rader tas bort — bara svaga referenser filtreras ut. Där en artikel/övning blir helt utan källa lägger jag till en ärlig text: "Bygger på klinisk erfarenhet och praxis — inte på en specifik studie."

## 5. Mer guidning på Today

Två små tillägg som tar bort gissning:
- **När check-in saknas:** byt rubrik från "Inget loggat idag" till en mjuk fråga + tydligare CTA: *"Hur har du det? — Ta 60 sekunder"*.
- **Efter spara:** liten tackrad i toast: *"Tack. Det här hjälper dig se mönster."* (en mening, ingen pop-up).

## Filer som ändras

**Copy + flow:**
- `src/pages/Checkin.tsx` — delas i 3 steg, ny copy
- `src/pages/Onboarding.tsx` — 4 → 3 steg, ny copy
- `src/pages/QuickLog.tsx` — varmare blurb i mallar
- `src/pages/Today.tsx` — mjukare state-rubriker, tackrad efter check-in
- `src/pages/More.tsx`, `src/pages/Vard.tsx` — formulärnamn på svenska i UI

**Källrensning:**
- `src/components/MechanismCard.tsx` — dölj rubrik om tom
- `src/pages/LearnArticle.tsx` — dölj källblock om tomt + "bygger på klinisk praxis"-fallback
- Ny migration: `update_evidence_sources_clean` (uppdaterar JSON-fält)

**Inget av detta rör databasen-schema, RLS, eller integrationer.**

## Vad jag *inte* gör i denna runda

- Rör inte navbar/sitemap igen — den landade i förra rundan.
- Ändrar inga datamodeller eller fältnamn — bara texten användaren läser.
- Lägger inte till nya frågor i check-in. Färre, men bättre presenterade.

Säg till om du vill kika på copy-listan i detalj eller om något av stegen ska delas annorlunda innan jag bygger.
