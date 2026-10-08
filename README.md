# Riktning: Your Direction

Ja. Min förra beskrivning hade sannolikt gett rätt app funktionellt, men inte nödvändigtvis en app som visuellt matchar bilderna. Den var för lös i formspråket. Lovable hade kunnat landa i generisk “wellness dashboard”.

Här är en skarpare prompt. Kopiera hela till Lovable.

Build a mobile-first PWA called “Riktning”.



Stack:

- React + TypeScript

- Tailwind CSS

- Supabase auth + database

- Recharts or lightweight SVG charts

- PDF/text export for clinical report

- Swedish UI



Purpose:

A personal recovery app for mental health, function, sleep, movement, journaling, medication tracking and clinical export. It is not diagnostic. It helps the user see weekly direction and produce a useful report for doctor/psychologist.



Core product idea:

Headspace-style guided actions + Strava-style recovery history + clinical export.



Do not build a generic dashboard. Build a warm, card-based, illustrated mobile app.



VISUAL DESIGN SYSTEM



Overall visual reference:

Inspired by Headspace: warm, colorful, rounded, simple, playful but adult. Large cards, abstract illustrations, strong colors, soft cream background, bold friendly typography, bottom navigation. Not clinical in normal mode. Clinical only inside Care/Report.



Fonts:

Use Google Font “Nunito Sans” as primary.

Fallback: Inter, system-ui, sans-serif.



Typography:

- H1: 32px, line-height 38px, weight 800, color #2E2E32

- H2: 24px, line-height 30px, weight 800

- H3/card title: 20px, line-height 26px, weight 800

- Body: 16px, line-height 24px, weight 500

- Meta text: 14px, line-height 20px, weight 600, color #6F6A65

- Button text: 17px, weight 800

- Avoid thin fonts.



Colors:

Base:

- app_bg: #FAF7F2

- surface: #FFFDF9

- surface_alt: #F3EEEA

- text_primary: #2E2E32

- text_secondary: #6F6A65

- border_soft: #E8E1D9

- shadow: rgba(46,46,50,0.10)



Category colors:

- orange_start: #FF7A1A

- orange_deep: #D66A24

- yellow_journal: #FFC928

- blue_calm: #1677F2

- blue_deep: #2157D6

- purple_sleep: #3B1B73

- green_recovery: #058C4C

- pink_move: #C6539A

- cream_card: #F7F0EC

- red_risk: #D64545

- red_bg: #FDECEC



Color rules:

- Orange = start/energy/recommendation

- Blue = calm/breathing

- Purple = sleep/night

- Green = function/recovery

- Yellow = journal/insights

- Pink = movement/yoga

- Red only for serious safety signals

- Never make the whole UI red.

- Use saturated colors on cards, but lots of cream/white space around them.



Spacing:

- Screen horizontal padding: 24px

- Vertical section gap: 28px

- Card gap: 16px

- Grid gap: 16px

- Inside large card padding: 22px

- Inside small card padding: 18px

- Bottom nav height: 76px + safe area

- Main content bottom padding: 110px



Radii:

- Large content cards: 28px

- Medium cards: 24px

- Small pills/chips: 999px

- Search field: 18px

- Buttons: 999px or 22px depending size

- Bottom sheets/modals: 32px top radius



Shadows:

Use soft shadows only:

box-shadow: 0 8px 24px rgba(46,46,50,0.08)

Cards should mostly feel flat and soft, not floating SaaS panels.



Icons:

Use simple rounded line icons. Stroke width 2.2px. No sharp enterprise icons.



Illustration style:

Create simple inline SVG illustrations/placeholders.

Style:

- abstract geometric blobs

- circles, semicircles, waves, dots, stars

- simple calm faces with closed eyes

- no realistic medical imagery

- no stock photo wellness people

- no photorealism

- friendly, flat, colorful

- illustrations should sit on right side of cards or as large header blobs



Example motifs:

- Start: orange sun/blob opening eyes

- Calm: blue breathing circle with waves

- Sleep: purple moon/blob

- Move: pink/green walking blob

- Journal: yellow card with pencil/blob

- Care: neutral blue paper/report icon

- Risk: simple red bordered safety card, no panic imagery



Layout patterns:

1. Search bar:

- height 64px

- full width

- rounded 18px

- bg #FFFDF9

- border 2px #E8E1D9

- icon left

- placeholder “Sök övning, känsla eller situation”



2. Category grid:

- 2 columns

- each card height 112px

- radius 24px

- saturated background

- large white title centered/left aligned

- subtle abstract pattern inside



3. Horizontal/vertical content cards:

- height 112–148px

- bg cream or saturated category color

- title left

- type + duration below

- illustration right

- large tap target



4. Today recommendation card:

- large card 180–220px

- orange/cream visual header

- one primary action button

- max 3 secondary chips



5. Timeline/history:

- left vertical dotted line #D7D0C9

- date heading

- activity rows with thumbnail 72x56 radius 12

- title, type, duration, chevron



6. Bottom navigation:

Tabs:

- Idag

- Övningar

- Vecka

- Journal

- Vård

Use rounded icons. Active tab #2E2E32, inactive #A7A19A. No heavy borders.



UX tone:

Swedish, calm, concrete, non-cheerleader.

Use:

- “Idag kräver vi inte mycket.”

- “Välj en liten start.”

- “Spara dagen som den var.”

- “Funktion rör sig åt rätt håll.”

- “Det här var en tung dag, inte ett misslyckande.”

Avoid:

- “Krossa dagen”

- “Bli ditt bästa jag”

- “Streak bruten”

- “Du misslyckades”

- excessive emojis



INFORMATION ARCHITECTURE



Bottom nav:

1. Idag

2. Övningar

3. Vecka

4. Journal

5. Vård



1. IDAG SCREEN



Purpose:

Quick check-in, current state, one recommended action, recent activity.



Layout:

- Header: “Idag”

- Subheader: current date

- Large state card:

  Title based on state, e.g. “Tungt men stabilt”

  Show 4 status pills:

  - Belastning: Låg/Måttlig/Hög/Röd

  - Funktion: Låg/Måttlig/Hög

  - Återhämtning: Låg/Måttlig/Hög

  - Risk: Ingen signal/Följ upp/Akut



- Primary CTA:

  “Logga dagen” if no check-in today

  “Uppdatera dagen” if already logged



- Recommended action card:

  Shows one best action based on today’s data.

  Example:

  “8 min morgonstart”

  “För låg energi och hög sängdragning”

  Button: “Starta”



- Secondary action chips max 3:

  “Andning 4 min”

  “Skriv tre rader”

  “Dagsljus 15 min”



- Recent activity mini timeline:

  Last 3 completed items.



Daily check-in fields:

- mood_heaviness: 0–10

- anxiety: 0–10

- guilt_selfcriticism: 0–10

- hopelessness: 0–10

- energy: 0–10

- getting_started: 0–10

- function_score: 0–10

- daytime_bed_sofa_time_minutes

- sleep_hours

- sleep_quality: 0–10

- medication_taken: yes/no/partial

- movement_today: none/little/yes

- meaningful_activity: none/little/yes

- safety_status: none/passive_thoughts/active_thoughts/acute

- note optional



Check-in UX:

- Use large sliders or segmented buttons.

- Must take under 60 seconds.

- Each 0–10 slider has short labels, not long explanations.

- Final optional note field.

- Save creates/updates today’s daily_checkin.



Safety rule:

If safety_status = active_thoughts or acute:

Show safety screen:

“Det här ska inte hanteras som vanlig statistik. Kontakta vården, psykiatrisk akutmottagning, 1177 eller 112 vid akut fara. Kontakta också någon du litar på.”

Buttons:

- “Visa stödtext”

- “Spara ändå”

- “Gå till Vård”

Do not show cheerful recommendations on this state.



2. ÖVNINGAR SCREEN



Purpose:

Need-based library of micro-actions.



Top:

- Search field

- 2-column category grid



Categories:

- Kom igång

- Lugna kroppen

- Bryt ältande

- Sov bättre

- Rör dig mjukt

- Skriv av dig

- Förbered vårdkontakt



Exercise card model:

- title

- category

- type: breathing/journal/movement/sleep/focus/education

- duration_minutes

- description

- steps[]

- recommended_for[]

- not_recommended_for[]

- color

- icon/illustration



Seed exercises:

Kom igång:

- “3 min upp ur sängen”

- “8 min morgonstart”

- “Vatten, kläder, dörren”

- “En sak räcker”



Lugna kroppen:

- “4 min längre utandning”

- “Kroppsskanning 6 min”

- “Långsam promenad”

- “Progressiv avslappning”



Bryt ältande:

- “Tankeloop: fakta/tolkning”

- “10 min orostid”

- “Parkera tanken”

- “Vad skulle jag säga till en vän?”



Sov bättre:

- “Kvällslandning”

- “Imorgon-lista”

- “Skärm-light”

- “Sömn efter dålig dag”



Rör dig mjukt:

- “15 min dagsljuspromenad”

- “Rörlighet 7 min”

- “Mjuk yoga 10 min”

- “Lågintensiv reset”



Skriv av dig:

- “Tre rader”

- “Kropp först”

- “Bevislogg”

- “Skuld till handling”



Förbered vårdkontakt:

- “Inför läkarsamtalet”

- “Biverkningar senaste veckan”

- “Vad har ändrats?”

- “Frågor jag vill ställa”



Exercise detail screen:

- Large illustration header

- Title

- Type + duration

- Description

- Steps as simple cards

- Button “Starta”

- Optional before rating:

  anxiety_before

  energy_before

  mood_before

- Completion screen:

  anxiety_after

  energy_after

  mood_after

  note optional

- Save to exercise_sessions.



Recommendation rules:

- High anxiety + high energy/restlessness → breathing, body scan, slow walk.

- Low energy + high bed/sofa time → start sequence, water, clothes, daylight, short walk.

- High guilt/self-criticism → facts vs interpretation, self-compassion journal.

- Low sleep → reduce ambition, daylight, short movement, evening routine.

- Better function but poor mood → show progress reassurance, not more tasks.



3. VECKA SCREEN



Purpose:

Show weekly progress, not daily noise.



Layout:

- Header: “Vecka”

- Card: “Jämfört med förra veckan”

- Four large metric cards:

  - Belastning

  - Funktion

  - Återhämtning

  - Stabilitet



Each card shows:

- current score 0–100

- arrow up/down

- percent change

- short interpretation

Example:

“Funktion +12 %”

“Belastning -8 %”

“Sömn är fortfarande svagaste faktorn.”



Charts:

- Use simple rounded bar charts or smooth line charts.

- No dense analytics dashboard.

- Show current 7 days vs previous 7 days.

- Show baseline after first 14 days.

- If insufficient data: “För lite data ännu. Första 14 dagarna bygger din baslinje.”



Metrics:

Normalize 0–10 to 0–100.



PHQ9_norm = PHQ9 / 27 * 100

GAD7_norm = GAD7 / 21 * 100

WHO5_norm = WHO5 / 100 * 100



sleep_deficit_norm:

- 0 if sleep_hours >= 7

- 100 if sleep_hours <= 3

- linear between 3 and 7



daytime_bed_sofa_norm:

- 0 if 0 min

- 100 if >= 240 min

- linear between



inverse_daytime_bed_sofa_norm = 100 - daytime_bed_sofa_norm

calm_inverse_anxiety_norm = 100 - anxiety_norm



movement_norm:

none = 0

little = 50

yes = 100



meaningful_activity_norm:

none = 0

little = 50

yes = 100



Belastning =

0.20 * PHQ9_norm +

0.15 * GAD7_norm +

0.15 * hopelessness_norm +

0.15 * anxiety_norm +

0.15 * guilt_selfcriticism_norm +

0.10 * sleep_deficit_norm +

0.10 * daytime_bed_sofa_norm



If no PHQ9/GAD7 this week, calculate Belastning from daily values only and label “utan veckoskattning”.



Funktion =

0.25 * getting_started_norm +

0.25 * function_norm +

0.20 * energy_norm +

0.15 * meaningful_activity_norm +

0.15 * inverse_daytime_bed_sofa_norm



Återhämtning =

0.30 * sleep_quality_norm +

0.20 * energy_norm +

0.20 * calm_inverse_anxiety_norm +

0.15 * movement_norm +

0.15 * meaningful_activity_norm



Stabilitet =

100 - standard_deviation(last_7_days of burden/function/recovery core daily scores)

Display as “mer stabil / mindre stabil”, not as moral score.



Weekly insights:

Generate simple deterministic insights:

- “Dagar med rörelse följs ofta av lägre oro” if average next-day anxiety after movement is lower by >=1 point.

- “Sömn under 5 h följs ofta av högre oro” if true in data.

- “Säng/sofftid över 120 min sammanfaller med lägre funktion” if true.

- “Funktion rör sig uppåt även om måendet släpar” if function improves but burden remains high.



4. JOURNAL SCREEN



Purpose:

Free text and guided templates.



Top:

- Button “Skriv ny”

- Template cards

- History timeline



Templates:



A. Tre rader

Fields:

- Det tyngsta idag var:

- Något som hjälpte lite var:

- Imorgon behöver jag:



B. Tankeloop

Fields:

- Tanken som fastnat:

- Fakta som stödjer den:

- Fakta som talar emot:

- En rimligare formulering:



C. Kropp först

Fields:

- Var sitter känslan?

- Vad signalerar kroppen?

- Vad kan minska trycket 5 %?



D. Bevislogg

Fields:

- Vad gjorde jag trots motstånd?

- Vad säger det som depressionen inte säger?

- Vad vill jag minnas?



E. Fri text



Journal entries:

- can be linked to today’s check-in

- show date

- show template type

- exportable in Care report only if user selects include_journal = true



5. VÅRD SCREEN



Purpose:

Clinical mode. Clean, neutral, less playful.



Layout:

- Use white/surface cards, minimal illustration.

- Blue/gray accents.

- More table-like.

- Header: “Vård”

- Cards:

  - Veckoskattningar

  - Läkemedel

  - Biverkningar

  - Exportera rapport



Weekly forms:

PHQ-9:

- 9 questions

- answers 0–3

- total 0–27

- store answers_json and total_score



GAD-7:

- 7 questions

- answers 0–3

- total 0–21



WHO-5:

- 5 questions

- answers 0–5

- raw total 0–25

- transformed score = raw * 4

- store total_score as 0–100



Medication model:

- name

- dose

- date_started

- date_stopped

- active



Medication daily log:

- medication_id

- date

- taken_status: taken/missed/partial

- side_effects:

  - nausea

  - sweating

  - headache

  - sleep_problem

  - anxiety_increase

  - restlessness

  - appetite_change

  - libido_change

  - other_text

- note



Report export:

Periods:

- 14 days

- 30 days

- 90 days

- custom



Report format:

- PDF

- plain text copy



Report content:

- Date range

- PHQ-9 start/end/average/high/low

- GAD-7 start/end/average/high/low

- WHO-5 start/end/average

- Burden/function/recovery trend

- Sleep average and trend

- Movement frequency

- Journal frequency

- Medication adherence

- Medication changes

- Side effects

- Safety signals:

  - passive thoughts count

  - active thoughts count

  - acute signals count

- Patient notes

- Optional selected journal excerpts

- Neutral generated summary



Clinical summary style:

Neutral, factual, Swedish.

Example:

“Under perioden syns minskad belastning och förbättrad funktion. Sömnkvaliteten är fortsatt låg. Patienten rapporterar ökad aktivering efter läkemedelsstart. Passiva dödstankar förekommer X dagar. Aktiva planer rapporteras ej.”



DATABASE



Use Supabase with RLS enabled.



Tables:



users

- id uuid primary key

- email text

- created_at timestamp



daily_checkins

- id uuid primary key

- user_id uuid references users.id

- date date

- mood_heaviness int

- anxiety int

- guilt_selfcriticism int

- hopelessness int

- energy int

- getting_started int

- function_score int

- daytime_bed_sofa_time_minutes int

- sleep_hours numeric

- sleep_quality int

- medication_taken text

- movement_today text

- meaningful_activity text

- safety_status text

- note text

- created_at timestamp



exercises

- id uuid primary key

- title text

- category text

- type text

- duration_minutes int

- description text

- steps_json jsonb

- recommended_for_json jsonb

- not_recommended_for_json jsonb

- color text

- created_at timestamp



exercise_sessions

- id uuid primary key

- user_id uuid references users.id

- exercise_id uuid references exercises.id

- date date

- anxiety_before int

- anxiety_after int

- energy_before int

- energy_after int

- mood_before int

- mood_after int

- note text

- created_at timestamp



journal_entries

- id uuid primary key

- user_id uuid references users.id

- date date

- template_type text

- title text

- body_json jsonb

- free_text text

- linked_checkin_id uuid references daily_checkins.id

- include_in_report boolean default false

- created_at timestamp



weekly_forms

- id uuid primary key

- user_id uuid references users.id

- date date

- type text

- answers_json jsonb

- total_score numeric

- created_at timestamp



medications

- id uuid primary key

- user_id uuid references users.id

- name text

- dose text

- date_started date

- date_stopped date

- active boolean

- created_at timestamp



medication_logs

- id uuid primary key

- user_id uuid references users.id

- medication_id uuid references medications.id

- date date

- taken_status text

- side_effects_json jsonb

- note text

- created_at timestamp



computed_weekly_metrics

- id uuid primary key

- user_id uuid references users.id

- week_start date

- burden_score numeric

- function_score numeric

- recovery_score numeric

- stability_score numeric

- sleep_avg numeric

- movement_days int

- journal_days int

- medication_adherence numeric

- created_at timestamp



Security:

- Supabase auth required.

- RLS: users can only read/write their own data.

- Health data is sensitive.

- No public sharing.

- No social feed.

- Add “Export all data” and “Delete all data” in settings.



ONBOARDING



Screens:

1. “Det här är Riktning”

- short purpose

- not diagnostic

- tracks direction, function, recovery



2. “Första 14 dagarna bygger baslinje”

- no progress judgment during baseline

- app learns normal range



3. Add medication optional

- medication name/dose/start date



4. Choose reminder optional

- morning check-in

- evening journal

- weekly forms



MVP REQUIREMENTS



Must implement:

- Auth

- Today screen

- Daily check-in

- Safety handling

- Exercise library with seeded exercises

- Exercise detail + completion + before/after ratings

- Week trends and formulas

- Journal templates + free text

- PHQ-9, GAD-7, WHO-5

- Medication + side effects

- Care report export

- Supabase schema + RLS

- Mobile responsive design matching the design system



Do not implement:

- Social feed

- Public sharing

- Competitive leaderboards

- Shame streaks

- AI diagnosis

- Medical claims

- Dark enterprise dashboard



QUALITY BAR



The app should visually feel closer to Headspace than to a health analytics app:

- large colorful cards

- rounded shapes

- playful abstract illustrations

- minimal text per screen

- one clear next action

- soft but structured progress



The Week and Care screens may contain data, but Today and Exercises must feel guided, warm and simple.



Main success condition:

A user can open the app on a bad day, log the day in under 60 seconds, get one useful low-friction recommendation, and later export a clear clinical report.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://riktning-in-life.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ffc3c348-df77-4f0f-8d12-32cfddbfe609).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
