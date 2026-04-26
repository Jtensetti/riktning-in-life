import { ClinicalCard } from "./ui-kit/ClinicalCard";

/**
 * SparseDataNotice — neutral notice shown at the top of the weekly
 * clinical report when the user has logged check-ins on too few days for
 * the data to be meaningful. Per plan: "no playful illustration inside
 * report body", clear note when sparse.
 */
export interface SparseDataNoticeProps {
  /** Days with at least one check-in in the report window. */
  daysWithCheckin: number;
  /** Total report window length (default 14). */
  windowDays?: number;
  /** Threshold under which we show the notice (default 7). */
  threshold?: number;
}

export const SparseDataNotice = ({
  daysWithCheckin,
  windowDays = 14,
  threshold = 7,
}: SparseDataNoticeProps) => {
  if (daysWithCheckin >= threshold) return null;
  return (
    <div className="mb-4">
      <ClinicalCard title="Begränsat underlag" meta={`${daysWithCheckin} / ${windowDays} dagar`}>
        Underlaget är begränsat: {daysWithCheckin} av {windowDays} dagar med check-in.
        Tolka siffror med försiktighet.
      </ClinicalCard>
    </div>
  );
};
