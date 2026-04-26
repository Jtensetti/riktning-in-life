-- ============================================================
-- Innehållspåfyllning: 15 nya övningar, 8 nya artiklar, 4 nya sekvenser
-- Alla med samma ton: varm, peppande, konkret. Befintliga kategorier/färger.
-- ============================================================

-- Säker insert: hoppa över rader vars titel/slug redan finns.

-- ===================== ÖVNINGAR (15) =====================

INSERT INTO public.exercises (title, category, color, type, duration_minutes, mechanism, description, recommended_for_json, not_recommended_for_json, evidence_json, steps_json)
SELECT * FROM (VALUES
  -- Lugna kroppen (3)
  (
    'Box-andning 4–4–4–4', 'Lugna kroppen', 'blue', 'breathing', 4,
    'Långsam, jämn andning aktiverar parasympatiska nervsystemet och lugnar pulsen.',
    'En enkel rytm du kan göra var som helst när stressen drar igång. Inga prylar, bara du och andetaget. Du klarar det här.',
    '["akut stress", "panikkänsla", "innan svåra samtal"]'::jsonb,
    '["uttalad andnöd just nu"]'::jsonb,
    '["Andningstekniker minskar akut stress (APA, 2020).", "Långsam andning sänker hjärtfrekvens och blodtryck (Frontiers in Human Neuroscience, 2018)."]'::jsonb,
    '["Sätt fötterna i golvet. Axlar ned.", "Andas in genom näsan i 4 sekunder.", "Håll andan mjukt i 4 sekunder.", "Andas ut genom munnen i 4 sekunder.", "Pausa i 4 sekunder. Upprepa 6–10 varv.", "Notera: hur känns kroppen nu?"]'::jsonb
  ),
  (
    '5-4-3-2-1 grounding', 'Lugna kroppen', 'blue', 'focus', 3,
    'Sinnesbaserad förankring drar uppmärksamheten ur orostankarna och tillbaka till nuet.',
    'När huvudet snurrar — landa i sinnena. En snäll övning som tar dig tillbaka till rummet du är i.',
    '["ångestvåg", "dissociation", "panikkänsla"]'::jsonb,
    '[]'::jsonb,
    '["Grounding-tekniker rekommenderas vid akut ångest (NICE Guidelines, 2022)."]'::jsonb,
    '["Hitta 5 saker du ser. Säg dem tyst för dig själv.", "Hitta 4 saker du kan röra. Känn ytan.", "Hitta 3 ljud du hör. Nära och långt borta.", "Hitta 2 dofter — eller två minnen av dofter.", "Hitta 1 sak du smakar. Drick gärna ett glas vatten."]'::jsonb
  ),
  (
    'Suck ut spänningen', 'Lugna kroppen', 'blue', 'breathing', 2,
    'Dubbel inandning + lång utandning (physiological sigh) sänker stressnivån snabbt.',
    'Två minuter som faktiskt funkar när bröstet känns trångt. Effektivast i klassen — och världens enklaste.',
    '["spänd bröstkorg", "tankerus", "innan sömn"]'::jsonb,
    '[]'::jsonb,
    '["Cyclic sighing minskade stress mer än meditation i RCT (Cell Reports Medicine, 2023, Huberman m.fl.)."]'::jsonb,
    '["Andas in genom näsan.", "Toppa på med en liten extra inandning.", "Släpp ut långt och mjukt genom munnen.", "Upprepa i 1–2 minuter.", "Märk: axlarna sjunker."]'::jsonb
  ),
  -- Sov bättre (3)
  (
    'Stig upp samma tid', 'Sov bättre', 'purple', 'sleep', 1,
    'Fast vakna­tid är den starkaste signalen för en stabil dygnsrytm — viktigare än sängtiden.',
    'Lägg ribban där det räcker: stig upp samma tid varje dag, även efter en knepig natt. Liten regel, stor effekt.',
    '["oregelbunden sömn", "trötthet på dagen", "jetlag-känsla"]'::jsonb,
    '["uttalad sömnbrist akut sjuk"]'::jsonb,
    '["Konsekvent vakna­tid är central i CBT-I (American Academy of Sleep Medicine, 2021)."]'::jsonb,
    '["Välj en vakna­tid som funkar både vardag och helg.", "Ställ alarmet. Lägg telefonen utom räckhåll.", "Stig upp inom 10 minuter — även när det suger.", "Öppna gardinerna direkt. Ljuset hjälper.", "Stå på dig en vecka. Det blir lättare."]'::jsonb
  ),
  (
    'Stig upp om du inte sover', 'Sov bättre', 'purple', 'sleep', 6,
    'Stimuluskontroll: sängen ska kopplas till sömn, inte till vakenhet och oro.',
    'Ligger du och vrider och vänder? Kliv upp en stund. Det låter bakvänt — men hjärnan lär sig att sängen = sömn.',
    '["insomningsbesvär", "ältande i sängen", "uppvaknanden på natten"]'::jsonb,
    '[]'::jsonb,
    '["Stimuluskontroll är kärnan i CBT-I, evidensbaserad förstahandsbehandling (Cochrane, 2015)."]'::jsonb,
    '["Märker du att 20 min gått utan sömn? Kliv upp.", "Gå till annat rum. Dämpat ljus.", "Gör något tråkigt: läsa lite, vika tvätt.", "Inga skärmar.", "Gå tillbaka när du känner sömnighet — inte trötthet.", "Upprepa vid behov. Det blir bättre."]'::jsonb
  ),
  (
    'Tankebrevet före sömn', 'Sov bättre', 'purple', 'journal', 5,
    'Att skriva ner orostankar och imorgondag-uppgifter minskar kognitiv aktivering vid läggdags.',
    'Töm hjärnan på papper innan du lägger huvudet på kudden. Allt får finnas — du tar hand om det imorgon.',
    '["ältande på kvällen", "imorgondag-stress", "svårt att slappna av"]'::jsonb,
    '[]'::jsonb,
    '["Skrivande av att-göra-listor minskade tid till insomning i RCT (Journal of Experimental Psychology, 2018, Scullin m.fl.)."]'::jsonb,
    '["Sätt timer på 5 minuter.", "Skriv allt som spinner i huvudet — utan filter.", "Skriv 3 saker du ska göra imorgon.", "Lägg lappen utom synhåll.", "Säg till dig själv: jag tar i det imorgon. Nu sover jag."]'::jsonb
  ),
  -- Bryt ältande (2)
  (
    'Tanke vs handling', 'Bryt ältande', 'yellow', 'journal', 5,
    'Defusion (ACT): en tanke är ett mentalt event, inte en order. Hjärnan slutar slåss och du återfår handlingsutrymme.',
    'En tanke är inte ett faktum, och absolut inte ett kommando. Lär dig se tanken — utan att lyda den.',
    '["självkritik", "katastroftankar", "ältande"]'::jsonb,
    '[]'::jsonb,
    '["Kognitiv defusion minskar effekten av påträngande tankar (ACT, Hayes m.fl.)."]'::jsonb,
    '["Skriv den jobbiga tanken som en mening.", "Lägg till: \"Jag märker tanken att…\"", "Säg meningen högt 3 gånger. Långsamt.", "Fråga: vad skulle jag göra om tanken inte var i vägen?", "Gör en liten sak i den riktningen."]'::jsonb
  ),
  (
    'Worry-window: 15 min', 'Bryt ältande', 'yellow', 'focus', 15,
    'Stimuluskontroll för oro: samla orostid till ett bestämt fönster så hjärnan slutar älta hela dagen.',
    'Ge oron en egen tid på dagen — då slutar den knacka på resten. Forskningens favorittrick mot ältande.',
    '["generaliserad oro", "ältande", "morgonångest"]'::jsonb,
    '["pågående krisreaktion"]'::jsonb,
    '["Stimuluskontroll för oro minskar GAD-symtom (Borkovec, 1983; meta-analys 2014)."]'::jsonb,
    '["Boka 15 min idag, samma tid varje dag.", "När oro dyker upp innan: skriv en notis och säg \"sen\".", "När fönstret kommer: sätt timer.", "Skriv eller tänk på orosfrågorna fullt ut.", "När timern ringer: stäng. Gör nästa sak.", "Ompröva imorgon — mest oro tappar luft."]'::jsonb
  ),
  -- Kom igång (2)
  (
    '2-minutersregeln', 'Kom igång', 'orange', 'focus', 2,
    'Beteendeaktivering: starta så litet att motståndet inte hinner reagera. Rörelse föder motivation, inte tvärtom.',
    'Vänta inte på lust. Lust kommer ofta efter — inte före. Lova dig själv 2 minuter, inget mer.',
    '["motivationssvacka", "uppskjutande", "tunga morgnar"]'::jsonb,
    '[]'::jsonb,
    '["Beteendeaktivering är likvärdigt med KBT vid depression (Cochrane, 2020)."]'::jsonb,
    '["Välj uppgiften som tynger mest.", "Krymp den till 2 minuter.", "Sätt timer.", "Börja. Sluta efter 2 min om du vill.", "Notera: blev det lättare att fortsätta?"]'::jsonb
  ),
  (
    'Kläderna på, ut genom dörren', 'Kom igång', 'orange', 'focus', 5,
    'Att bryta tröskeln mellan inne och ute är ofta det svåraste. När du väl är ute är slaget halvvunnet.',
    'Du behöver inte ha en plan. Bara: kläder på, dörren öppen, ett steg ut. Resten kommer.',
    '["isolering", "tunga dagar", "morgontröghet"]'::jsonb,
    '["fysisk skada som hindrar gång"]'::jsonb,
    '["Tidig morgonexponering för dagsljus förbättrar sömn och stämning (PNAS, 2017)."]'::jsonb,
    '["Lägg fram kläderna som en hög.", "Klä på dig — inte mer.", "Öppna ytterdörren.", "Ta tre steg ut.", "Stanna 30 sekunder. Andas. Bestäm sen om du går vidare."]'::jsonb
  ),
  -- Skriv av dig (1)
  (
    'Brev till framtida jag', 'Skriv av dig', 'yellow', 'journal', 8,
    'Tidsperspektivskifte: minskar känslomässig intensitet och stärker hopp och självmedkänsla.',
    'Skriv till dig själv om en månad. Påminn den personen om vad du klarade idag. Den lilla människan behöver höra det.',
    '["nedstämdhet", "hopplöshet", "tunga perioder"]'::jsonb,
    '[]'::jsonb,
    '["Self-distancing minskar emotionell reaktivitet (Kross & Ayduk, 2017)."]'::jsonb,
    '["Sätt timer på 8 minuter.", "Börja: \"Hej du om en månad…\"", "Skriv vad du går igenom just nu — ärligt.", "Skriv vad du gör för att ta hand om dig.", "Avsluta med en uppmuntran från nu-jag till framtida-jag."]'::jsonb
  ),
  -- Rör dig mjukt (1)
  (
    'Trapp-snutt 3 min', 'Rör dig mjukt', 'pink', 'movement', 3,
    'Korta intervaller (exercise snacks) ger mätbar effekt på humör och energi även utan träningspass.',
    'Inget gymkort, ingen träningsväska. Bara en trappa och tre minuter — och energin kommer att märkas.',
    '["energidipp", "stillasittande", "kort tid"]'::jsonb,
    '["yrsel", "akut hjärtbesvär", "skada"]'::jsonb,
    '["Exercise snacks förbättrar kondition och humör (BMJ, 2022)."]'::jsonb,
    '["Hitta en trappa eller backe.", "Gå/jogga upp i 30 sek.", "Gå långsamt ner.", "Upprepa 4–5 gånger.", "Avsluta stående. 3 djupa andetag."]'::jsonb
  ),
  -- Sociala mikrosteg (1)
  (
    'Tacka någon i dag', 'Sociala mikrosteg', 'pink', 'social', 3,
    'Uttryckt tacksamhet stärker både din och andras stämning, och bygger sociala band utan tröskel.',
    'Skicka en kort tack-rad till någon. En mening räcker. Det är en av de mest forskningstunga humör-höjarna som finns.',
    '["isolering", "låg energi", "behov av närhet"]'::jsonb,
    '[]'::jsonb,
    '["Tacksamhetsövningar förbättrar välmående i flera meta-analyser (Bohlmeijer m.fl., 2021)."]'::jsonb,
    '["Tänk på en person du är tacksam för.", "Skriv en kort rad: \"Tack för att…\"", "Var konkret — vad de faktiskt gjort eller varit.", "Skicka. Inga förväntningar tillbaka.", "Märk: hur känns det i kroppen?"]'::jsonb
  ),
  -- Mat & humör (1)
  (
    'Tallrik utan dom', 'Mat & humör', 'green', 'food', 5,
    'Avdramatisera ätandet. Skuld kring mat förvärrar nedstämdhet — regelbundenhet utan perfektion är vinsten.',
    'En måltid behöver inte vara nyttig, prydlig eller hemlagad. Den behöver finnas. Det räcker som vinst idag.',
    '["aptitlöshet", "matskuld", "tunga dagar"]'::jsonb,
    '["aktiv ätstörning som behöver specialiststöd"]'::jsonb,
    '["Regelbundna måltider stabiliserar blodsocker och stämning (Lancet Psychiatry, 2019)."]'::jsonb,
    '["Välj något som finns hemma.", "Lägg på en tallrik. Sätt dig ner.", "Ät i ditt eget tempo.", "Skippa självkritik — den hör inte hemma här.", "Notera: maten är gjord. Bra jobbat."]'::jsonb
  ),
  -- Trygghet (1)
  (
    'Tre röda flaggor', 'Trygghet', 'orange', 'education', 4,
    'Tidiga varningssignaler är lättare att hantera än fullt utvecklad kris. Att känna igen sina egna är skyddande.',
    'Lär känna dina egna tidiga signaler. När du ser dem tidigt kan du sätta in stöd direkt — innan det blir tungt.',
    '["återkommande svackor", "svängande mående", "förebyggande arbete"]'::jsonb,
    '[]'::jsonb,
    '["Krisplaner med tidiga varningstecken minskar återfall (Stanley & Brown, Safety Planning, 2012)."]'::jsonb,
    '["Tänk på senaste svackan. Vad var första tecknet?", "Skriv tre tidiga signaler — kropp, tanke, beteende.", "För varje signal: vad hjälpte tidigare?", "Lägg in i din krisplan.", "Berätta för någon nära. Stöd får finnas innan krisen."]'::jsonb
  )
) AS new_ex(title, category, color, type, duration_minutes, mechanism, description, recommended_for_json, not_recommended_for_json, evidence_json, steps_json)
WHERE NOT EXISTS (SELECT 1 FROM public.exercises e WHERE e.title = new_ex.title);


-- ===================== ARTIKLAR (8) =====================

INSERT INTO public.learn_articles (slug, title, category, color, read_minutes, excerpt, body_md, sources_json)
SELECT * FROM (VALUES
  (
    'andningen-som-fjarrkontroll',
    'Andningen som fjärrkontroll till nervsystemet',
    'Lugna kroppen', 'blue', 3,
    'Långsam, lång utandning är den enklaste vägen till lugn. Här är varför — och hur du gör.',
    E'# Andningen som fjärrkontroll\n\nDu har en knapp för lugn inbyggd i kroppen. Den heter utandning.\n\nNär du andas långsamt och låter utandningen vara längre än inandningen, aktiverar du den parasympatiska delen av nervsystemet — den som säger till hjärtat *du får sänka takten nu*.\n\n## Varför funkar det?\n\n- **Långsam andning** sänker hjärtfrekvens och blodtryck.\n- **Lång utandning** stimulerar vagusnerven, som dämpar stressreaktionen.\n- **Cyclic sighing** (dubbel inandning + lång utandning) visade i en studie 2023 starkare effekt på stress än meditation.\n\n## Tre snabba sätt\n\n1. **Box-andning 4-4-4-4** — bra inför något krävande.\n2. **Suck ut spänningen** — bra när bröstet känns trångt.\n3. **4 min längre utandning** — bra för läggdags.\n\n## Snäll påminnelse\n\nDu behöver inte göra det perfekt. Tre långa utandningar räknas också. Allt är bättre än inget. Du klarar det här.',
    '[{"title": "Cyclic sighing reduces stress more than meditation", "url": "https://doi.org/10.1016/j.xcrm.2022.100895"}, {"title": "Slow breathing and heart rate variability", "url": "https://doi.org/10.3389/fnhum.2018.00353"}]'::jsonb
  ),
  (
    'cbt-i-somn-utan-piller',
    'CBT-I: starkaste medicinen för sömn — utan piller',
    'Sov bättre', 'purple', 4,
    'Kognitiv beteendeterapi för insomni är förstahandsval i internationella riktlinjer. Här är de viktigaste bitarna.',
    E'# CBT-I på vanlig svenska\n\nCBT-I står för *Cognitive Behavioral Therapy for Insomnia* och är förstahandsbehandling för långvariga sömnproblem enligt American Academy of Sleep Medicine. Bättre långsiktig effekt än sömntabletter.\n\n## De fyra hörnstenarna\n\n**1. Fast vakna­tid.** Stig upp samma tid varje dag — även helger, även efter dålig natt. Detta är den enskilt viktigaste regeln.\n\n**2. Stimuluskontroll.** Sängen är till för sömn. Kan du inte sova på 20 min? Kliv upp, gör något stilla, gå tillbaka när sömnigheten kommer.\n\n**3. Sömnrestriktion.** Begränsa tiden i sängen till ungefär den tid du faktiskt sover. Låter hårt — fungerar.\n\n**4. Avveckling av oro.** Worry-window och tankebrev före läggdags så hjärnan inte spinner när huvudet möter kudden.\n\n## Vad du gör i appen\n\nAlla fyra finns som övningar här. Börja med **Stig upp samma tid** i en vecka. Det är ofta nyckeln.\n\n## När söka hjälp\n\nOm sömnen varit dålig i mer än 3 månader och påverkar din vardag — be om en remiss till sömnskola eller iKBT.',
    '[{"title": "Clinical Practice Guideline for the Treatment of Chronic Insomnia", "url": "https://aasm.org/clinical-resources/practice-standards/practice-guidelines/"}, {"title": "Cochrane review on CBT-I", "url": "https://www.cochrane.org/CD010753"}]'::jsonb
  ),
  (
    'beteendeaktivering-2min',
    '2-minutersregeln: när lust inte kommer först',
    'Kom igång', 'orange', 3,
    'Du är inte lat. Hjärnan väntar på fel sak. Så här lurar du den att börja.',
    E'# Lust kommer efter, inte före\n\nEn av de tröttaste myterna är att vi behöver känna lust för att göra något. Vid nedstämdhet är det nästan tvärtom: handlingen kommer först, känslan följer efter.\n\nDet kallas **beteendeaktivering** och är, enligt en Cochrane-genomgång 2020, lika effektivt som KBT vid depression — och oftare snabbare.\n\n## Hur du gör 2-minutersregeln\n\n1. Välj uppgiften som tynger mest just nu.\n2. Krymp den till 2 minuter. Bara 2.\n3. Sätt timer.\n4. Börja. Sluta efter 2 min om du vill — på riktigt.\n\nDet låter för lite. Det är därför det funkar. Tröskeln blir så låg att hjärnan inte hinner protestera.\n\n## Det finns inga ”misslyckade” 2 minuter\n\nDu öppnade datorn. Du klädde på dig. Du tog ett steg ut. Det är vinster. Nedstämdhet ljuger om vad som räknas — men kroppen vet.\n\n## Pepp-påminnelse\n\nDu klarar 2 minuter. Sen ser vi.',
    '[{"title": "Behavioral activation for depression — Cochrane", "url": "https://www.cochrane.org/CD003380"}, {"title": "Atomic Habits, James Clear, om 2-min-regeln", "url": "https://jamesclear.com/atomic-habits"}]'::jsonb
  ),
  (
    'sjalvmedkansla-pa-riktigt',
    'Självmedkänsla — inte mjukt prat, hård forskning',
    'Bryt ältande', 'yellow', 4,
    'Att vara snäll mot dig själv är inte flummigt. Det är en av de mest skyddande faktorerna mot ångest och nedstämdhet.',
    E'# Snäll mot dig själv är ingen lyx\n\nSjälvmedkänsla — *self-compassion* — har i över 20 år av forskning visat sig minska ångest, depression och stress, och stärka motståndskraft.\n\nKristin Neff, en av forskarna bakom fältet, beskriver det i tre delar:\n\n## De tre delarna\n\n**1. Vänlighet mot sig själv.** Tänk på dig själv som du skulle tänka på en vän i samma situation.\n\n**2. Gemensam mänsklighet.** Det här är inte bara du. Människor lider, kämpar, faller. Du är inte ensam.\n\n**3. Närvaro utan att drunkna.** Se känslan, namnge den — utan att svepas med.\n\n## När det är som svårast — säg detta\n\n> "Det här är ett svårt ögonblick.  \n> Smärta hör livet till.  \n> Får jag vara snäll mot mig själv just nu?"\n\nDet är en mikro-version av det som heter *self-compassion break*. Tre meningar. Tar 30 sekunder. Forskat på, fungerar.\n\n## Det är inte att ge upp\n\nSjälvmedkänsla är inte att bli passiv. Det är att sluta slå dig själv så att du har kraft att resa dig.',
    '[{"title": "Self-compassion and well-being meta-analysis", "url": "https://doi.org/10.1037/bul0000273"}, {"title": "Self-Compassion.org — Kristin Neff", "url": "https://self-compassion.org/"}]'::jsonb
  ),
  (
    'akt-vardena-som-kompass',
    'ACT: dina värden som kompass när allt skakar',
    'Kom igång', 'orange', 4,
    'När du inte vet vart du ska, börja med vad du står för. ACT i två minuters läsning.',
    E'# Värden, inte mål\n\nACT — Acceptance and Commitment Therapy — är en evidensbaserad behandling som handlar om att leva ett rikt liv *med* svåra känslor, inte bortom dem.\n\nKärnidén: dina **värden** är riktningen. Mål är destinationer, värden är väderstreck.\n\n## Skillnaden\n\n- **Mål:** ”Jag ska träna 3 gånger i veckan.” (Klar eller inte.)\n- **Värde:** ”Jag vill ta hand om min kropp.” (Riktning du alltid kan röra dig mot.)\n\nMål kan misslyckas. Värden bara *finns*.\n\n## Hitta dina värden\n\nFråga dig själv:\n\n1. Vilken sorts människa vill jag vara — i nära relationer? På jobbet? Mot mig själv?\n2. När känner jag mig mest *jag*?\n3. Vad skulle jag vilja stå för, även när det är svårt?\n\n## En sak idag\n\nVälj **ett** värde. Gör en liten sak i den riktningen. 2 minuter räcker. Det är inte storleken som räknas — det är riktningen.\n\nAtt göra något litet i rätt riktning är alltid en framgång. Du klarar det här.',
    '[{"title": "ACT meta-analysis", "url": "https://doi.org/10.1016/j.brat.2020.103747"}, {"title": "Russ Harris: The Happiness Trap (intro till ACT)", "url": "https://thehappinesstrap.com/"}]'::jsonb
  ),
  (
    'rorelse-som-medicin-mer',
    'Rörelse är medicin — även 10 minuter räknas',
    'Rör dig mjukt', 'pink', 3,
    'Du behöver inte träna ”på riktigt”. 10 minuter rörelse på låg intensitet ger mätbar effekt på humör.',
    E'# 10 minuter räcker långt\n\nVi har länge fått höra att 30 minuter, 3 gånger i veckan är minimum. Senare forskning är mer generös: även **korta rörelse­snuttar** ger effekt — på humör, energi och sömn.\n\n## Vad säger forskningen?\n\n- 10 minuters rask promenad förbättrade humör mätbart i flera studier.\n- Exercise snacks (1–3 min korta pulshöjningar) förbättrar kondition.\n- Daglig rörelse minskar risk för depression med ~26 % (JAMA Psychiatry, 2022).\n\n## Tröskeln, inte träningen\n\nDet svåraste är ofta att komma ut. Lägg därför fokus på *början*, inte längden:\n\n- Kläderna på, ut genom dörren.\n- Trapp-snutt 3 min hemma.\n- Långsam promenad utan mål.\n\n## När det är riktigt tungt\n\nLåg intensitet är **inte sämre**. För nedstämda är lugn rörelse i dagsljus ofta bättre än hård träning. Ingen skuld kring tempo eller längd.\n\nKroppen tackar för det den får. Inte det den missar.',
    '[{"title": "Physical activity and depression — JAMA Psychiatry", "url": "https://doi.org/10.1001/jamapsychiatry.2022.0609"}, {"title": "Brief exercise snacks improve fitness — BMJ", "url": "https://doi.org/10.1136/bmj-2022-073412"}]'::jsonb
  ),
  (
    'sociala-band-som-skydd',
    'Sociala band är skyddsutrustning',
    'Sociala mikrosteg', 'pink', 3,
    'Ensamhet ökar risken för nedstämdhet. Och nej, du behöver inte vara en social fjäril.',
    E'# Du är inte byggd för att klara allt själv\n\nMänniskor är gruppdjur. När vi är ensamma länge ökar nivåerna av stresshormoner, sömnen blir sämre och nedstämdhet får lättare fäste.\n\nMen — och det här är viktigt — det handlar inte om kvantitet. Det räcker med några få regelbundna kontakter där du kan vara dig själv.\n\n## Tre nivåer av social påfyllning\n\n**Mikro:** ett hej till kassören, ett leende på bussen. Räknas mer än vi tror.\n\n**Mellan:** ett hjärta i ett sms, ett *tack för senast*, en röstmemo.\n\n**Djup:** en fika, ett samtal där du säger hur det faktiskt är.\n\n## När du orkar mindre\n\nBörja på mikro-nivå. Det räcker som dagens sociala mikrosteg. På riktigt.\n\n## En liten sak idag\n\nSkicka ett hjärta till någon du tänker på. Inga förväntningar tillbaka. Du har gjort din del — och det räknas.',
    '[{"title": "Loneliness and risk for depression — JAMA Psychiatry meta-analysis", "url": "https://doi.org/10.1001/jamapsychiatry.2020.4337"}, {"title": "Weak ties och välmående — PNAS", "url": "https://doi.org/10.1073/pnas.2118062119"}]'::jsonb
  ),
  (
    'mening-i-smatt',
    'Mening i smått — när det stora känns för långt bort',
    'Bryt ältande', 'yellow', 3,
    'Du behöver inte ett stort syfte. En liten meningsfull stund per dag räcker som början.',
    E'# Mening behöver inte vara stor\n\nNär livet är tungt kan ”vad är mitt syfte?” kännas som en omöjlig fråga. Bra nyhet: forskning på meningsfullhet visar att **små vardagsmeningar** är minst lika viktiga som stora livsval.\n\n## Tre källor till mening i vardagen\n\n**Tillhörighet** — att vara en del av något (familj, vänner, lag, granne).\n\n**Bidra** — att hjälpa något eller någon, även litet.\n\n**Närvaro** — att vara fullt här i en stund, hur kort som helst.\n\n## En övning: dagens lilla mening\n\nVarje kväll, skriv en mening:\n\n> Idag betydde det här något för mig: ___\n\nDet kan vara att solen träffade köksbordet. En kram. En textrad. Något du gjorde för någon.\n\nGör det i 7 dagar. Många märker att hjärnan börjar leta — och hitta — utan att man ber den.\n\n## Varför funkar det?\n\nDu tränar uppmärksamhet på det som lyfter — istället för det som tynger. Det är inte naivt. Det är aktiv styrning av fokus, och det är skyddande.',
    '[{"title": "Sense of meaning and well-being — Annual Review of Psychology", "url": "https://doi.org/10.1146/annurev-psych-072420-122921"}, {"title": "Three pillars of meaning — Emily Esfahani Smith", "url": "https://www.ted.com/talks/emily_esfahani_smith_there_s_more_to_life_than_being_happy"}]'::jsonb
  )
) AS new_art(slug, title, category, color, read_minutes, excerpt, body_md, sources_json)
WHERE NOT EXISTS (SELECT 1 FROM public.learn_articles a WHERE a.slug = new_art.slug);


-- ===================== SEKVENSER (4) =====================
-- Bygger sekvenser dynamiskt från övningstitlarna ovan så slug-ordningen blir rätt.

WITH ex AS (
  SELECT id, title FROM public.exercises
)
INSERT INTO public.exercise_sequences (slug, title, description, color, time_of_day, exercise_ids_json)
SELECT * FROM (
  VALUES
    (
      'lugna-angestvagen',
      'Lugna ångestvågen',
      'Tre steg när ångesten drar igång: andning, förankring, mjuk rörelse. Tar ca 9 minuter — och du behöver ingen utrustning.',
      'blue',
      'anytime',
      jsonb_build_array(
        (SELECT id FROM ex WHERE title = 'Suck ut spänningen' LIMIT 1),
        (SELECT id FROM ex WHERE title = '5-4-3-2-1 grounding' LIMIT 1),
        (SELECT id FROM ex WHERE title = 'Långsam promenad' LIMIT 1)
      )
    ),
    (
      'kvallsritual-for-somn',
      'Kvällsritual för sömn',
      'En kort ritual som varvar ner kropp och huvud inför natten. Tankarna får en plats — sängen får vara för sömn.',
      'purple',
      'evening',
      jsonb_build_array(
        (SELECT id FROM ex WHERE title = 'Tankebrevet före sömn' LIMIT 1),
        (SELECT id FROM ex WHERE title = '4 min längre utandning' LIMIT 1),
        (SELECT id FROM ex WHERE title = 'Kroppsskanning 6 min' LIMIT 1)
      )
    ),
    (
      'kom-igang-morgon',
      'Kom-igång-morgon',
      'För dagar då sängen är magnetisk. Tre snälla, små steg som tillsammans får dig ut i världen.',
      'orange',
      'morning',
      jsonb_build_array(
        (SELECT id FROM ex WHERE title = '2-minutersregeln' LIMIT 1),
        (SELECT id FROM ex WHERE title = 'Kläderna på, ut genom dörren' LIMIT 1),
        (SELECT id FROM ex WHERE title = '15 min dagsljuspromenad' LIMIT 1)
      )
    ),
    (
      'aterhamta-tung-dag',
      'Återhämta efter tung dag',
      'Tre steg för att vara snäll mot dig själv när allt har varit för mycket. Mat, värme, mjukhet.',
      'green',
      'evening',
      jsonb_build_array(
        (SELECT id FROM ex WHERE title = 'Tallrik utan dom' LIMIT 1),
        (SELECT id FROM ex WHERE title = 'Brev till framtida jag' LIMIT 1),
        (SELECT id FROM ex WHERE title = 'Progressiv avslappning' LIMIT 1)
      )
    )
) AS new_seq(slug, title, description, color, time_of_day, exercise_ids_json)
WHERE NOT EXISTS (SELECT 1 FROM public.exercise_sequences s WHERE s.slug = new_seq.slug);
