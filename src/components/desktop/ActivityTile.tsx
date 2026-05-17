/**
 * ActivityTile — kvadratiskt aktivitetskort som används i ActivityPicker,
 * Snabblogg och liknande "välj"-ytor. Liten primitive så att alla väljarytor
 * har samma DNA: kvadrat, ikon centrerad, titel under, favorit i hörn,
 * tydligt vald-state.
 *
 * Den bär *inte* historik/effekter — det hör hemma i `<DayMat>` (en logg)
 * eller `<EntryRow>` (en historikrad).
 */
import { AbstractIcon, type IconName } from "@/components/AbstractIcon";
import { Star, Check } from "lucide-react";

export type ActivityTileItem = {
  slug: string;
  label: string;
  icon: string;
  color: string;
};

type Props = {
  item: ActivityTileItem;
  isFav?: boolean;
  selected?: boolean;
  /** Liten metarad under titeln (t.ex. "Senast igår", "+ energi"). */
  meta?: string;
  onPick: () => void;
  onToggleFav?: (e: React.MouseEvent) => void;
  delayMs?: number;
};

const colorToken = (color: string): string => {
  switch (color) {
    case "orange": return "orange-start";
    case "blue": return "blue-calm";
    case "yellow": return "yellow-journal";
    case "purple": return "purple-sleep";
    case "pink": return "pink-move";
    case "green": return "green-recovery";
    default: return "blue-calm";
  }
};

export const ActivityTile = ({
  item,
  isFav = false,
  selected = false,
  meta,
  onPick,
  onToggleFav,
  delayMs,
}: Props) => {
  const token = colorToken(item.color);
  return (
    <div
      className={`relative animate-fade-in-up rounded-3xl bg-surface border-2 transition-colors press-soft ${
        selected ? "border-foreground" : "border-border-soft hover:border-foreground/30"
      }`}
      style={{ animationDelay: delayMs ? `${delayMs}ms` : undefined }}
    >
      <button
        onClick={onPick}
        className="w-full text-left p-3 flex flex-col items-center justify-between aspect-square min-h-[104px]"
        aria-pressed={selected}
        aria-label={item.label}
      >
        <div
          className="w-12 h-12 rounded-2xl grid place-items-center mt-1"
          style={{ background: `hsl(var(--${token}) / 0.16)` }}
          aria-hidden
        >
          <AbstractIcon
            name={item.icon as IconName}
            size={26}
            color={`hsl(var(--${token}))`}
          />
        </div>
        <div className="w-full text-center mt-2 min-w-0">
          <p className="text-[13px] leading-[16px] font-extrabold text-foreground line-clamp-2 break-words">
            {item.label}
          </p>
          {meta && (
            <p className="text-[10px] font-bold text-text-secondary mt-0.5 truncate">
              {meta}
            </p>
          )}
        </div>
      </button>

      {onToggleFav && (
        <button
          onClick={onToggleFav}
          aria-label={isFav ? "Ta bort favorit" : "Spara som favorit"}
          className="absolute top-1.5 right-1.5 w-7 h-7 grid place-items-center rounded-full press-soft text-foreground"
          style={{ opacity: isFav ? 1 : 0.35 }}
        >
          <Star size={15} className={isFav ? "fill-current" : ""} strokeWidth={2.4} />
        </button>
      )}

      {selected && (
        <span
          aria-hidden
          className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-foreground text-background grid place-items-center"
        >
          <Check size={14} strokeWidth={3} />
        </span>
      )}
    </div>
  );
};
