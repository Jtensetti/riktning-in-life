import type { ReactNode } from "react";

/**
 * WideLayout — opt-in two-column layout for "workspace" pages on desktop.
 *
 * Mobile (and tablet, < lg): renders as a vertical stack — `left` first,
 * then `right`. Visually identical to today's vertical mobile layout.
 *
 * Desktop (≥ lg): renders side-by-side with a generous 40px gap. The
 * default split is 1.4fr / 1fr so the primary column has slightly more
 * room while keeping both readable.
 *
 * Pages must also pass `wide` to <AppShell> so the surrounding column is
 * widened from 448px to ~1100px. Without `wide`, this layout still works
 * but each column will be cramped.
 */
export interface WideLayoutProps {
  left: ReactNode;
  right: ReactNode;
  /** Override the default 1.4/1 split. */
  split?: "balanced" | "primary-heavy" | "aside" | "even";
}

const SPLIT_TO_GRID: Record<NonNullable<WideLayoutProps["split"]>, string> = {
  balanced: "lg:grid-cols-[1.4fr_1fr]",
  "primary-heavy": "lg:grid-cols-[1.7fr_1fr]",
  aside: "lg:grid-cols-[1.5fr_1fr]",
  even: "lg:grid-cols-2",
};

export const WideLayout = ({ left, right, split = "balanced" }: WideLayoutProps) => {
  return (
    <div className={`lg:grid lg:gap-10 ${SPLIT_TO_GRID[split]}`}>
      <div className="min-w-0">{left}</div>
      <div className="mt-7 lg:mt-0 min-w-0">{right}</div>
    </div>
  );
};
