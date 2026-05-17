import { useState } from "react";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import type { RiskSignal, RiskSeverity } from "@/lib/riskSignals";

/**
 * "Att hålla ett öga på" — visar deterministiska risksignaler från
 * användarens data. Inga AI-formuleringar; allt är härlett från regler
 * i `lib/riskSignals.ts`.
 *
 * Tonen är stödjande, aldrig alarmerande. Färgkodning via semantiska
 * tokens. På de starkaste signalerna lägger vi en länk till krisplanen.
 */

const toneFor = (sev: RiskSeverity): { wrap: string; chip: string; Icon: typeof Info } => {
  switch (sev) {
    case "alert":
      return {
        wrap: "border-red-risk/40 bg-red-bg",
        chip: "bg-red-risk text-white",
        Icon: ShieldAlert,
      };
    case "warn":
      return {
        wrap: "border-orange-start/40 bg-orange-start/10",
        chip: "bg-orange-start text-white",
        Icon: AlertTriangle,
      };
    case "info":
      return {
        wrap: "border-border-soft bg-cream-card",
        chip: "bg-surface-alt text-text-secondary",
        Icon: Info,
      };
  }
};

const labelFor = (sev: RiskSeverity): string =>
  sev === "alert" ? "Viktigt" : sev === "warn" ? "Värt att se över" : "Info";

export interface RiskSignalsCardProps {
  signals: RiskSignal[];
  title?: string;
  /** Visa Krisplan-länk vid alert/warn-signaler. */
  showCrisisLink?: boolean;
  /** Max antal signaler att visa. */
  limit?: number;
}

export const RiskSignalsCard = ({
  signals,
  title = "Att hålla ett öga på",
  showCrisisLink = true,
  limit = 4,
}: RiskSignalsCardProps) => {
  const [openWhy, setOpenWhy] = useState<string | null>(null);
  if (signals.length === 0) return null;
  const shown = signals.slice(0, limit);
  const hasUrgent = shown.some((s) => s.severity === "alert" || s.severity === "warn");

  return (
    <section className="mb-7 animate-pop-in">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-xl">{title}</h3>
        <span className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider">
          Från din data
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {shown.map((s, i) => {
          const tone = toneFor(s.severity);
          const Icon = tone.Icon;
          const key = `${s.kind}-${i}`;
          const isOpen = openWhy === key;
          return (
            <article
              key={key}
              className={`rounded-3xl border-2 p-4 shadow-soft animate-pop-in ${tone.wrap}`}
              style={{ animationDelay: `var(--stagger-${Math.min(i, 4)})` }}
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="shrink-0 grid place-items-center w-10 h-10 rounded-2xl bg-surface/70"
                >
                  <Icon size={20} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h4 className="text-[15px] leading-tight font-extrabold flex-1">
                      {s.headline}
                    </h4>
                    <span
                      className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${tone.chip}`}
                    >
                      {labelFor(s.severity)}
                    </span>
                  </div>
                  <p className="text-xs leading-snug mb-1.5">{s.suggestion}</p>
                  <button
                    type="button"
                    onClick={() => setOpenWhy(isOpen ? null : key)}
                    aria-expanded={isOpen}
                    className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary press-soft underline-offset-2 hover:underline"
                  >
                    {isOpen ? "Dölj varför" : "Varför ser jag detta?"}
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-[12px] text-text-secondary leading-snug animate-fade-in-up">
                      {s.evidence}
                    </p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {showCrisisLink && hasUrgent && (
        <Link
          to="/krisplan"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-extrabold text-red-risk underline underline-offset-2"
        >
          Öppna min krisplan
        </Link>
      )}
    </section>
  );
};
