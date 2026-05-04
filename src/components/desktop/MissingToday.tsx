/**
 * MissingToday — mjuk lista över vad som ännu inte loggats idag.
 *
 * Visas bara på desktop som en del av Idag-cockpitens högerkolumn.
 * Tyst när allt finns. Aldrig skammande — språket är inbjudande:
 * "Vill du lägga till något litet?" snarare än "du har inte gjort X".
 *
 * Vi visar max 3 saknade saker — fler känns som checklista.
 */
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { AbstractIcon, type IconName } from "@/components/AbstractIcon";

type Item = {
  key: string;
  label: string;
  icon: IconName;
  to: string;
  color: string;
};

type Props = {
  hasCheckin: boolean;
  hasMovement: boolean;
  hasRecovery: boolean;
  hasJournal: boolean;
  hasSleepLogged: boolean;
};

export const MissingToday = ({
  hasCheckin, hasMovement, hasRecovery, hasJournal, hasSleepLogged,
}: Props) => {
  const navigate = useNavigate();

  const items: Item[] = [];
  if (!hasCheckin) {
    items.push({ key: "checkin", label: "Dagens check-in", icon: "blob-smile", to: "/checkin", color: "hsl(var(--orange-start))" });
  }
  if (!hasSleepLogged) {
    items.push({ key: "sleep", label: "Hur sov du i natt?", icon: "bed-soft", to: "/snabblogg?open=sleep", color: "hsl(var(--purple-sleep))" });
  }
  if (!hasMovement) {
    items.push({ key: "movement", label: "Lite rörelse", icon: "walk-figure", to: "/snabblogg", color: "hsl(var(--pink-move))" });
  }
  if (!hasRecovery) {
    items.push({ key: "recovery", label: "Lite återhämtning", icon: "heart-care", to: "/snabblogg", color: "hsl(var(--green-recovery))" });
  }
  if (!hasJournal) {
    items.push({ key: "journal", label: "Tre rader i journalen", icon: "pencil-soft", to: "/journal", color: "hsl(var(--yellow-journal))" });
  }

  if (items.length === 0) return null;

  const visible = items.slice(0, 3);

  return (
    <section className="rounded-3xl bg-surface border border-border-soft p-5">
      <h3 className="text-[15px] font-extrabold mb-1">Saknas idag</h3>
      <p className="text-sm text-text-secondary mb-3">Det räcker med en sak.</p>
      <ul className="space-y-1.5">
        {visible.map((it) => (
          <li key={it.key}>
            <button
              onClick={() => navigate(it.to)}
              className="w-full flex items-center gap-3 px-3 h-12 rounded-2xl bg-surface-alt/40 hover:bg-surface-alt press-soft text-left transition-colors"
            >
              <span
                className="shrink-0 w-9 h-9 rounded-xl grid place-items-center"
                style={{ background: `${it.color.replace("hsl(", "hsla(").replace(")", ", 0.14)")}` }}
              >
                <AbstractIcon name={it.icon} size={20} inline />
              </span>
              <span className="flex-1 text-sm font-extrabold">{it.label}</span>
              <ChevronRight size={16} className="text-text-secondary shrink-0" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
