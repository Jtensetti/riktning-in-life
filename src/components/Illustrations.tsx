// Riktning illustrations — uses uploaded SVG assets via ?react import (vite-plugin-svgr style not enabled),
// so we use plain <img> imports for reliability + theming via colors baked in.

import startSequence from "@/assets/illustrations/riktning-start-sequence.svg";
import calmBreathing from "@/assets/illustrations/riktning-calm-breathing.svg";
import sleepMoon from "@/assets/illustrations/riktning-sleep-moon.svg";
import moveSoft from "@/assets/illustrations/riktning-move-soft.svg";
import journalThreeLines from "@/assets/illustrations/riktning-journal-three-lines.svg";
import thoughtLoop from "@/assets/illustrations/riktning-thought-loop.svg";
import careReport from "@/assets/illustrations/riktning-care-report.svg";
import focusMeaning from "@/assets/illustrations/riktning-focus-meaning.svg";
import weekTrend from "@/assets/illustrations/riktning-week-trend.svg";
import safetySupport from "@/assets/illustrations/riktning-safety-support.svg";
import baseline14 from "@/assets/illustrations/riktning-baseline-14days.svg";
import bodyScan from "@/assets/illustrations/riktning-body-scan.svg";
import checkinSliders from "@/assets/illustrations/riktning-checkin-sliders.svg";
import medicationLog from "@/assets/illustrations/riktning-medication-log.svg";
import cardPattern from "@/assets/illustrations/riktning-card-pattern.svg";

export const illustrations = {
  start: startSequence,
  breathing: calmBreathing,
  sleep: sleepMoon,
  move: moveSoft,
  journal: journalThreeLines,
  thoughtLoop,
  care: careReport,
  focus: focusMeaning,
  week: weekTrend,
  safety: safetySupport,
  baseline: baseline14,
  bodyScan,
  checkin: checkinSliders,
  medication: medicationLog,
  pattern: cardPattern,
} as const;

export type IllKey = keyof typeof illustrations;

interface Props {
  name: IllKey;
  className?: string;
  alt?: string;
}

export const Illustration = ({ name, className = "", alt = "" }: Props) => (
  <img
    src={illustrations[name]}
    alt={alt}
    aria-hidden={!alt}
    loading="lazy"
    className={className}
    draggable={false}
  />
);

// Map exercise category → illustration
export const categoryIll = (category: string): IllKey => {
  switch (category) {
    case "Kom igång": return "start";
    case "Lugna kroppen": return "breathing";
    case "Bryt ältande": return "thoughtLoop";
    case "Sov bättre": return "sleep";
    case "Rör dig mjukt": return "move";
    case "Skriv av dig": return "journal";
    case "Förbered vårdkontakt": return "care";
    default: return "focus";
  }
};

// Map color token → illustration (for recommended cards etc.)
export const colorIll = (color: string): IllKey => {
  switch (color) {
    case "blue": return "breathing";
    case "purple": return "sleep";
    case "pink": return "move";
    case "yellow": return "journal";
    case "green": return "care";
    case "orange": return "start";
    default: return "focus";
  }
};
