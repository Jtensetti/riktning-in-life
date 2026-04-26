
# Mer innehåll, smartare matchning, samma mjuka känsla

Mål: appen ska kännas **rik på innehåll**, **forskningsstödd utan att bli torr**, och **lyhörd** — visar rätt sak vid rätt tillfälle. Tonen är fortsatt varm, peppande och kravlös. "Du behöver inte fixa allt — välj en sak."

---

## 1. "För dig just nu"-karusell på Today (kärnan i upplevelsen)

Ny sektion direkt under State-kortet, **före** "Rekommenderat just nu" (som vi krymper till en sekundär chip-rad — karusellen tar över huvudrollen).

**Logik (`src/lib/recommend.ts` – NY):** ren funktion som tar `(checkin, weeklyForms, recentSessions, time, weather, library)` och returnerar **3 slots** med olika syften så förslagen aldrig blir varianter av samma sak:

```ts
type Slot = "calm" | "lift" | "land"; // alltid i denna ordning
type Pick = {
  slot: Slot;
  exercise: Exercise;
  reasonShort: string;     // "Sänker pulsen" — chip-text
  reasonLong: string;      // 1 mening på kortet
  fitScore: number;        // för debug + "stark match"-badge >= 80
};
```

**Scoring per övning (0–100):**
- +30 om kategorin matchar dominerande symptom (oro≥6 → Lugna, mood≥7 → Skriv av/Bryt ältande, sömn<5 → Sov bättre, energi≤3 → Kom igång minimalt)
- +20 om `time.partOfDay` passar (Sov bättre kvällar/natt, Kom igång morgon, Rör mjukt dag)
- +15 om vädret passar (utomhus bara när `isOutdoorFriendly`)
- +10 om duration ≤ tillgängligt energi-utrymme (energi≤3 → max 5 min, ≤6 → max 10 min)
- −25 om kategorin redan körts ≥2 ggr senaste 3 dagarna (`recentSessions`) → variation
- −15 om finns i `not_recommended_for_json` för aktuella signaler

**Slot-mappning:**
- **calm** = lugna kroppen / bryta loop (alltid med när oro≥5 eller dygnsdel=kväll/natt)
- **lift** = mjukt höjande (rörelse, dagsljus, 8-min morgonstart) — ALDRIG om kvällslogik aktiv
- **land** = "minsta möjliga" — alltid en ≤3 min övning så det aldrig känns övermäktigt

**UI:** horisontell snap-scroll-karusell (vi har redan `embla-carousel` via shadcn `carousel.tsx`), 3 kort på 86% viewport-bredd, mjuk skugga, slot-färg, **"Stark match"-badge** när fitScore≥80. Rubrik: *"För dig just nu"* + liten undertext *"Tre vägar in i dagen"*. Animation: `animate-pop-in` med stagger 0/80/160 ms.

---

## 2. Forskningsstött innehåll — två lager

### Lager A: "Varför funkar det?" på varje övning (`ExerciseDetail.tsx`)
Mjuk cream-card mellan steg-listan och knappen, **expanderbar** (collapsed default — inga väggar av text):
- 1–2 meningar mekanism, varm ton ("Längre utandning aktiverar vagusnerven — pulsen sänks och hjärnan får signalen 'vi är trygga'.")
- Diskret rad: *Stöd: NICE NG222 · Brown & Gerbarg 2005* med liten `info`-AbstractIcon

Källorna lagras strukturerat i en ny kolumn på `exercises` (se §6) så vi kan rendera dem konsekvent.

### Lager B: "Lär dig"-flik (NY route `/lar-dig`)
Ny rubrik i `BottomNav.tsx` ersätter inget — vi lägger den som **kort-grid på Today** och som **länk i Settings** istället. (BottomNav är full med 5 ikoner, vi rör inte den.)

- Ny sida `src/pages/Learn.tsx` + `src/pages/LearnArticle.tsx`
- 8 korta artiklar (~250–400 ord var, läsbara på 2 min), kategoriserade och färgkodade som övningarna:
  1. **Sömn är hjärnans städning** (purple) — varför 7+ h spelar roll, ljus på morgonen, koffein-fönster
  2. **Beteendeaktivering — vägen ut ur tunga dagar** (orange) — varför handling före motivation funkar
  3. **Oro i kroppen, inte i huvudet** (blue) — andning, vagusnerven, kall handduk
  4. **Rörelse som antidepressivum** (pink) — Cooney 2013, dosrespons, "räcker att gå ut"
  5. **Att bryta ältande utan att slåss** (yellow) — defusion, orostid
  6. **Mat, blodsocker och humör** (green) — regelbundna måltider, protein på morgonen
  7. **Människor är medicin** (cream) — sociala mikrosteg, ensamhetens fysiologi
  8. **När det är tungt på riktigt** (red-bg variant) — varningstecken, vad göra, vart ringa

Format per artikel: hero-illustration, "2 min läsning"-chip, brödtext med h2/p/blockquote, **"Pröva nu"-knappar** som länkar till matchande övningar, källista längst ner.

Innehållet skrivs av mig, baserat på etablerade riktlinjer (NICE, SBU, Cochrane, Folkhälsomyndigheten) — citerade men aldrig parafraserat utan att jag är säker. Inga påhittade siffror.

**Ingång:** ny sektion på Today *"Lär dig något nytt"* med 1 featured + "Se alla" → `/lar-dig`. Också länk från `Settings`.

---

## 3. Två nya övningskategorier

Lägger till i `categories`-listan i `Exercises.tsx` + `categoryIll` mapping + `colorBg`:

### Mat & humör (color: `green` återanvänds, eller ny `bg-cream-card` variant)
- *3 mål, 1 mellanmål* (5 min) — planera dagen
- *Protein på morgonen* (3 min) — varför + 3 enkla idéer
- *Koffein-fönstret* (3 min) — sista kaffe innan kl 14
- *Vatten + en frukt* (2 min) — minsta möjliga

### Sociala mikrosteg (color: nytt mjukt **rosa-cream**, vi använder `pink-move` i ljusare ton)
- *Skicka ett ❤️ till någon* (1 min)
- *Ett "hej" till kassören* (2 min)
- *Föreslå fika på 30 min* (3 min)
- *Skriv klart meddelandet du börjat på* (5 min)

---

## 4. Morgon- och kvällsrutin-paket (NY: "Sekvenser")

Ny tabell `exercise_sequences` (se §6) — paket av 3–4 övningar i ordning. Visas som:
- **Today**, längst ner: kort *"Dagens rutin"* som auto-väljer paket utifrån tid (morgon-paket före kl 11, kväll-paket efter kl 19)
- Ny sida `/sekvenser` listar alla paket
- I `ExerciseDetail` när man kommer från en sekvens: "Steg 2 av 3" + "Nästa: …"-knapp efter `Klar`

**Initiala paket (4 st):**
1. **Mjuk morgon** (orange) — En sak räcker → 4 min utandning → 8 min morgonstart
2. **Bryt eftermiddagsdimman** (pink) — Vatten + frukt → Långsam promenad → Tre rader
3. **Kvällslandning** (purple) — Kropp först → Imorgon-lista → Skärm-light
4. **Tung dag, mjuk kväll** (purple) — Sömn efter dålig dag → 4 min utandning → Skicka ett ❤️

---

## 5. Min krisplan (NY)

Ny sida `/krisplan`, länkad från:
- `Vard.tsx` — primär plats, översta kortet
- Today's safety-kort när safety_status = active/acute → "Öppna min krisplan"-knapp

**Vad det är:** en mall man fyller i **en gång** (12–18 fält), sparas som JSON i ny tabell `crisis_plans` (en rad per user). Sedan en **läs-vy** med stora färgkodade sektioner så den fungerar i akut läge:
- Tidiga varningstecken (3 fritextfält)
- Det här hjälper mig (3 fält)
- Det här ska jag undvika (3 fält)
- Personer jag kan ringa (3 namn + nummer)
- Professionella kontakter (vårdcentral, jourtelefon, mottagning)
- Trygga platser (3 platser)
- Skäl att hålla ut (3 fält — varma)

Akut-knapp högst upp i läs-vyn: stora `tel:`-länkar till **112**, **1177**, **Mind Självmordslinjen 90101**, **Jourhavande medmänniska 08-702 16 80**.

Mall-förslagen (placeholder-text i fälten) skrivs av mig så det aldrig är tomt och skrämmande att börja.

---

## 6. Databas — migrationer

Vi behöver schemaändringar (ej dataändringar) → en ny migration:

```sql
-- A) Forskningsstöd på övningar
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS mechanism text,        -- "Längre utandning aktiverar..."
  ADD COLUMN IF NOT EXISTS evidence_json jsonb DEFAULT '[]'::jsonb;
  -- evidence_json: [{ source: "NICE NG222", year: 2022, url: "..." }]

-- B) Sekvenser
CREATE TABLE public.exercise_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,                       -- "mjuk-morgon"
  title text NOT NULL,
  description text NOT NULL,
  color text NOT NULL DEFAULT 'orange',
  time_of_day text,                                -- "morning" | "evening" | null
  exercise_ids_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exercise_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read sequences" ON public.exercise_sequences
  FOR SELECT TO authenticated USING (true);

-- C) Lär dig-artiklar (statiskt innehåll, men i DB så vi kan utöka utan deploy)
CREATE TABLE public.learn_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  color text NOT NULL,
  read_minutes integer NOT NULL DEFAULT 2,
  excerpt text NOT NULL,
  body_md text NOT NULL,
  related_exercise_ids_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.learn_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read articles" ON public.learn_articles
  FOR SELECT TO authenticated USING (true);

-- D) Krisplan (en per user)
CREATE TABLE public.crisis_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  warning_signs_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  helps_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  avoid_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  contacts_json jsonb NOT NULL DEFAULT '[]'::jsonb,         -- {name, phone, role}
  professional_contacts_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  safe_places_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  reasons_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crisis_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own crisis plan" ON public.crisis_plans
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own crisis plan" ON public.crisis_plans
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own crisis plan" ON public.crisis_plans
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER set_crisis_plans_updated_at BEFORE UPDATE ON public.crisis_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

**Sedan dataseed (via insert-tool, inte migration):**
- Uppdatera alla 28 befintliga övningar med `mechanism` + `evidence_json` + tydligare `description` och `steps_json`
- Insert: ~10 nya övningar (Mat & humör, Sociala mikrosteg)
- Insert: 4 sekvenser
- Insert: 8 lär-dig-artiklar (full body_md)

---

## 7. UI — nya & ändrade komponenter

**NYA:**
- `src/lib/recommend.ts` — slot-scoring
- `src/components/ForYouCarousel.tsx` — Today-karusellen
- `src/components/MechanismCard.tsx` — expanderbar "Varför funkar det?"
- `src/components/SequenceCard.tsx` — paketkort
- `src/pages/Learn.tsx` — listvy artiklar
- `src/pages/LearnArticle.tsx` — läs-vy (markdown via `react-markdown` + `remark-gfm`, redan vanligt)
- `src/pages/Sequences.tsx` — alla paket
- `src/pages/CrisisPlan.tsx` — edit + read-mode (toggle överst)
- `src/components/ContactRow.tsx` — `tel:`-länk-rad i krisplan

**ÄNDRAS:**
- `src/pages/Today.tsx` — ny karusell, ny "Lär dig"-rad, ny "Dagens rutin"-rad
- `src/pages/Exercises.tsx` — 2 nya kategorier i `categories`, `fitsNow` utökas, sekvenser-länk längst ner
- `src/pages/ExerciseDetail.tsx` — `MechanismCard`, sekvens-progress ("Steg 2 av 3"), nästa-knapp
- `src/pages/Vard.tsx` — krisplan-kort högst upp
- `src/pages/Settings.tsx` — länk till "Lär dig" + "Min krisplan"
- `src/components/Illustrations.tsx` + `categoryIll` — mappar för Mat & humör + Sociala mikrosteg
- `src/components/AbstractIcon.tsx` — 3 nya ikoner: `food-bowl` (grön cream-skål), `chat-bubble` (mjuk blob med två prickar), `book-open` (för Lär dig)
- `src/integrations/supabase/types.ts` — auto-genereras

**Animation/känsla:** Inget nytt formspråk — vi återanvänder `pop-in`, `fade-in-up`, `press-soft`, stagger-tokens. Karusellkort: `animate-pop-in` + subtil hover/active-scale. Krisplan-edit: stora luftiga input-fält, varma placeholders.

---

## 8. Tonalitet — checklista jag följer

Allt nytt innehåll skrivs enligt:
- **Du-form, varm, kravlös.** Aldrig "du borde", alltid "det räcker att…"
- **Konkret, inte abstrakt.** "Drick ett glas vatten" hellre än "ta hand om dig"
- **Mekanism före moral.** Förklara *varför* så det blir lättare att vilja
- **Alternativ alltid.** "Om 8 min är för mycket — pröva 2 min"
- **Aldrig skrämmande siffror.** Inga "X% av deprimerade…"

---

## 9. Gör INTE
- Ingen ny BottomNav-tab (den är full — Lär dig nås via Today + Settings)
- Ingen extern AI-generering av artiklarna (statiska, granskade)
- Ingen push, ingen kalender, ingen kontakt-API till telefonens kontakter
- Rör inte Checkin-logiken, väder-logiken eller metrics

---

## 10. Genomförandeordning (en runda, men i denna ordning så preview alltid är användbar)

1. Migration (4 tabeller/kolumner) + types regenereras
2. Seeda övnings-`mechanism` + `evidence_json` + uppdaterade beskrivningar
3. `recommend.ts` + `ForYouCarousel` på Today
4. `MechanismCard` på ExerciseDetail
5. Seeda + bygg sekvenser (`Sequences.tsx`, "Dagens rutin"-kort på Today)
6. Seeda + bygg Lär dig (`Learn.tsx` + `LearnArticle.tsx` + Today-rad)
7. Seeda nya kategorier + nya övningar
8. Krisplan (tabell, sida, ingångar i Vård + Today safety)
9. Settings-länkar + slutpolering

Hela paketet ska kännas som **samma app, mer levande** — inte som ett nytt lager påklistrat.
