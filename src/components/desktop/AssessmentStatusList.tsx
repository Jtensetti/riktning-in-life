/**
 * AssessmentStatusList — visar senaste resultatet per veckoskattning
 * med severity-badge (semantisk färg). Används i Vårds högerkolumn för
 * att förvandla "rad-status" till en mänsklig översikt:
 *
 *   PHQ-9   ●●○○ Måttlig     14/27 · 3d sedan
 *
 * Mobilen visar samma data i listraderna under "Veckoskattningar",
 * så på mobil renderas den inte (komponenten styr ej egen dölj-logik —
 * Vard.tsx wrappar den i `hidden lg:block` om så önskas).
 */
import { FORMS, type FormType } from "@/lib/forms";
import { severityToneFor, severityBadgeClasses } from "@/lib/severity";

type WeeklyFormLite = { type: string; total_score: number; date: string };

interface Props {
  forms: WeeklyFormLite[];
  /** Vilka skattningar som ska visas, i visningsordning. */
  types?: FormType[];
  onOpen?: (type: FormType) => void;
}

const daysSince = (iso: string): string => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diff <= 0) return "idag";
  if (diff === 1) return "1d sedan";
  if (diff < 30) return `${diff}d sedan`;
  return `${Math.floor(diff / 30)}mån sedan`;
};

export const AssessmentStatusList = ({
  forms,
  types = ["phq9", "gad7", "who5"],
  onOpen,
}: Props) => {
  const latestOf = (t: FormType) =>
    forms.find((f) => f.type === t);

  return (
    <ul className="space-y-2">
      {types.map((t) => {
        const f = FORMS[t];
        const last = latestOf(t);
        const label = last ? f.scoreLabel(last.total_score) : null;
        const tone = severityToneFor(label);
        const badge = severityBadgeClasses(tone);
        const final = last && f.toFinal ? f.toFinal(last.total_score) : last?.total_score;
        const denom = f.toFinal ? "/100" : `/${f.maxRaw}`;

        return (
          <li key={t}>
            <button
              type="button"
              onClick={onOpen ? () => onOpen(t) : undefined}
              disabled={!onOpen}
              className={`w-full text-left rounded-2xl bg-surface border border-border-soft p-3 ${onOpen ? "press-soft" : "cursor-default"}`}
            >
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-[13px] font-extrabold uppercase tracking-wider">
                  {f.title.split(" ")[0]}
                </span>
                {last ? (
                  <span className="text-[11px] font-bold text-text-secondary tabular-nums">
                    {final}{denom} · {daysSince(last.date)}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-text-secondary">Aldrig</span>
                )}
              </div>
              {last && label ? (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${badge.bg} ${badge.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} aria-hidden />
                  {label}
                </span>
              ) : (
                <span className="text-[11px] text-text-secondary">Inte gjord ännu</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
};
