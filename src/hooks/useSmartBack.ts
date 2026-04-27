import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * useSmartBack — returns a function that navigates "back" to the most
 * sensible target.
 *
 * Strategy:
 *  1. If an active sequence is stored in sessionStorage (`riktning:sequence`),
 *     prefer the sequence detail page when the current route is an exercise
 *     inside that sequence.
 *  2. Otherwise, fall back to the provided `defaultTo` route.
 *  3. As a last resort, use `navigate(-1)` (browser history).
 *
 * This avoids the bug where "back" from an exercise opened via a sequence
 * dropped the user back into the flat exercise list instead of the
 * sequence overview.
 */
export interface SmartBackOptions {
  /** Where to go when there is no sequence context. */
  defaultTo: string;
  /** When inside an exercise route, the slug of the current exercise. */
  exerciseSlug?: string;
}

interface StoredSequence {
  slug: string;
  step: number;
  total: number;
  exerciseIds?: string[];
}

const readSequence = (): StoredSequence | null => {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("riktning:sequence");
    return raw ? (JSON.parse(raw) as StoredSequence) : null;
  } catch {
    return null;
  }
};

export const useSmartBack = ({ defaultTo, exerciseSlug }: SmartBackOptions) => {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    const seq = readSequence();
    const onExercisePage =
      location.pathname.startsWith("/ovningar/") || Boolean(exerciseSlug);
    if (seq && onExercisePage) {
      navigate(`/rutiner/${seq.slug}`);
      return;
    }
    if (defaultTo) {
      navigate(defaultTo);
      return;
    }
    navigate(-1);
  }, [navigate, location.pathname, defaultTo, exerciseSlug]);
};
