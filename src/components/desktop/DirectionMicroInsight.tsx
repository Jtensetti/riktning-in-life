/**
 * DirectionMicroInsight — en rad text på Idag som jämför idag mot
 * 7-dagars-snittet. Bara där för att ge "så här hänger dagen och
 * veckan ihop"-känsla utan att kräva att man öppnar Insikter.
 *
 * Komponenten är tyst när det inte finns nog data eller när dagens
 * värden inte avviker — vi vill aldrig pumpa ut "stabilt"-text.
 */
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

type Props = {
  todayMood: number | null;
  todayAnxiety: number | null;
  todayEnergy: number | null;
  /** 7-dagars snitt (exklusive idag). null = för lite data. */
  weekMood: number | null;
  weekAnxiety: number | null;
  weekEnergy: number | null;
};

type Verdict = {
  label: string;
  tone: "good" | "warn" | "neutral";
  dir: "up" | "down" | "flat";
};

/** Hur stor förändring som krävs för att vi ska säga något (skala 0–10). */
const NOISE = 1.0;

const compare = (
  today: number | null,
  week: number | null,
  goodWhenLower: boolean,
  metric: string,
): Verdict | null => {
  if (today == null || week == null) return null;
  const delta = today - week;
  if (Math.abs(delta) < NOISE) return null;
  const improved = goodWhenLower ? delta < 0 : delta > 0;
  const dir: "up" | "down" = delta > 0 ? "up" : "down";
  const tone: "good" | "warn" = improved ? "good" : "warn";
  // Mjukt språk — "verkar", inte tvärsäkra påståenden.
  if (metric === "mood") {
    return { label: improved ? "Lite lättare än veckans snitt" : "Lite tyngre än veckans snitt", tone, dir };
  }
  if (metric === "anxiety") {
    return { label: improved ? "Mindre oro än vanligt" : "Mer oro än vanligt", tone, dir };
  }
  if (metric === "energy") {
    return { label: improved ? "Mer energi än vanligt" : "Mindre energi än vanligt", tone, dir };
  }
  return null;
};

export const DirectionMicroInsight = ({
  todayMood, todayAnxiety, todayEnergy,
  weekMood, weekAnxiety, weekEnergy,
}: Props) => {
  // Plocka starkaste signalen — vi visar bara en rad åt gången.
  const candidates = [
    compare(todayMood, weekMood, true, "mood"),
    compare(todayAnxiety, weekAnxiety, true, "anxiety"),
    compare(todayEnergy, weekEnergy, false, "energy"),
  ].filter((v): v is Verdict => v != null);

  if (candidates.length === 0) return null;
  const v = candidates[0];

  const Icon = v.dir === "up" ? TrendingUp : v.dir === "down" ? TrendingDown : Minus;
  const toneClass =
    v.tone === "good"
      ? "bg-green-recovery/15 text-green-recovery"
      : v.tone === "warn"
        ? "bg-red-bg text-red-risk"
        : "bg-surface-alt text-text-secondary";

  return (
    <div className={`rounded-2xl ${toneClass} px-4 py-3 flex items-center gap-2.5`}>
      <Icon size={18} strokeWidth={2.4} className="shrink-0" />
      <span className="text-sm font-extrabold leading-tight">{v.label}</span>
    </div>
  );
};
