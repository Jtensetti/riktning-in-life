import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AbstractIcon } from "./AbstractIcon";

export type Evidence = { source: string; year?: number; url?: string };

interface Props {
  mechanism: string | null | undefined;
  evidence: Evidence[];
}

export const MechanismCard = ({ mechanism, evidence }: Props) => {
  const [open, setOpen] = useState(false);
  if (!mechanism) return null;

  return (
    <div className="card-cream p-4 mb-4 animate-fade-in-up">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 text-left press-soft"
        aria-expanded={open}
      >
        <div className="shrink-0">
          <AbstractIcon name="spark" size={40} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
            Forskningsstöd
          </p>
          <p className="text-sm font-extrabold">Varför funkar det?</p>
        </div>
        <ChevronDown
          size={20}
          className={`text-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-3 pt-3 border-t border-border-soft animate-fade-in-up">
          <p className="text-sm leading-relaxed text-foreground/90 mb-3">{mechanism}</p>
          {evidence.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">
                Stöd i forskningen
              </p>
              {evidence.map((e, i) => (
                <p key={i} className="text-xs text-text-secondary leading-snug">
                  · {e.source}{e.year ? ` (${e.year})` : ""}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
