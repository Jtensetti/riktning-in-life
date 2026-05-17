/**
 * Severity → tone-mapping för skattningar (PHQ-9, GAD-7, WHO-5, MADRS, KEDS, BBQ-12).
 *
 * Använder strängarna som `scoreLabel()` i `src/lib/forms.ts` returnerar och
 * mappar dem till semantiska färg-tokens så vi kan rendera en konsekvent
 * "badge" i alla vårdvyer utan att duplicera ifs på varje plats.
 */

export type SeverityTone = "green" | "yellow" | "orange" | "red" | "neutral";

const NORMALIZE = (s: string): string => s.trim().toLowerCase();

/**
 * Mappar ett scoreLabel ("Måttlig", "Svår", "Mycket lågt välbefinnande" …)
 * till en tone-token. Okända labels faller tillbaka på "neutral".
 */
export const severityToneFor = (label: string | undefined | null): SeverityTone => {
  if (!label) return "neutral";
  const s = NORMALIZE(label);

  // Direkt-träffar (PHQ-9 / GAD-7)
  if (s.startsWith("minimal") || s.startsWith("lindrig")) return "green";
  if (s.startsWith("måttlig") || s.startsWith("medelsvår")) return "orange";
  if (s.startsWith("svår")) return "red";

  // WHO-5 (välbefinnande — högre = bättre)
  if (s.includes("mycket lågt")) return "red";
  if (s.includes("lågt välbefinnande")) return "orange";
  if (s.includes("nedsatt")) return "yellow";
  if (s.includes("gott") || s.includes("god")) return "green";

  // KEDS / MADRS-aktiga
  if (s.includes("normal")) return "green";
  if (s.includes("misstanke")) return "yellow";
  if (s.includes("utmattning")) return "orange";

  // BBQ-12 (livskvalitet — högre = bättre)
  if (s.includes("låg livskvalitet")) return "orange";
  if (s.includes("god livskvalitet")) return "green";
  if (s.includes("hög livskvalitet")) return "green";

  return "neutral";
};

/** Bg-class + text-class per tone. Använder semantiska tokens. */
export const severityBadgeClasses = (tone: SeverityTone): { bg: string; text: string; dot: string } => {
  switch (tone) {
    case "green":
      return { bg: "bg-green-recovery/15", text: "text-green-recovery", dot: "bg-green-recovery" };
    case "yellow":
      return { bg: "bg-yellow-journal/25", text: "text-orange-deep", dot: "bg-yellow-journal" };
    case "orange":
      return { bg: "bg-orange-start/15", text: "text-orange-deep", dot: "bg-orange-start" };
    case "red":
      return { bg: "bg-red-bg", text: "text-red-risk", dot: "bg-red-risk" };
    case "neutral":
      return { bg: "bg-surface-alt", text: "text-text-secondary", dot: "bg-text-secondary" };
  }
};
