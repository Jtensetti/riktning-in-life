import { type ReactNode, useMemo } from "react";

interface Props {
  /** Förändras signaturen → barnet remounteras och fadar/animeras in på nytt. */
  signature: string | number;
  children: ReactNode;
  className?: string;
}

/**
 * Mjuk transition-wrapper för diagram. När `signature` byts (ny logg sparad,
 * ny vecka vald, datafilter ändrat) re-mountar vi innehållet med en kort
 * fade/translate via befintlig `animate-fade-in`, så Recharts spelar sin
 * "grow-from-zero"-animation igen och hela kortet känns levande.
 *
 * Respekterar `prefers-reduced-motion` automatiskt eftersom `animate-fade-in`
 * inte appliceras när användaren har reducerad rörelse i sin OS-inställning
 * (handhas av Tailwind/CSS i index.css).
 */
export const AnimatedChart = ({ signature, children, className = "" }: Props) => {
  // useMemo så vi inte gör extra arbete — bara byter när signaturen ändras.
  const k = useMemo(() => String(signature), [signature]);
  return (
    <div key={k} className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
};

/**
 * Hjälpare för att bygga en stabil, kompakt signatur från ett dataset.
 * - Längd, första/sista nyckel, summa av värden.
 * Räcker för att upptäcka "ny logg/vecka" utan att trigga vid no-op renders.
 */
export const buildChartSignature = (
  rows: Array<{ value?: number | null; label?: string; key?: string; iso?: string; date?: string }>,
  extra?: string | number,
): string => {
  if (!rows.length) return `empty${extra != null ? `-${extra}` : ""}`;
  const first = rows[0];
  const last = rows[rows.length - 1];
  let sum = 0;
  for (const r of rows) sum += r.value ?? 0;
  const head = first.key ?? first.iso ?? first.date ?? first.label ?? "";
  const tail = last.key ?? last.iso ?? last.date ?? last.label ?? "";
  return `${rows.length}|${head}|${tail}|${sum}${extra != null ? `|${extra}` : ""}`;
};
