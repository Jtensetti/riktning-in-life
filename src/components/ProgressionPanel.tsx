import type { ProgressionFact } from "@/lib/progression";

/**
 * "Din riktning" — kort lista med deterministiska progressionsfakta.
 * Designloop: card-quiet + befintliga semantiska färgklasser. Inga
 * dekorationer, ingen ny färg. Visas bara om vi har minst två fakta.
 */
export const ProgressionPanel = ({ facts }: { facts: ProgressionFact[] }) => {
  if (facts.length < 2) return null;
  return (
    <section className="card-quiet animate-fade-in-up">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-xl leading-tight">Din riktning</h3>
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
          Från din data
        </span>
      </div>
      <ul className="space-y-2.5">
        {facts.map((f, i) => {
          const toneText =
            f.tone === "good"
              ? "text-green-recovery"
              : f.tone === "warn"
                ? "text-red-risk"
                : "text-foreground";
          return (
            <li
              key={`${f.kind}-${i}`}
              className="flex items-baseline justify-between gap-3 animate-fade-in-up"
              style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
            >
              <div className="min-w-0">
                <p className="text-[12px] font-extrabold uppercase tracking-wider text-text-secondary truncate">
                  {f.label}
                </p>
                {f.sub && (
                  <p className="text-[11px] text-text-secondary leading-snug">{f.sub}</p>
                )}
              </div>
              <span className={`text-sm font-extrabold tabular-nums whitespace-nowrap ${toneText}`}>
                {f.value}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
