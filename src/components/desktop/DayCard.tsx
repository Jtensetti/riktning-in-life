/**
 * DayCard — återanvändbar dag-grupperad kortrad för historik-vyer.
 *
 * Visar en datumrubrik (eller "Idag"/"Igår"), valfri sammanfattnings-mätare,
 * och en lista av "pillar" — aktiviteter, övningar, check-in. Pill-typerna
 * är generiska så samma kort kan användas i Insikter (dag-för-dag),
 * Snabblogg-historik och framtida journal-listor.
 *
 * Inget data-fetching här — anroparen mappar sina rådata till `DayCardItem[]`.
 */
import { AbstractIcon, type IconName } from "@/components/AbstractIcon";
import { iconForActivity } from "@/lib/icons";
import { ChevronRight } from "lucide-react";

export type DayCardItemTone = "orange" | "blue" | "yellow" | "purple" | "pink" | "green" | "neutral";

export type DayCardItem = {
  id: string;
  /** Visningsetikett, t.ex. "Promenad" eller "Morgonritual". */
  label: string;
  /** "spark", "moon-soft" osv. Sträng = activity-slug, mappas via iconForActivity. */
  icon?: string;
  iconName?: IconName;
  tone?: DayCardItemTone;
  /** Liten suffix-text, t.ex. "12 min" eller "7.5h sömn". */
  meta?: string;
};

interface Props {
  /** ISO-datum YYYY-MM-DD. */
  iso: string;
  isToday?: boolean;
  /** Totalsumma som visas till höger om datum, t.ex. "32 min". */
  totalLabel?: string;
  items: DayCardItem[];
  /** Visas om items är tomt. Default = "Inget loggat". */
  emptyText?: string;
  /** Valfri CTA-knapp som visas när items är tomt OCH isToday=true. */
  emptyCta?: { label: string; onClick: () => void };
  /** Index för stagger-animation. */
  index?: number;
  /** Klick på hela kortet (öppna detaljvy etc). Saknas = ej klickbart. */
  onClick?: () => void;
}

const toneClass = (tone: DayCardItemTone): string => {
  switch (tone) {
    case "orange": return "bg-orange-start text-white";
    case "blue": return "bg-blue-calm text-white";
    case "yellow": return "bg-yellow-journal text-foreground";
    case "purple": return "bg-purple-sleep text-white";
    case "pink": return "bg-pink-move text-white";
    case "green": return "bg-green-recovery text-white";
    case "neutral": return "bg-surface border border-border-soft text-text-secondary";
  }
};

const dayLabelFor = (iso: string, isToday?: boolean): string => {
  if (isToday) return "Idag";
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (diff === 1) return "Igår";
  return d.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "short" });
};

export const DayCard = ({
  iso,
  isToday,
  totalLabel,
  items,
  emptyText = "Inget loggat",
  emptyCta,
  index = 0,
  onClick,
}: Props) => {
  const isEmpty = items.length === 0;
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`w-full text-left card-cream p-3.5 animate-fade-in-up ${onClick ? "press-soft" : ""}`}
      style={{ animationDelay: `var(--stagger-${Math.min(index, 4)})` }}
    >
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <p className={`text-sm font-extrabold capitalize ${isToday ? "text-orange-deep" : ""}`}>
          {dayLabelFor(iso, isToday)}
        </p>
        {totalLabel && (
          <p className="text-[11px] font-extrabold text-text-secondary tabular-nums">{totalLabel}</p>
        )}
      </div>

      {isEmpty ? (
        emptyCta && isToday ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-text-secondary">{emptyText} — börja här:</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); emptyCta.onClick(); }}
              className="shrink-0 inline-flex items-center gap-1 rounded-full bg-foreground text-background px-3 py-1.5 text-[11px] font-extrabold press-soft shadow-card"
            >
              {emptyCta.label}
              <ChevronRight size={12} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <p className="text-xs text-text-secondary italic">{emptyText}</p>
        )
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((it) => {
            const tone = it.tone ?? "neutral";
            const iconName: IconName = it.iconName ?? (it.icon ? iconForActivity(it.icon) : "spark");
            return (
              <span
                key={it.id}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold shadow-card ${toneClass(tone)}`}
              >
                <AbstractIcon name={iconName} size={12} color="currentColor" />
                <span className="truncate max-w-[140px]">{it.label}</span>
                {it.meta && <span className="opacity-80">· {it.meta}</span>}
              </span>
            );
          })}
        </div>
      )}
    </Wrapper>
  );
};
