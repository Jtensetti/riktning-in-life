// PHQ-9, GAD-7, WHO-5, MADR-S, KEDS, BBQ-12 form definitions in Swedish

export type FormType = "phq9" | "gad7" | "who5" | "madrs" | "keds" | "bbq12";

export type FormOption = { label: string; value: number; muted?: boolean };

export type FormQuestion = {
  text: string;
  /** Förklarande paragraf som visas under frågans titel. */
  help?: string;
  /** Frågespecifika alternativ — har företräde över FormDef.options. */
  options?: FormOption[];
};

export interface FormDef {
  type: FormType;
  title: string;
  intro: string;
  /** Enkla frågor som alla använder samma `options`. */
  questions: string[];
  /** Eller frågor med egna alternativ + ev. hjälptext. Företräde över `questions`. */
  questionsWithOptions?: FormQuestion[];
  /** Defaultalternativ när frågan inte har egna. */
  options: FormOption[];
  maxRaw: number;
  scoreLabel: (raw: number) => string;
  toFinal?: (raw: number) => number; // WHO-5: raw*4 → 0-100
}

const PHQ_OPTIONS: FormOption[] = [
  { label: "Inte alls", value: 0 },
  { label: "Flera dagar", value: 1 },
  { label: "Mer än hälften av dagarna", value: 2 },
  { label: "Nästan varje dag", value: 3 },
];

export const PHQ9: FormDef = {
  type: "phq9",
  title: "PHQ-9",
  intro: "De senaste 2 veckorna, hur ofta har du besvärats av något av följande?",
  options: PHQ_OPTIONS,
  maxRaw: 27,
  questions: [
    "Lite intresse eller glädje av att göra saker",
    "Känt dig nedstämd, deprimerad eller utan hopp",
    "Svårt att somna, sover oroligt eller sover för mycket",
    "Känt dig trött eller haft lite energi",
    "Dålig aptit eller ätit för mycket",
    "Tyckt illa om dig själv – känt dig misslyckad eller svikit dig själv eller familjen",
    "Svårt att koncentrera dig på t.ex. att läsa eller titta på TV",
    "Rört dig eller talat så långsamt att andra märkt det – eller varit så rastlös att du rört dig mer än vanligt",
    "Tankar på att det vore bättre om du var död eller på att skada dig själv",
  ],
  scoreLabel: (r) => r >= 20 ? "Svår" : r >= 15 ? "Medelsvår" : r >= 10 ? "Måttlig" : r >= 5 ? "Lindrig" : "Minimal",
};

export const GAD7: FormDef = {
  type: "gad7",
  title: "GAD-7",
  intro: "De senaste 2 veckorna, hur ofta har du besvärats av följande?",
  options: PHQ_OPTIONS,
  maxRaw: 21,
  questions: [
    "Känt dig nervös, ängslig eller på helspänn",
    "Inte kunnat sluta oroa dig eller kontrollera oron",
    "Oroat dig för mycket för olika saker",
    "Haft svårt att slappna av",
    "Varit så rastlös att det varit svårt att sitta still",
    "Lätt blivit irriterad eller lättretad",
    "Känt rädsla som om något hemskt skulle hända",
  ],
  scoreLabel: (r) => r >= 15 ? "Svår" : r >= 10 ? "Måttlig" : r >= 5 ? "Lindrig" : "Minimal",
};

const WHO_OPTIONS: FormOption[] = [
  { label: "Hela tiden", value: 5 },
  { label: "Mestadels", value: 4 },
  { label: "Mer än halva tiden", value: 3 },
  { label: "Mindre än halva tiden", value: 2 },
  { label: "Då och då", value: 1 },
  { label: "Aldrig", value: 0 },
];

export const WHO5: FormDef = {
  type: "who5",
  title: "WHO-5",
  intro: "Under de senaste 2 veckorna…",
  options: WHO_OPTIONS,
  maxRaw: 25,
  toFinal: (r) => r * 4,
  questions: [
    "Har jag känt mig glad och på gott humör",
    "Har jag känt mig lugn och avslappnad",
    "Har jag känt mig aktiv och energisk",
    "Vaknade jag och kände mig pigg och utvilad",
    "Min vardag har varit fylld av saker som intresserar mig",
  ],
  scoreLabel: (r) => {
    const f = r * 4;
    return f <= 28 ? "Mycket lågt välbefinnande" : f <= 50 ? "Lågt välbefinnande" : f <= 75 ? "Måttligt välbefinnande" : "Gott välbefinnande";
  },
};

// ---------------- MADR-S ----------------
// 0–6-skala där 1, 3, 5 är "mellanlägen" utan beskrivning.
const madrsScale = (texts: { 0: string; 2: string; 4: string; 6: string }): FormOption[] => [
  { label: texts[0], value: 0 },
  { label: "Mellanläge", value: 1, muted: true },
  { label: texts[2], value: 2 },
  { label: "Mellanläge", value: 3, muted: true },
  { label: texts[4], value: 4 },
  { label: "Mellanläge", value: 5, muted: true },
  { label: texts[6], value: 6 },
];

export const MADRS: FormDef = {
  type: "madrs",
  title: "MADRS-S",
  intro:
    "Frågorna gäller hur du mått de senaste 3 dagarna. Markera det alternativ som bäst stämmer. Tänk inte alltför länge — svara spontant.",
  options: [],
  maxRaw: 54,
  questions: [],
  questionsWithOptions: [
    {
      text: "Sinnesstämning",
      help:
        "Hur har din sinnesstämning varit — ledsen, tungsint eller dyster? Tänk på om humöret har skiftat eller varit i stort sett detsamma, och om du har känt dig lättare till sinnes vid något positivt.",
      options: madrsScale({
        0: "Jag kan känna mig glad eller ledsen, alltefter omständigheterna.",
        2: "Jag känner mig nedstämd för det mesta, men ibland kan det kännas lättare.",
        4: "Jag känner mig genomgående nedstämd och dyster. Jag kan inte glädja mig åt sådant som vanligen skulle göra mig glad.",
        6: "Jag är så totalt nedstämd och olycklig att jag inte kan tänka mig värre.",
      }),
    },
    {
      text: "Oroskänslor",
      help:
        "I vilken utsträckning har du haft känslor av inre spänning, olust, ångest eller odefinierad rädsla? Tänk på hur intensiva känslorna varit och om de kommit och gått eller funnits nästan hela tiden.",
      options: madrsScale({
        0: "Jag känner mig mestadels lugn.",
        2: "Ibland har jag obehagliga känslor av inre oro.",
        4: "Jag har ofta en känsla av inre oro som ibland kan bli mycket stor, och som jag måste anstränga mig för att bemästra.",
        6: "Jag har fruktansvärda, långvariga eller outhärdliga ångestkänslor.",
      }),
    },
    {
      text: "Sömn",
      help:
        "Hur länge och hur bra har du sovit de senaste tre nätterna? Bedömningen avser hur du faktiskt sovit, oavsett om du tagit sömnmedel. Sover du mer än vanligt, sätt markeringen på 0.",
      options: madrsScale({
        0: "Jag sover lugnt och bra och tillräckligt länge för mina behov. Jag har inga särskilda svårigheter att somna.",
        2: "Jag har vissa sömnsvårigheter. Ibland har jag svårt att somna eller sover ytligare eller oroligare än vanligt.",
        4: "Jag sover minst två timmar mindre per natt än normalt. Jag vaknar ofta under natten, även om jag inte blir störd.",
        6: "Jag sover mycket dåligt, inte mer än 2–3 timmar per natt.",
      }),
    },
    {
      text: "Matlust",
      help:
        "Hur är din aptit, har den skilt sig från det normala för dig? Om du har bättre aptit än vanligt — markera 0.",
      options: madrsScale({
        0: "Min aptit är som den brukar vara.",
        2: "Min aptit är sämre än vanligt.",
        4: "Min aptit har nästan helt försvunnit.",
        6: "Jag vill inte ha någon mat. Om jag skall få någonting i mig, måste jag övertalas att äta.",
      }),
    },
    {
      text: "Koncentrationsförmåga",
      help:
        "Hur är din förmåga att hålla tankarna samlade vid sysslor som kräver olika grad av koncentration, t.ex. läsning av komplicerad text, lätt tidningstext eller TV-tittande?",
      options: madrsScale({
        0: "Jag har inga koncentrationssvårigheter.",
        2: "Jag har tillfälligt svårt att hålla tankarna samlade på sådant som normalt skulle fånga min uppmärksamhet (t.ex. läsning eller TV-tittande).",
        4: "Jag har påtagligt svårt att koncentrera mig på sådant som normalt inte kräver någon ansträngning från min sida (t.ex. läsning eller samtal med andra människor).",
        6: "Jag kan överhuvudtaget inte koncentrera mig på någonting.",
      }),
    },
    {
      text: "Initiativförmåga",
      help:
        "Hur är din handlingskraft? Har du lätt eller svårt att komma igång med sådant du tycker du bör göra, och hur mycket inre motstånd måste du övervinna?",
      options: madrsScale({
        0: "Jag har inga svårigheter med att ta itu med nya uppgifter.",
        2: "När jag skall ta itu med något, tar det emot på ett sätt som inte är normalt för mig.",
        4: "Det krävs en stor ansträngning för mig att ens komma igång med enkla uppgifter som jag vanligtvis utför mer eller mindre rutinmässigt.",
        6: "Jag kan inte förmå mig att ta itu med de enklaste vardagssysslor.",
      }),
    },
    {
      text: "Känslomässigt engagemang",
      help:
        "Hur upplever du ditt intresse för omvärlden, för andra människor och för aktiviteter som brukar bereda dig nöje och glädje?",
      options: madrsScale({
        0: "Jag är intresserad av omvärlden och engagerar mig i den, och det bereder mig både nöje och glädje.",
        2: "Jag känner mindre starkt för sådant som brukar engagera mig. Jag har svårare än vanligt att bli glad eller svårare att bli arg när det är befogat.",
        4: "Jag kan inte känna något intresse för omvärlden, inte ens för vänner och bekanta.",
        6: "Jag har slutat uppleva några känslor. Jag känner mig smärtsamt likgiltig även för mina närmaste.",
      }),
    },
    {
      text: "Pessimism",
      help:
        "Hur ser du på din egen framtid och ditt eget värde? Tänk på självförebråelser, skuldkänslor och oro för t.ex. ekonomi eller hälsa.",
      options: madrsScale({
        0: "Jag ser på framtiden med tillförsikt. Jag är på det hela taget ganska nöjd med mig själv.",
        2: "Ibland klandrar jag mig själv och tycker att jag är mindre värd än andra.",
        4: "Jag grubblar ofta över mina misslyckanden och känner mig mindervärdig eller dålig, även om andra tycker annorlunda.",
        6: "Jag ser allting i svart och kan inte se någon ljusning. Det känns som om jag var en alltigenom dålig människa, och som om jag aldrig skulle kunna få någon förlåtelse för det hemska jag gjort.",
      }),
    },
    {
      text: "Livslust",
      help:
        "Hur är din livslust? Har du tankar på självmord och i så fall i vilken utsträckning upplever du detta som en verklig utväg?",
      options: madrsScale({
        0: "Jag har normal aptit på livet.",
        2: "Livet känns inte särskilt meningsfullt men jag önskar ändå inte att jag vore död.",
        4: "Jag tycker ofta det vore bättre att vara död, och trots att jag egentligen inte önskar det, kan självmord ibland kännas som en möjlig utväg.",
        6: "Jag är egentligen övertygad om att min enda utväg är att dö, och jag tänker mycket på hur jag bäst skall gå tillväga för att ta mitt eget liv.",
      }),
    },
  ],
  scoreLabel: (r) =>
    r >= 35 ? "Svår depression"
    : r >= 20 ? "Måttlig depression"
    : r >= 13 ? "Lindrig depression"
    : "Ingen/mycket lindrig",
};

// ---------------- KEDS ----------------
const kedsScale = (texts: { 0: string; 2: string; 4: string; 6: string }): FormOption[] => [
  { label: texts[0], value: 0 },
  { label: "Mellanläge", value: 1, muted: true },
  { label: texts[2], value: 2 },
  { label: "Mellanläge", value: 3, muted: true },
  { label: texts[4], value: 4 },
  { label: "Mellanläge", value: 5, muted: true },
  { label: texts[6], value: 6 },
];

export const KEDS: FormDef = {
  type: "keds",
  title: "KEDS",
  intro:
    "Karolinska Exhaustion Disorder Scale. Välj det alternativ som bäst stämmer med hur du mått de senaste två veckorna.",
  options: [],
  maxRaw: 54,
  questions: [],
  questionsWithOptions: [
    {
      text: "Koncentrationsförmåga",
      help:
        "Din förmåga att hålla tankarna samlade vid sysslor som kräver olika grad av koncentration — komplicerad text, lätt tidningstext, TV-tittande.",
      options: kedsScale({
        0: "Jag har inte svårt att koncentrera mig utan läser, tittar på TV och för samtal som vanligt.",
        2: "Jag har ibland svårt att hålla tankarna samlade på sådant som normalt skulle fånga min uppmärksamhet.",
        4: "Jag har ofta svårt att koncentrera mig.",
        6: "Jag kan överhuvudtaget inte koncentrera mig på någonting.",
      }),
    },
    {
      text: "Minne",
      help: "Din förmåga att komma ihåg namn, datum eller vardagliga ärenden.",
      options: kedsScale({
        0: "Jag kommer ihåg namn, datum och ärenden jag ska göra.",
        2: "Det händer att jag glömmer bort sådant som inte är så viktigt men om jag skärper mig minns jag för det mesta.",
        4: "Jag glömmer ofta bort möten eller namnen på personer som jag känner mycket väl.",
        6: "Jag glömmer dagligen bort betydelsefulla saker eller saker som jag skulle gjort.",
      }),
    },
    {
      text: "Kroppslig uttröttbarhet",
      help:
        "Hur är din fysiska ork? Känner du dig mer fysiskt trött än vanligt efter vardagliga sysslor eller kroppsansträngning?",
      options: kedsScale({
        0: "Jag känner mig som vanligt och utför fysiska aktiviteter som ingår i vardagen eller tränar som jag brukar.",
        2: "Jag känner att fysiska ansträngningar är mer tröttande än normalt men rör mig ändå som vanligt i det avseendet.",
        4: "Jag har svårt att orka med kroppsansträngning. Det fungerar så länge jag rör mig i normal takt men jag klarar inte att öka takten utan att bli darrig och andfådd.",
        6: "Jag känner mig mycket svag och orkar inte ens att röra mig kortare sträckor.",
      }),
    },
    {
      text: "Uthållighet",
      help: "Hur är din uthållighet — blir du lättare psykiskt trött än vanligt i vardagliga situationer?",
      options: kedsScale({
        0: "Jag har lika mycket energi som vanligt. Jag har inga särskilda svårigheter att genomföra mina vardagliga sysslor.",
        2: "Jag klarar av att genomföra vardagliga sysslor men det går åt mer energi och jag blir fortare trött än vanligt. Jag behöver ta pauser oftare än vanligt.",
        4: "Jag blir onormalt trött av att försöka utföra mina vardagssysslor och umgänge med andra människor tröttar ut mig.",
        6: "Jag orkar inte göra någonting.",
      }),
    },
    {
      text: "Återhämtning",
      help: "Hur väl och hur snabbt återhämtar du dig psykiskt och fysiskt när du har blivit uttröttad?",
      options: kedsScale({
        0: "Jag behöver inte vila under dagen.",
        2: "Jag blir trött under dagen men det räcker med en liten paus för att jag ska återhämta mig.",
        4: "Jag blir trött under dagen och behöver långa pauser för att bli piggare.",
        6: "Det spelar ingen roll hur mycket jag vilar, det är som om jag inte kan ladda om mina batterier.",
      }),
    },
    {
      text: "Sömn",
      help:
        "Hur sover du, och känner du dig utsövd? Bedömningen avser hur du faktiskt sovit, oavsett om du tagit sömnmedel.",
      options: kedsScale({
        0: "Jag sover gott och tillräckligt länge för mina behov och känner mig för det mesta utvilad när jag vaknar.",
        2: "Ibland sover jag oroligare eller vaknar under natten och har svårt att somna om. Det händer att jag inte känner mig utsövd efter en natts sömn.",
        4: "Jag sover ofta oroligt eller vaknar under natten och har svårt att somna om. Det händer ofta att jag inte känner mig utsövd efter en natts sömn.",
        6: "Jag sover oroligt eller vaknar varje natt och har svårigheter att somna om. Jag känner mig aldrig utvilad eller utsövd när jag vaknar.",
      }),
    },
    {
      text: "Överkänslighet för sinnesintryck",
      help: "Har något eller några av dina sinnen blivit mer känsliga för intryck, t.ex. ljud, ljus, dofter eller beröring?",
      options: kedsScale({
        0: "Jag tycker inte att mina sinnen är känsligare än vanligt.",
        2: "Det händer att ljud, ljus eller andra sinnesintryck känns obehagliga.",
        4: "Jag upplever ofta ljud, ljus eller andra sinnesintryck som störande eller obehagliga.",
        6: "Ljud, ljus eller andra sinnesintryck stör mig så mycket att jag drar mig undan för att mina sinnen ska få vila.",
      }),
    },
    {
      text: "Upplevelsen av krav",
      help: "Hur reagerar du på krav i vardagen — krav från omgivningen eller från dig själv?",
      options: kedsScale({
        0: "Jag gör det jag ska eller vill göra utan att uppleva det som särskilt krävande eller besvärligt.",
        2: "Vardagliga situationer som jag tidigare hanterat utan särskilda problem kan ibland kännas krävande och orsaka obehag eller få mig att bli lättare stressad än vanligt.",
        4: "Situationer som jag tidigare hanterat utan problem känns nu ofta krävande och orsakar ett starkt obehag eller en stark stress.",
        6: "Det mesta känns krävande och jag klarar inte av att hantera det överhuvudtaget.",
      }),
    },
    {
      text: "Irritation och ilska",
      help:
        "Hur lättirriterad eller arg känner du dig inombords, oavsett om du visat något utåt? Tänk på hur lättväckt irritationen varit i förhållande till vad som utlöst den.",
      options: kedsScale({
        0: "Jag känner mig inte särskilt lättirriterad.",
        2: "Jag känner mig mer otålig eller lättirriterad än vanligt men det går också snabbt över.",
        4: "Jag blir lättare arg eller provocerad än vanligt. Ibland förlorar jag fattningen på ett sätt som inte är normalt för mig.",
        6: "Jag känner mig ofta alldeles rasande invärtes och måste anstränga mig till det yttersta för att behärska mig.",
      }),
    },
  ],
  // Klinisk gränsvärde 19 (summa 0–54).
  scoreLabel: (r) =>
    r >= 30 ? "Påtagliga utmattningstecken"
    : r >= 19 ? "Tecken på utmattning"
    : "Låg risk",
};

// ---------------- BBQ-12 ----------------
const BBQ_OPTIONS: FormOption[] = [
  { label: "Instämmer inte alls", value: 0 },
  { label: "Instämmer till liten del", value: 1 },
  { label: "Instämmer till viss del", value: 2 },
  { label: "Instämmer till stor del", value: 3 },
  { label: "Instämmer fullständigt", value: 4 },
];

export const BBQ12: FormDef = {
  type: "bbq12",
  title: "BBQ-12",
  intro: "Brunnsviken Brief Quality of Life Scale. Välj det alternativ som bäst överensstämmer med din upplevelse.",
  options: BBQ_OPTIONS,
  maxRaw: 48,
  questions: [
    "Jag är nöjd med min fritid: jag har möjlighet att göra det jag vill för att slappna av och roa mig.",
    "Min fritid är viktig för min livskvalitet.",
    "Jag är nöjd med hur jag ser på livet: jag vet vad som betyder mycket för mig, vad jag tror på och vad jag vill göra med mitt liv.",
    "Hur jag ser på livet är viktigt för min livskvalitet.",
    "Jag är nöjd med mina möjligheter att få vara kreativ: att få använda min fantasi i vardagen, inom en hobby, på jobbet eller i studier.",
    "Att få vara kreativ är viktigt för min livskvalitet.",
    "Jag är nöjd med mitt lärande: jag har möjlighet och lust att lära mig nya spännande saker och färdigheter som intresserar mig.",
    "Lärande är viktigt för min livskvalitet.",
    "Jag är nöjd med vänner och vänskap: jag har vänner som jag umgås med och som stöttar mig (så många vänner som jag vill ha och behöver).",
    "Vänner och vänskap är viktigt för min livskvalitet.",
    "Jag är nöjd med mig själv som individ: jag tycker om och respekterar mig själv.",
    "Att jag är nöjd med mig själv som individ är viktigt för min livskvalitet.",
  ],
  scoreLabel: (r) =>
    r >= 36 ? "Hög livskvalitet"
    : r >= 24 ? "God livskvalitet"
    : r >= 12 ? "Måttlig livskvalitet"
    : "Låg livskvalitet",
};

export const FORMS: Record<FormType, FormDef> = {
  phq9: PHQ9,
  gad7: GAD7,
  who5: WHO5,
  madrs: MADRS,
  keds: KEDS,
  bbq12: BBQ12,
};

export const SIDE_EFFECTS = [
  { key: "nausea", label: "Illamående" },
  { key: "sweating", label: "Svettning" },
  { key: "headache", label: "Huvudvärk" },
  { key: "sleep_problem", label: "Sömnproblem" },
  { key: "anxiety_increase", label: "Ökad oro" },
  { key: "restlessness", label: "Rastlöshet" },
  { key: "appetite_change", label: "Aptitförändring" },
  { key: "libido_change", label: "Libidoförändring" },
];
