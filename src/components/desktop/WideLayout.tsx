import type { ReactNode } from "react";

/**
 * WideLayout — opt-in two-column layout for "workspace" pages on desktop.
 *
 * On mobile (and tablet): renders as a vertical stack — `left` first, then
 * `right`. Visually identical to today's vertical mobile layout.
 *
 * On desktop (≥lg): renders side-by-side. Default split is 1.4fr / 1fr,
 * giving the primary column a bit more room while keeping both readable.
 *
 * Pages decide for themselves when to use this. "Calm stream" pages
 * (Today, CrisisPlan, wizards, readers) don't — they keep the centered
 * 448px column on every breakpoint.
 *
 * Gap is generous (40px) so the two columns feel like distinct surfaces,
 * not a dense dashboard.
 */
export interface WideLayoutProps {
  left: ReactNode;
  right: ReactNode;
  /** Override the default 1.4/1 split. Pass any valid grid-template-columns. */
  columns?: string;
}

export const WideLayout = ({ left, right, columns = "1.4fr 1fr" }: WideLayoutProps) => {
  return (
    <div
      className="lg:grid lg:gap-10"
      style={{ gridTemplateColumns: undefined }}
    >
      <style>{`
        @media (min-width: 1024px) {
          .riktning-wide { grid-template-columns: ${columns}; }
        }
      `}</style>
      <div className="lg:contents">
        <div className="riktning-wide-left">{left}</div>
        <div className="riktning-wide-right mt-7 lg:mt-0">{right}</div>
      </div>
    </div>
  );
};
