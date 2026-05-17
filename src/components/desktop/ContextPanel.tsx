import type { ReactNode } from "react";

/**
 * ContextPanel — höger kontextpanel på desktop.
 *
 * Används som `right`-slot i <WideLayout>. På mobil döljs den helt
 * (mobilflödet visar samma innehåll inline i huvudkolumnen om relevant).
 * På desktop fastnar den i top: 96px så den följer med scrollen.
 *
 * Lättviktig wrapper — barnen bestämmer själva sitt innehåll och styling.
 */
export interface ContextPanelProps {
  children: ReactNode;
  /** Rubrik ovanför panelen. */
  title?: string;
  /** Liten not under panelen ("Stannar uppe längs hela sidan"). */
  footnote?: string;
  /** Stäng av sticky-beteendet om panelen ska scrolla med flödet. */
  sticky?: boolean;
  /** Visa även på mobil (sällsynt — default göms den). */
  showOnMobile?: boolean;
}

export const ContextPanel = ({
  children,
  title,
  footnote,
  sticky = true,
  showOnMobile = false,
}: ContextPanelProps) => {
  return (
    <aside className={`${showOnMobile ? "" : "hidden lg:block"} min-w-0`}>
      <div className={`${sticky ? "lg:sticky lg:top-24" : ""} space-y-4`}>
        {title && (
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-text-secondary">
            {title}
          </h2>
        )}
        {children}
        {footnote && (
          <p className="text-[11px] text-text-secondary px-1">{footnote}</p>
        )}
      </div>
    </aside>
  );
};
