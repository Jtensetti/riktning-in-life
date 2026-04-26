// Tidsanpassade mikro-startförslag som visas under state-kortet när det inte
// finns någon check-in idag. Tre korta chips per partOfDay — varje chip länkar
// till en relevant route. Hålls liten och deterministisk.

import type { PartOfDay } from "./timeContext";

export type QuickStart = {
  label: string;
  to: string;
};

const MORNING: QuickStart[] = [
  { label: "3 min upp ur sängen", to: "/ovningar" },
  { label: "8 min morgonstart", to: "/ovningar" },
  { label: "Logga sömn", to: "/snabblogg" },
];

const MIDDAY: QuickStart[] = [
  { label: "Snabblogga mående", to: "/snabblogg" },
  { label: "Rörelse 10 min", to: "/ovningar" },
  { label: "Bryt ältande", to: "/ovningar" },
];

const AFTERNOON: QuickStart[] = MIDDAY;

const EVENING: QuickStart[] = [
  { label: "Skriv tre rader", to: "/journal" },
  { label: "Kvällslandning", to: "/ovningar" },
  { label: "Spara dagen som den var", to: "/checkin" },
];

const NIGHT: QuickStart[] = [
  { label: "Andning 4 min", to: "/ovningar" },
  { label: "Imorgon-lista", to: "/journal" },
  { label: "Lägg undan analysen", to: "/ovningar" },
];

export const quickStartsFor = (p: PartOfDay): QuickStart[] => {
  switch (p) {
    case "morning": return MORNING;
    case "midday": return MIDDAY;
    case "afternoon": return AFTERNOON;
    case "evening": return EVENING;
    case "night": return NIGHT;
  }
};
