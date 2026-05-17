import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { WeeklyPlaybook, PlaybookStep } from "@/lib/weeklyPlaybook";

/**
 * Veckans playbook — sammanfattar riktning + 3–5 konkreta steg för
 * nästa 7 dagar. Designloop: card-quiet och semantiska tokens, inga
 * nya färger eller komponenter. Stegen kan expanderas för att läsa
 * "Varför" + "Första lilla steget".
 */
const toneTextClass = (tone: PlaybookStep["tone"]): string => {
  switch (tone) {
    case "alert":
      return "text-red-risk";
    case "warn":
      return "text-orange-deep";
    case "good":
      return "text-green-recovery";
    case "info":
    default:
      return "text-text-secondary";
  }
};

const toneDotClass = (tone: PlaybookStep["tone"]): string => {
  switch (tone) {
    case "alert":
      return "bg-red-risk";
    case "warn":
      return "bg-orange-deep";
    case "good":
      return "bg-green-recovery";
    case "info":
    default:
      return "bg-text-secondary/50";
  }
};

const directionToneClass = (tone: "good" | "neutral" | "warn"): string => {
  switch (tone) {
    case "good":
      return "text-green-recovery";
    case "warn":
      return "text-orange-deep";
    case "neutral":
    default:
      return "text-foreground";
  }
};

export const WeeklyPlaybookCard = ({ playbook }: { playbook: WeeklyPlaybook }) => {
  const [open, setOpen] = useState<string | null>(playbook.steps[0]?.id ?? null);

  if (playbook.steps.length === 0) return null;

  return (
    <section className="card-quiet animate-fade-in-up">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-xl leading-tight">Veckans playbook</h3>
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
          Nästa 7 dagar
        </span>
      </div>

      {/* Riktning — kort sammanfattning */}
      <div className="mb-4">
        <p className={`text-card-title leading-tight ${directionToneClass(playbook.direction.tone)}`}>
          {playbook.direction.headline}
        </p>
        {playbook.direction.sub && (
          <p className="text-body text-text-secondary mt-1 leading-snug">
            {playbook.direction.sub}
          </p>
        )}
      </div>

      {/* Steg */}
      <ol className="space-y-2">
        {playbook.steps.map((step, i) => {
          const isOpen = open === step.id;
          return (
            <li
              key={step.id}
              className="rounded-2xl bg-surface-alt/60 animate-fade-in-up"
              style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : step.id)}
                className="w-full flex items-center gap-3 px-3.5 py-3 text-left press-soft"
                aria-expanded={isOpen}
              >
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-extrabold text-white shrink-0 ${toneDotClass(step.tone)}`}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span className="flex-1 min-w-0">
                  <p className="text-[15px] font-extrabold leading-tight truncate">{step.title}</p>
                  {!isOpen && (
                    <p className={`text-[12px] leading-snug truncate ${toneTextClass(step.tone)}`}>
                      {step.why}
                    </p>
                  )}
                </span>
                <ChevronRight
                  size={18}
                  className={`shrink-0 text-text-secondary transition-transform ${isOpen ? "rotate-90" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="px-3.5 pb-3 -mt-1 space-y-2 animate-fade-in-up">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
                      Varför
                    </p>
                    <p className={`text-body leading-snug ${toneTextClass(step.tone)}`}>{step.why}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
                      Första lilla steget
                    </p>
                    <p className="text-body leading-snug">{step.micro}</p>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
};
