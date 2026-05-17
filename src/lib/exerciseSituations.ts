/**
 * Situationsbibliotek för Utforska.
 *
 * Istället för att gruppera övningar efter typ ("Andning", "Skriva") visar vi
 * dem efter situation användaren faktiskt är i. En kategori kan höra till
 * flera situationer.
 */

export type SituationKey =
  | "tankar"
  | "spand"
  | "igang"
  | "kvall"
  | "forsta"
  | "vardag";

export type Situation = {
  key: SituationKey;
  title: string;
  blurb: string;
  /** Övningskategorier som hör till denna situation. */
  categories: string[];
  /** Semantisk färgton (tailwind bg-class) för pillen/headern. */
  tone: "blue" | "green" | "orange" | "purple" | "pink" | "yellow";
};

export const SITUATIONS: Situation[] = [
  {
    key: "tankar",
    title: "När tankarna snurrar",
    blurb: "Bromsa ältandet och få ner volymen på huvudet.",
    categories: ["Bryt ältande", "Skriv av dig"],
    tone: "pink",
  },
  {
    key: "spand",
    title: "När kroppen är spänd",
    blurb: "Mjuka övningar som löser upp anspänning.",
    categories: ["Lugna kroppen", "Rör dig mjukt"],
    tone: "blue",
  },
  {
    key: "igang",
    title: "När du behöver komma igång",
    blurb: "Små första steg som sänker tröskeln.",
    categories: ["Kom igång", "Sociala mikrosteg"],
    tone: "orange",
  },
  {
    key: "kvall",
    title: "När kvällen behöver landa",
    blurb: "Förbered kropp och tankar för sömn.",
    categories: ["Sov bättre", "Lugna kroppen"],
    tone: "purple",
  },
  {
    key: "forsta",
    title: "När du vill förstå dig själv",
    blurb: "Skriv, reflektera, förbered nästa vårdkontakt.",
    categories: ["Skriv av dig", "Förbered vårdkontakt"],
    tone: "yellow",
  },
  {
    key: "vardag",
    title: "När du vill ta hand om vardagen",
    blurb: "Stadiga rutiner kring mat, dygn och trygghet.",
    categories: ["Mat & humör", "Trygghet"],
    tone: "green",
  },
];

/** Hämtar de situationer en kategori hör till. */
export const situationsForCategory = (category: string): Situation[] =>
  SITUATIONS.filter((s) => s.categories.includes(category));

/** Filtrerar övningar (med fältet category) till en situation. */
export const exercisesForSituation = <T extends { category: string }>(
  exercises: T[],
  situation: Situation,
): T[] => exercises.filter((e) => situation.categories.includes(e.category));
