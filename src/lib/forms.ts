// PHQ-9, GAD-7, WHO-5 form definitions in Swedish

export type FormType = "phq9" | "gad7" | "who5";

export interface FormDef {
  type: FormType;
  title: string;
  intro: string;
  questions: string[];
  options: { label: string; value: number }[];
  maxRaw: number;
  scoreLabel: (raw: number) => string;
  toFinal?: (raw: number) => number; // WHO-5: raw*4 → 0-100
}

const PHQ_OPTIONS = [
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

const WHO_OPTIONS = [
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

export const FORMS: Record<FormType, FormDef> = { phq9: PHQ9, gad7: GAD7, who5: WHO5 };

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
