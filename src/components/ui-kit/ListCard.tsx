import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { IconTile } from "./IconTile";
import type { IconName } from "@/components/AbstractIcon";

/**
 * ListCard — neutral row for care, medication, forms, settings.
 *
 * Spec:
 *  - white/cream surface, radius 28, padding 20
 *  - IconTile left, title + meta, chevron right
 */
export interface ListCardProps {
  title: string;
  meta?: string;
  icon: IconName;
  /** Tone used for the IconTile only — surface stays neutral. */
  iconTone?:
    | "orange-start"
    | "yellow-journal"
    | "blue-calm"
    | "purple-sleep"
    | "green-recovery"
    | "pink-move"
    | "red-risk";
  trailing?: ReactNode;
  /** When omitted a chevron is shown if onClick is provided. */
  showChevron?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ListCard = ({
  title,
  meta,
  icon,
  iconTone = "blue-calm",
  trailing,
  showChevron,
  onClick,
  className = "",
}: ListCardProps) => {
  const Comp = onClick ? "button" : "div";
  const wantsChevron = showChevron ?? Boolean(onClick);
  return (
    <Comp
      onClick={onClick}
      className={`ui-card-list w-full text-left press-soft flex items-center gap-4 ${className}`}
    >
      <IconTile icon={icon} tone={iconTone} size={44} />
      <div className="flex-1 min-w-0">
        <h3 className="text-card-title leading-tight line-clamp-2">{title}</h3>
        {meta && <p className="text-meta text-text-secondary mt-1">{meta}</p>}
      </div>
      {trailing}
      {wantsChevron && !trailing && <ChevronRight size={22} className="shrink-0 text-text-secondary" />}
    </Comp>
  );
};
